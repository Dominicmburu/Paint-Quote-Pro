import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json

from models import db
from models.user import User
from models.project import Project
from models.quote import Quote
from services.quote_generator import QuoteGenerator
from utils.decorators import require_active_subscription

quotes_bp = Blueprint('quotes', __name__)

@quotes_bp.route('/project/<int:project_id>', methods=['POST'])
@jwt_required()
@require_active_subscription
def generate_quote(project_id):
    """Generate a quote for a project"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if project.status not in ['ready', 'completed']:
            return jsonify({
                'error': 'Project must be analyzed before generating quotes',
                'current_status': project.status
            }), 400
        
        data = request.get_json()
        
        # Validate quote data
        required_fields = ['title', 'line_items']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        line_items = data['line_items']
        if not isinstance(line_items, list) or not line_items:
            return jsonify({'error': 'line_items must be a non-empty list'}), 400
        
        # Calculate totals
        subtotal = 0.0
        for item in line_items:
            if not all(key in item for key in ['description', 'quantity', 'unit_price']):
                return jsonify({'error': 'Each line item must have description, quantity, and unit_price'}), 400
            
            quantity = float(item['quantity'])
            unit_price = float(item['unit_price'])
            item_total = quantity * unit_price
            item['total'] = round(item_total, 2)
            subtotal += item_total
        
        # Calculate VAT
        vat_rate = user.company.vat_rate if user.company else 0.20
        vat_amount = subtotal * vat_rate
        total_amount = subtotal + vat_amount
        
        # Create quote
        quote = Quote(
            quote_number=Quote.generate_quote_number(),
            title=data['title'],
            description=data.get('description', ''),
            subtotal=round(subtotal, 2),
            vat_amount=round(vat_amount, 2),
            total_amount=round(total_amount, 2),
            line_items=line_items,
            project_id=project_id,
            valid_until=datetime.utcnow() + timedelta(days=data.get('valid_days', 30))
        )
        
        db.session.add(quote)
        db.session.flush()  # Get quote ID
        
        # Generate PDF
        quote_generator = QuoteGenerator()
        pdf_path = quote_generator.generate_quote_pdf(
            quote=quote,
            project=project,
            company=user.company,
            output_dir=os.path.join(
                current_app.config['RESULTS_FOLDER'],
                str(user.company_id),
                str(project_id)
            )
        )
        
        quote.pdf_path = pdf_path
        project.quote_pdf_path = pdf_path
        
        # Update project quote data
        project.quote_data = {
            'quote_id': quote.id,
            'subtotal': quote.subtotal,
            'vat_amount': quote.vat_amount,
            'total_amount': quote.total_amount,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quote generated successfully',
            'quote': quote.to_dict(),
            'pdf_path': pdf_path
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate quote error: {e}')
        return jsonify({'error': 'Failed to generate quote'}), 500

@quotes_bp.route('/project/<int:project_id>/auto-generate', methods=['POST'])
@jwt_required()
@require_active_subscription
def auto_generate_quote(project_id):
    """Auto-generate a quote based on project analysis"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if not project.floor_plan_analysis:
            return jsonify({
                'error': 'Project must have floor plan analysis to auto-generate quote'
            }), 400
        
        data = request.get_json()
        quote_settings = data.get('quote_settings', {})
        
        # Generate line items from analysis
        line_items = []
        analysis = project.floor_plan_analysis
        
        # Get surface areas from analysis
        surface_areas = analysis.get('surface_areas', {})
        rooms = surface_areas.get('rooms', {})
        totals = surface_areas.get('totals', {})
        
        # Paint pricing (configurable)
        paint_prices = quote_settings.get('paint_prices', {
            'primer_per_m2': 3.50,
            'paint_per_m2': 4.20,
            'ceiling_paint_per_m2': 3.80
        })
        
        # Labor pricing (configurable)
        labor_prices = quote_settings.get('labor_prices', {
            'prep_per_m2': 2.00,
            'painting_per_m2': 3.50,
            'ceiling_per_m2': 3.20
        })
        
        # Generate line items for each room
        for room_name, room_data in rooms.items():
            floor_area = room_data.get('floor_area_m2', 0)
            wall_area = room_data.get('wall_area_m2', 0)
            ceiling_area = room_data.get('ceiling_area_m2', 0)
            
            if wall_area > 0:
                # Wall preparation
                line_items.append({
                    'description': f'{room_name} - Wall Preparation',
                    'quantity': wall_area,
                    'unit': 'm²',
                    'unit_price': labor_prices['prep_per_m2'],
                    'total': round(wall_area * labor_prices['prep_per_m2'], 2)
                })
                
                # Wall primer
                line_items.append({
                    'description': f'{room_name} - Wall Primer',
                    'quantity': wall_area,
                    'unit': 'm²',
                    'unit_price': paint_prices['primer_per_m2'],
                    'total': round(wall_area * paint_prices['primer_per_m2'], 2)
                })
                
                # Wall paint
                line_items.append({
                    'description': f'{room_name} - Wall Paint (2 coats)',
                    'quantity': wall_area,
                    'unit': 'm²',
                    'unit_price': paint_prices['paint_per_m2'],
                    'total': round(wall_area * paint_prices['paint_per_m2'], 2)
                })
                
                # Wall painting labor
                line_items.append({
                    'description': f'{room_name} - Wall Painting Labor',
                    'quantity': wall_area,
                    'unit': 'm²',
                    'unit_price': labor_prices['painting_per_m2'],
                    'total': round(wall_area * labor_prices['painting_per_m2'], 2)
                })
            
            if ceiling_area > 0:
                # Ceiling paint
                line_items.append({
                    'description': f'{room_name} - Ceiling Paint',
                    'quantity': ceiling_area,
                    'unit': 'm²',
                    'unit_price': paint_prices['ceiling_paint_per_m2'],
                    'total': round(ceiling_area * paint_prices['ceiling_paint_per_m2'], 2)
                })
                
                # Ceiling painting labor
                line_items.append({
                    'description': f'{room_name} - Ceiling Painting Labor',
                    'quantity': ceiling_area,
                    'unit': 'm²',
                    'unit_price': labor_prices['ceiling_per_m2'],
                    'total': round(ceiling_area * labor_prices['ceiling_per_m2'], 2)
                })
        
        # Add general items
        if totals.get('total_floor_area_m2', 0) > 0:
            line_items.append({
                'description': 'Floor Protection & Cleanup',
                'quantity': 1,
                'unit': 'job',
                'unit_price': quote_settings.get('cleanup_fee', 150.00),
                'total': quote_settings.get('cleanup_fee', 150.00)
            })
        
        # Calculate totals
        subtotal = sum(item['total'] for item in line_items)
        vat_rate = user.company.vat_rate if user.company else 0.20
        vat_amount = subtotal * vat_rate
        total_amount = subtotal + vat_amount
        
        # Create quote
        quote_title = data.get('title', f"Paint Quote - {project.name}")
        quote_description = data.get('description', f"Comprehensive painting quote for {project.name} based on AI floor plan analysis.")
        
        quote = Quote(
            quote_number=Quote.generate_quote_number(),
            title=quote_title,
            description=quote_description,
            subtotal=round(subtotal, 2),
            vat_amount=round(vat_amount, 2),
            total_amount=round(total_amount, 2),
            line_items=line_items,
            project_id=project_id,
            valid_until=datetime.utcnow() + timedelta(days=data.get('valid_days', 30))
        )
        
        db.session.add(quote)
        db.session.flush()
        
        # Generate PDF
        quote_generator = QuoteGenerator()
        pdf_path = quote_generator.generate_quote_pdf(
            quote=quote,
            project=project,
            company=user.company,
            output_dir=os.path.join(
                current_app.config['RESULTS_FOLDER'],
                str(user.company_id),
                str(project_id)
            )
        )
        
        quote.pdf_path = pdf_path
        project.quote_pdf_path = pdf_path
        project.quote_data = {
            'quote_id': quote.id,
            'subtotal': quote.subtotal,
            'vat_amount': quote.vat_amount,
            'total_amount': quote.total_amount,
            'generated_at': datetime.utcnow().isoformat(),
            'auto_generated': True
        }
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quote auto-generated successfully',
            'quote': quote.to_dict(),
            'line_items_count': len(line_items),
            'pdf_path': pdf_path
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Auto-generate quote error: {e}')
        return jsonify({'error': 'Failed to auto-generate quote'}), 500

@quotes_bp.route('/<int:quote_id>', methods=['GET'])
@jwt_required()
def get_quote(quote_id):
    """Get a specific quote"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        return jsonify({
            'quote': quote.to_dict(),
            'project': quote.project.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get quote error: {e}')
        return jsonify({'error': 'Failed to get quote'}), 500

@quotes_bp.route('/<int:quote_id>', methods=['PUT'])
@jwt_required()
def update_quote(quote_id):
    """Update a quote"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        if quote.status in ['sent', 'accepted']:
            return jsonify({'error': 'Cannot modify sent or accepted quotes'}), 400
        
        data = request.get_json()
        
        # Update quote fields
        if 'title' in data:
            quote.title = data['title']
        if 'description' in data:
            quote.description = data['description']
        if 'line_items' in data:
            line_items = data['line_items']
            
            # Recalculate totals
            subtotal = 0.0
            for item in line_items:
                quantity = float(item['quantity'])
                unit_price = float(item['unit_price'])
                item_total = quantity * unit_price
                item['total'] = round(item_total, 2)
                subtotal += item_total
            
            vat_rate = user.company.vat_rate if user.company else 0.20
            vat_amount = subtotal * vat_rate
            total_amount = subtotal + vat_amount
            
            quote.line_items = line_items
            quote.subtotal = round(subtotal, 2)
            quote.vat_amount = round(vat_amount, 2)
            quote.total_amount = round(total_amount, 2)
        
        if 'valid_until' in data:
            quote.valid_until = datetime.fromisoformat(data['valid_until'])
        
        quote.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Quote updated successfully',
            'quote': quote.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update quote error: {e}')
        return jsonify({'error': 'Failed to update quote'}), 500

@quotes_bp.route('/<int:quote_id>/send', methods=['POST'])
@jwt_required()
def send_quote(quote_id):
    """Send quote to client"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        data = request.get_json()
        client_email = data.get('client_email') or quote.project.client_email
        
        if not client_email:
            return jsonify({'error': 'Client email is required'}), 400
        
        # Update quote status
        quote.status = 'sent'
        quote.sent_at = datetime.utcnow()
        db.session.commit()
        
        # Send email with quote (implement email service)
        try:
            from services.email_service import send_quote_email
            send_quote_email(
                client_email=client_email,
                quote=quote,
                project=quote.project,
                company=user.company
            )
        except Exception as e:
            current_app.logger.warning(f'Failed to send quote email: {e}')
        
        return jsonify({
            'message': 'Quote sent successfully',
            'quote': quote.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Send quote error: {e}')
        return jsonify({'error': 'Failed to send quote'}), 500

@quotes_bp.route('/<int:quote_id>/download', methods=['GET'])
@jwt_required()
def download_quote_pdf(quote_id):
    """Download quote PDF"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        if not quote.pdf_path or not os.path.exists(quote.pdf_path):
            return jsonify({'error': 'Quote PDF not found'}), 404
        
        filename = f"quote_{quote.quote_number}.pdf"
        
        return send_file(
            quote.pdf_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        current_app.logger.error(f'Download quote PDF error: {e}')
        return jsonify({'error': 'Failed to download quote PDF'}), 500

@quotes_bp.route('/company', methods=['GET'])
@jwt_required()
def get_company_quotes():
    """Get all quotes for the company"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status_filter = request.args.get('status')
        
        # Build query
        query = Quote.query.join(Project).filter(Project.company_id == user.company_id)
        
        if status_filter:
            query = query.filter(Quote.status == status_filter)
        
        # Order by most recent
        query = query.order_by(Quote.created_at.desc())
        
        # Paginate
        quotes_paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        quotes_data = []
        for quote in quotes_paginated.items:
            quote_dict = quote.to_dict()
            quote_dict['project_name'] = quote.project.name
            quote_dict['client_name'] = quote.project.client_name
            quotes_data.append(quote_dict)
        
        return jsonify({
            'quotes': quotes_data,
            'pagination': {
                'page': page,
                'pages': quotes_paginated.pages,
                'per_page': per_page,
                'total': quotes_paginated.total,
                'has_next': quotes_paginated.has_next,
                'has_prev': quotes_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get company quotes error: {e}')
        return jsonify({'error': 'Failed to get quotes'}), 500

@quotes_bp.route('/pricing-templates', methods=['GET'])
@jwt_required()
def get_pricing_templates():
    """Get pricing templates for quote generation"""
    try:
        # These could be stored in database or config
        templates = {
            'basic': {
                'name': 'Basic Interior',
                'paint_prices': {
                    'primer_per_m2': 3.50,
                    'paint_per_m2': 4.20,
                    'ceiling_paint_per_m2': 3.80
                },
                'labor_prices': {
                    'prep_per_m2': 2.00,
                    'painting_per_m2': 3.50,
                    'ceiling_per_m2': 3.20
                },
                'additional_fees': {
                    'cleanup_fee': 150.00,
                    'materials_markup': 0.15
                }
            },
            'premium': {
                'name': 'Premium Interior',
                'paint_prices': {
                    'primer_per_m2': 4.50,
                    'paint_per_m2': 6.20,
                    'ceiling_paint_per_m2': 5.80
                },
                'labor_prices': {
                    'prep_per_m2': 3.00,
                    'painting_per_m2': 5.50,
                    'ceiling_per_m2': 5.20
                },
                'additional_fees': {
                    'cleanup_fee': 200.00,
                    'materials_markup': 0.20
                }
            },
            'exterior': {
                'name': 'Exterior Painting',
                'paint_prices': {
                    'primer_per_m2': 5.50,
                    'paint_per_m2': 7.20,
                    'trim_per_m': 12.00
                },
                'labor_prices': {
                    'prep_per_m2': 4.00,
                    'painting_per_m2': 6.50,
                    'trim_per_m': 15.00
                },
                'additional_fees': {
                    'scaffolding_per_day': 120.00,
                    'cleanup_fee': 250.00,
                    'materials_markup': 0.25
                }
            }
        }
        
        return jsonify({
            'templates': templates
        })
        
    except Exception as e:
        current_app.logger.error(f'Get pricing templates error: {e}')
        return jsonify({'error': 'Failed to get pricing templates'}), 500