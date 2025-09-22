import os
from flask import Blueprint, request, jsonify, current_app, send_file, render_template_string
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json
import secrets
import base64


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
    """Generate a comprehensive quote with all client and company information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        data = request.get_json()
        
        # Validate quote data
        required_fields = ['title', 'line_items']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        line_items = data['line_items']
        if not isinstance(line_items, list) or not line_items:
            return jsonify({'error': 'line_items must be a non-empty list'}), 400
        
        # Process line items with enhanced validation
        processed_line_items = []
        subtotal = 0.0
        
        for item in line_items:
            if not all(key in item for key in ['description', 'quantity', 'unit_price']):
                return jsonify({'error': 'Each line item must have description, quantity, and unit_price'}), 400
            
            try:
                quantity = float(item['quantity'])
                unit_price = float(item['unit_price'])
                item_total = quantity * unit_price
                
                processed_item = {
                    'description': str(item['description']).strip(),
                    'quantity': quantity,
                    'unit': item.get('unit', 'piece'),
                    'unit_price': unit_price,
                    'total': round(item_total, 2)
                }
                
                processed_line_items.append(processed_item)
                subtotal += item_total
                
            except (ValueError, TypeError) as e:
                return jsonify({'error': f'Invalid numeric values in line item: {str(e)}'}), 400
        
        # Calculate VAT
        vat_rate = user.company.vat_rate if user.company and hasattr(user.company, 'vat_rate') else 0.20
        vat_amount = subtotal * vat_rate
        total_amount = subtotal + vat_amount
        
        # Create quote with comprehensive information
        quote = Quote(
            quote_number=Quote.generate_quote_number(),
            title=data['title'],
            description=data.get('description', ''),
            subtotal=round(subtotal, 2),
            vat_amount=round(vat_amount, 2),
            total_amount=round(total_amount, 2),
            line_items=processed_line_items,
            project_id=project_id,
            valid_until=datetime.utcnow() + timedelta(days=data.get('valid_days', 30))
        )
        
        db.session.add(quote)
        db.session.flush()  # Get quote ID
        
        # Generate enhanced PDF with comprehensive information
        quote_generator = QuoteGenerator()
        pdf_path = quote_generator.generate_enhanced_quote_pdf(
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
        
        # Update project quote data with comprehensive information
        project.quote_data = {
            'quote_id': quote.id,
            'quote_number': quote.quote_number,
            'subtotal': quote.subtotal,
            'vat_amount': quote.vat_amount,
            'total_amount': quote.total_amount,
            'line_items_count': len(processed_line_items),
            'generated_at': datetime.utcnow().isoformat(),
            'valid_until': quote.valid_until.isoformat()
        }
        
        # Update project status if this is first quote
        if project.status in ['draft', 'ready']:
            project.status = 'quoted'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quote generated successfully with comprehensive information',
            'quote': quote.to_dict(include_project=True, include_company=True),
            'pdf_path': pdf_path
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate quote error: {e}')
        return jsonify({'error': 'Failed to generate quote'}), 500
    

@quotes_bp.route('/project/<int:project_id>/auto-generate', methods=['POST'])
@jwt_required()
@require_active_subscription
def auto_generate_quote(project_id):
    """Auto-generate a quote based on enhanced project analysis"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Check for enhanced analysis data
        has_ai_analysis = bool(project.floor_plan_analysis and 
                              project.floor_plan_analysis.get('structured_measurements'))
        has_manual_measurements = bool(project.manual_measurements)
        
        if not has_ai_analysis and not has_manual_measurements:
            return jsonify({
                'error': 'Project must have AI analysis or manual measurements to auto-generate quote'
            }), 400
        
        data = request.get_json()
        quote_settings = data.get('quote_settings', {})
        
        line_items = []
        
        # Enhanced pricing (configurable)
        pricing = {
            'walls': {
                'sanding': quote_settings.get('wall_sanding_prices', {
                    'light': 5.00, 'medium': 8.00, 'heavy': 12.00
                }),
                'priming': quote_settings.get('wall_priming_prices', {
                    'one_coat': 4.50, 'two_coat': 7.00
                }),
                'painting': quote_settings.get('wall_painting_prices', {
                    'one_coat': 6.00, 'two_coat': 9.50, 'three_coat': 13.00
                })
            },
            'ceiling': {
                'preparation': quote_settings.get('ceiling_prep_prices', {
                    'light': 4.00, 'medium': 7.00, 'heavy': 11.00
                }),
                'painting': quote_settings.get('ceiling_paint_prices', {
                    'one_coat': 5.50, 'two_coat': 8.50
                })
            },
            'interior': quote_settings.get('interior_prices', {
                'doors': 85.00, 'fixedWindows': 45.00, 'turnWindows': 55.00,
                'stairs': 25.00, 'radiators': 35.00, 'skirtingBoards': 12.00,
                'otherItems': 10.00
            }),
            'exterior': quote_settings.get('exterior_prices', {
                'doors': 120.00, 'fixedWindows': 65.00, 'turnWindows': 75.00,
                'dormerWindows': 120.00, 'fasciaBoards': 18.00, 'rainPipe': 15.00,
                'otherItems': 15.00
            }),
            'additional': quote_settings.get('additional_fees', {
                'cleanup_fee': 150.00, 'materials_markup': 0.15
            })
        }
        
        # Process manual measurements if available (preferred)
        if has_manual_measurements:
            manual_data = project.manual_measurements
            
            # Process rooms
            rooms = manual_data.get('rooms', [])
            for room in rooms:
                room_name = room.get('name', 'Unknown Room')
                
                # Process walls
                walls = room.get('walls', [])
                for wall in walls:
                    wall_area = wall.get('area', 0)
                    wall_name = wall.get('name', 'Wall')
                    
                    if wall_area > 0:
                        # Sanding
                        sanding_level = wall.get('sanding_level', 'light')
                        if sanding_level in pricing['walls']['sanding']:
                            line_items.append({
                                'description': f'{room_name} - {wall_name} - Sanding ({sanding_level})',
                                'quantity': wall_area,
                                'unit': 'm²',
                                'unit_price': pricing['walls']['sanding'][sanding_level],
                                'total': wall_area * pricing['walls']['sanding'][sanding_level]
                            })
                        
                        # Priming
                        priming_coats = wall.get('priming_coats', 'one_coat')
                        if priming_coats in pricing['walls']['priming']:
                            line_items.append({
                                'description': f'{room_name} - {wall_name} - Priming ({priming_coats})',
                                'quantity': wall_area,
                                'unit': 'm²',
                                'unit_price': pricing['walls']['priming'][priming_coats],
                                'total': wall_area * pricing['walls']['priming'][priming_coats]
                            })
                        
                        # Painting
                        painting_coats = wall.get('painting_coats', 'two_coat')
                        if painting_coats in pricing['walls']['painting']:
                            line_items.append({
                                'description': f'{room_name} - {wall_name} - Painting ({painting_coats})',
                                'quantity': wall_area,
                                'unit': 'm²',
                                'unit_price': pricing['walls']['painting'][painting_coats],
                                'total': wall_area * pricing['walls']['painting'][painting_coats]
                            })
                
                # Process ceiling
                ceiling = room.get('ceiling')
                if ceiling and ceiling.get('area', 0) > 0:
                    ceiling_area = ceiling['area']
                    
                    # Ceiling preparation
                    prep_level = ceiling.get('preparation_level', 'light')
                    if prep_level in pricing['ceiling']['preparation']:
                        line_items.append({
                            'description': f'{room_name} - Ceiling Preparation ({prep_level})',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': pricing['ceiling']['preparation'][prep_level],
                            'total': ceiling_area * pricing['ceiling']['preparation'][prep_level]
                        })
                    
                    # Ceiling painting
                    painting_coats = ceiling.get('painting_coats', 'one_coat')
                    if painting_coats in pricing['ceiling']['painting']:
                        line_items.append({
                            'description': f'{room_name} - Ceiling Painting ({painting_coats})',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': pricing['ceiling']['painting'][painting_coats],
                            'total': ceiling_area * pricing['ceiling']['painting'][painting_coats]
                        })
                
                # Process other surfaces
                other_surfaces = room.get('otherSurfaces')
                if other_surfaces and other_surfaces.get('area', 0) > 0:
                    surface_area = other_surfaces['area']
                    surface_desc = other_surfaces.get('description', 'Other Surface')
                    line_items.append({
                        'description': f'{room_name} - {surface_desc}',
                        'quantity': surface_area,
                        'unit': 'm²',
                        'unit_price': pricing['interior']['otherItems'],
                        'total': surface_area * pricing['interior']['otherItems']
                    })
            
            # Process interior items
            interior_items = manual_data.get('interiorItems', {})
            for item_type, items in interior_items.items():
                if item_type in pricing['interior']:
                    for item in items:
                        quantity = item.get('quantity', 0)
                        description = item.get('description', item_type.replace('_', ' ').title())
                        if quantity > 0:
                            line_items.append({
                                'description': f'Interior - {description}',
                                'quantity': quantity,
                                'unit': 'piece',
                                'unit_price': pricing['interior'][item_type],
                                'total': quantity * pricing['interior'][item_type]
                            })
            
            # Process exterior items
            exterior_items = manual_data.get('exteriorItems', {})
            for item_type, items in exterior_items.items():
                if item_type in pricing['exterior']:
                    for item in items:
                        quantity = item.get('quantity', 0)
                        description = item.get('description', item_type.replace('_', ' ').title())
                        if quantity > 0:
                            line_items.append({
                                'description': f'Exterior - {description}',
                                'quantity': quantity,
                                'unit': 'piece',
                                'unit_price': pricing['exterior'][item_type],
                                'total': quantity * pricing['exterior'][item_type]
                            })
        
        # Fallback to AI analysis if no manual measurements
        elif has_ai_analysis:
            analysis = project.floor_plan_analysis
            surface_areas = analysis.get('surface_areas', {})
            rooms_data = surface_areas.get('rooms', {})
            
            # Process AI-detected rooms
            for room_name, room_data in rooms_data.items():
                floor_area = room_data.get('floor_area_m2', 0)
                wall_area = room_data.get('wall_area_m2', 0)
                ceiling_area = room_data.get('ceiling_area_m2', 0)
                
                if wall_area > 0:
                    # Basic wall work for AI-detected rooms
                    line_items.extend([
                        {
                            'description': f'{room_name} - Wall Preparation',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': pricing['walls']['sanding']['light'],
                            'total': wall_area * pricing['walls']['sanding']['light']
                        },
                        {
                            'description': f'{room_name} - Wall Priming',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': pricing['walls']['priming']['one_coat'],
                            'total': wall_area * pricing['walls']['priming']['one_coat']
                        },
                        {
                            'description': f'{room_name} - Wall Painting (2 coats)',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': pricing['walls']['painting']['two_coat'],
                            'total': wall_area * pricing['walls']['painting']['two_coat']
                        }
                    ])
                
                if ceiling_area > 0:
                    line_items.extend([
                        {
                            'description': f'{room_name} - Ceiling Preparation',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': pricing['ceiling']['preparation']['light'],
                            'total': ceiling_area * pricing['ceiling']['preparation']['light']
                        },
                        {
                            'description': f'{room_name} - Ceiling Painting',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': pricing['ceiling']['painting']['one_coat'],
                            'total': ceiling_area * pricing['ceiling']['painting']['one_coat']
                        }
                    ])
            
            # Add estimated items from AI analysis
            if 'structured_measurements' in analysis:
                structured = analysis['structured_measurements']
                
                # Add interior items
                interior_items = structured.get('interior_items', {})
                for item_type, items in interior_items.items():
                    if item_type in pricing['interior']:
                        for item in items:
                            quantity = item.get('quantity', 0)
                            description = item.get('description', item_type.replace('_', ' ').title())
                            if quantity > 0:
                                line_items.append({
                                    'description': f'Interior - {description}',
                                    'quantity': quantity,
                                    'unit': 'piece',
                                    'unit_price': pricing['interior'][item_type],
                                    'total': quantity * pricing['interior'][item_type]
                                })
                
                # Add exterior items
                exterior_items = structured.get('exterior_items', {})
                for item_type, items in exterior_items.items():
                    if item_type in pricing['exterior']:
                        for item in items:
                            quantity = item.get('quantity', 0)
                            description = item.get('description', item_type.replace('_', ' ').title())
                            if quantity > 0:
                                line_items.append({
                                    'description': f'Exterior - {description}',
                                    'quantity': quantity,
                                    'unit': 'piece',
                                    'unit_price': pricing['exterior'][item_type],
                                    'total': quantity * pricing['exterior'][item_type]
                                })
        
        # Add general items if there are work items
        if line_items:
            line_items.append({
                'description': 'Cleanup and Site Preparation',
                'quantity': 1,
                'unit': 'job',
                'unit_price': pricing['additional']['cleanup_fee'],
                'total': pricing['additional']['cleanup_fee']
            })
        
        if not line_items:
            return jsonify({'error': 'No work items found to generate quote from'}), 400
        
        # Calculate totals
        subtotal = sum(item['total'] for item in line_items)
        vat_rate = user.company.vat_rate if user.company and hasattr(user.company, 'vat_rate') else 0.20
        vat_amount = subtotal * vat_rate
        total_amount = subtotal + vat_amount
        
        # Create quote
        quote_title = data.get('title', f"Auto-Generated Paint Quote - {project.name}")
        quote_description = data.get('description', 
            f"Comprehensive painting quote for {project.name} based on " +
            ("manual measurements and " if has_manual_measurements else "") +
            ("AI floor plan analysis." if has_ai_analysis else "project analysis."))
        
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
        
        # Generate enhanced PDF
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
            'line_items_count': len(line_items),
            'generated_at': datetime.utcnow().isoformat(),
            'auto_generated': True,
            'data_source': 'manual_measurements' if has_manual_measurements else 'ai_analysis',
            'room_based': True
        }
        
        # Update project status to ready if it's still draft
        if project.status == 'draft':
            project.status = 'ready'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Enhanced quote auto-generated successfully',
            'quote': quote.to_dict(include_project=True),
            'generation_info': {
                'line_items_count': len(line_items),
                'data_source': 'manual_measurements' if has_manual_measurements else 'ai_analysis',
                'room_based_items': len([item for item in line_items if ' - ' in item['description']]),
                'interior_items': len([item for item in line_items if 'Interior' in item['description']]),
                'exterior_items': len([item for item in line_items if 'Exterior' in item['description']])
            },
            'pdf_path': pdf_path
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Auto-generate quote error: {e}')
        return jsonify({'error': 'Failed to auto-generate quote'}), 500

@quotes_bp.route('/<int:quote_id>', methods=['GET'])
@jwt_required()
def get_quote(quote_id):
    """Get a specific quote with enhanced details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        # Return quote with enhanced project data
        quote_data = quote.to_dict(include_project=True)
        
        # Add organization information for the frontend
        line_items = quote_data.get('line_items', [])
        quote_data['organization_info'] = {
            'total_line_items': len(line_items),
            'room_based_items': len([item for item in line_items if ' - ' in item.get('description', '')]),
            'interior_items': len([item for item in line_items if 'Interior' in item.get('description', '')]),
            'exterior_items': len([item for item in line_items if 'Exterior' in item.get('description', '')]),
            'general_items': len([item for item in line_items if 
                               ' - ' not in item.get('description', '') and 
                               'Interior' not in item.get('description', '') and 
                               'Exterior' not in item.get('description', '')])
        }
        
        return jsonify({
            'quote': quote_data
        })
        
    except Exception as e:
        current_app.logger.error(f'Get quote error: {e}')
        return jsonify({'error': 'Failed to get quote'}), 500

@quotes_bp.route('/<int:quote_id>', methods=['PUT'])
@jwt_required()
def update_quote(quote_id):
    """Update a quote with enhanced validation"""
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
        
        # Update quote fields with enhanced validation
        if 'title' in data:
            quote.title = str(data['title']).strip()
        
        if 'description' in data:
            quote.description = str(data['description']).strip()
        
        if 'line_items' in data:
            line_items = data['line_items']
            
            if not isinstance(line_items, list):
                return jsonify({'error': 'line_items must be a list'}), 400
            
            # Recalculate totals with enhanced validation
            subtotal = 0.0
            processed_items = []
            
            for item in line_items:
                try:
                    if not all(key in item for key in ['description', 'quantity', 'unit_price']):
                        return jsonify({'error': 'Each line item must have description, quantity, and unit_price'}), 400
                    
                    quantity = float(item['quantity'])
                    unit_price = float(item['unit_price'])
                    item_total = quantity * unit_price
                    
                    processed_item = {
                        'description': str(item['description']).strip(),
                        'quantity': quantity,
                        'unit': item.get('unit', 'piece'),
                        'unit_price': unit_price,
                        'total': round(item_total, 2)
                    }
                    
                    processed_items.append(processed_item)
                    subtotal += item_total
                    
                except (ValueError, TypeError) as e:
                    return jsonify({'error': f'Invalid numeric values in line item: {str(e)}'}), 400
            
            vat_rate = user.company.vat_rate if user.company and hasattr(user.company, 'vat_rate') else 0.20
            vat_amount = subtotal * vat_rate
            total_amount = subtotal + vat_amount
            
            quote.line_items = processed_items
            quote.subtotal = round(subtotal, 2)
            quote.vat_amount = round(vat_amount, 2)
            quote.total_amount = round(total_amount, 2)
        
        if 'valid_until' in data:
            try:
                quote.valid_until = datetime.fromisoformat(data['valid_until'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid valid_until date format'}), 400
        
        quote.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Quote updated successfully',
            'quote': quote.to_dict(include_project=True)
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update quote error: {e}')
        return jsonify({'error': 'Failed to update quote'}), 500

@quotes_bp.route('/<int:quote_id>/download', methods=['GET'])
@jwt_required()
def download_quote_pdf(quote_id):
    """Download enhanced quote PDF"""
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
            # Try to regenerate PDF if missing
            try:
                quote_generator = QuoteGenerator()
                pdf_path = quote_generator.generate_quote_pdf(
                    quote=quote,
                    project=quote.project,
                    company=user.company,
                    output_dir=os.path.join(
                        current_app.config['RESULTS_FOLDER'],
                        str(user.company_id),
                        str(quote.project_id)
                    )
                )
                quote.pdf_path = pdf_path
                db.session.commit()
            except Exception as e:
                current_app.logger.error(f'Failed to regenerate PDF: {e}')
                return jsonify({'error': 'Quote PDF not available and could not be regenerated'}), 404
        
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

@quotes_bp.route('/', methods=['GET'])
@jwt_required()
def get_quotes():
    """Get all quotes for the company with enhanced filtering"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status_filter = request.args.get('status')
        search_term = request.args.get('search')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Quote.query.join(Project).filter(Project.company_id == user.company_id)
        
        # Apply filters
        if status_filter:
            query = query.filter(Quote.status == status_filter)
        
        if search_term:
            search = f"%{search_term}%"
            query = query.filter(
                db.or_(
                    Quote.title.ilike(search),
                    Quote.quote_number.ilike(search),
                    Project.name.ilike(search),
                    Project.client_name.ilike(search)
                )
            )
        
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Quote.created_at >= from_date)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format'}), 400
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Quote.created_at <= to_date)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format'}), 400
        
        # Order by most recent
        query = query.order_by(Quote.created_at.desc())
        
        # Paginate
        quotes_paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        quotes_data = []
        for quote in quotes_paginated.items:
            quote_dict = quote.to_dict(include_project=True)
            
            # Add organization info for each quote
            line_items = quote_dict.get('line_items', [])
            quote_dict['organization_info'] = {
                'room_based_items': len([item for item in line_items if ' - ' in item.get('description', '')]),
                'interior_items': len([item for item in line_items if 'Interior' in item.get('description', '')]),
                'exterior_items': len([item for item in line_items if 'Exterior' in item.get('description', '')])
            }
            
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
            },
            'filters_applied': {
                'status': status_filter,
                'search': search_term,
                'date_from': date_from,
                'date_to': date_to
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get quotes error: {e}')
        return jsonify({'error': 'Failed to get quotes'}), 500


@quotes_bp.route('/pricing-templates', methods=['GET'])
@jwt_required()
def get_pricing_templates():
    """Get enhanced pricing templates for quote generation"""
    try:
        # Enhanced templates with more detailed pricing structures
        templates = {
            'basic_interior': {
                'name': 'Basic Interior',
                'description': 'Standard interior painting with basic preparation',
                'wall_sanding_prices': {'light': 5.00, 'medium': 8.00, 'heavy': 12.00},
                'wall_priming_prices': {'one_coat': 4.50, 'two_coat': 7.00},
                'wall_painting_prices': {'one_coat': 6.00, 'two_coat': 9.50, 'three_coat': 13.00},
                'ceiling_prep_prices': {'light': 4.00, 'medium': 7.00, 'heavy': 11.00},
                'ceiling_paint_prices': {'one_coat': 5.50, 'two_coat': 8.50},
                'interior_prices': {
                    'doors': 85.00, 'fixedWindows': 45.00, 'turnWindows': 55.00,
                    'stairs': 25.00, 'radiators': 35.00, 'skirtingBoards': 12.00,
                    'otherItems': 10.00
                },
                'additional_fees': {'cleanup_fee': 150.00, 'materials_markup': 0.15}
            },
            'premium_interior': {
                'name': 'Premium Interior',
                'description': 'High-end interior painting with extensive preparation',
                'wall_sanding_prices': {'light': 7.00, 'medium': 12.00, 'heavy': 18.00},
                'wall_priming_prices': {'one_coat': 6.50, 'two_coat': 10.00},
                'wall_painting_prices': {'one_coat': 8.50, 'two_coat': 14.00, 'three_coat': 20.00},
                'ceiling_prep_prices': {'light': 6.00, 'medium': 10.00, 'heavy': 16.00},
                'ceiling_paint_prices': {'one_coat': 8.00, 'two_coat': 12.50},
                'interior_prices': {
                    'doors': 125.00, 'fixedWindows': 65.00, 'turnWindows': 85.00,
                    'stairs': 40.00, 'radiators': 55.00, 'skirtingBoards': 18.00,
                    'otherItems': 15.00
                },
                'additional_fees': {'cleanup_fee': 250.00, 'materials_markup': 0.20}
            },
            'exterior_standard': {
                'name': 'Standard Exterior',
                'description': 'Standard exterior painting with weather protection',
                'wall_sanding_prices': {'light': 8.00, 'medium': 14.00, 'heavy': 22.00},
                'wall_priming_prices': {'one_coat': 7.50, 'two_coat': 12.00},
                'wall_painting_prices': {'one_coat': 10.00, 'two_coat': 16.00, 'three_coat': 24.00},
                'exterior_prices': {
                    'doors': 120.00, 'fixedWindows': 65.00, 'turnWindows': 85.00,
                    'dormerWindows': 120.00, 'fasciaBoards': 18.00, 'rainPipe': 15.00,
                    'otherItems': 20.00
                },
                'additional_fees': {'cleanup_fee': 200.00, 'materials_markup': 0.25}
            },
            'commercial': {
                'name': 'Commercial',
                'description': 'Commercial painting with durable finishes',
                'wall_sanding_prices': {'light': 6.00, 'medium': 10.00, 'heavy': 16.00},
                'wall_priming_prices': {'one_coat': 5.50, 'two_coat': 9.00},
                'wall_painting_prices': {'one_coat': 7.50, 'two_coat': 12.00, 'three_coat': 18.00},
                'ceiling_prep_prices': {'light': 5.00, 'medium': 8.50, 'heavy': 14.00},
                'ceiling_paint_prices': {'one_coat': 6.50, 'two_coat': 10.00},
                'interior_prices': {
                    'doors': 95.00, 'fixedWindows': 50.00, 'turnWindows': 65.00,
                    'stairs': 30.00, 'radiators': 40.00, 'skirtingBoards': 14.00,
                    'otherItems': 12.00
                },
                'exterior_prices': {
                    'doors': 140.00, 'fixedWindows': 75.00, 'turnWindows': 95.00,
                    'dormerWindows': 140.00, 'fasciaBoards': 22.00, 'rainPipe': 18.00,
                    'otherItems': 25.00
                },
                'additional_fees': {'cleanup_fee': 300.00, 'materials_markup': 0.20}
            }
        }
        
        return jsonify({
            'templates': templates,
            'currency': 'GBP',
            'last_updated': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get pricing templates error: {e}')
        return jsonify({'error': 'Failed to get pricing templates'}), 500
    

@quotes_bp.route('/<int:quote_id>/signature-status', methods=['GET'])
@jwt_required()
def get_signature_status(quote_id):
    """Get signature status for a quote"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        latest_signature = quote.latest_signature
        
        return jsonify({
            'is_signed': quote.is_signed,
            'signed_at': quote.signed_at.isoformat() if quote.signed_at else None,
            'signature': latest_signature.to_dict() if latest_signature else None
        })
        
    except Exception as e:
        current_app.logger.error(f'Get signature status error: {e}')
        return jsonify({'error': 'Failed to get signature status'}), 500

@quotes_bp.route('/<int:quote_id>/sign', methods=['GET'])
def quote_signature_page(quote_id):
    """Display quote signature page (public access)"""
    try:
        quote = Quote.query.get_or_404(quote_id)
        
        if quote.is_signed:
            return render_template_string("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quote Already Signed</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .success { color: #28a745; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="success">✅ Quote Already Signed</h1>
                    <p>This quote was digitally signed on {{ quote.signed_at.strftime('%B %d, %Y at %I:%M %p') }}.</p>
                    <p>Quote #{{ quote.quote_number }}</p>
                    <p>Project: {{ quote.project.name }}</p>
                    <p>Total: €{{ "%.2f"|format(quote.total_amount) }}</p>
                </div>
            </body>
            </html>
            """, quote=quote)
        
        # Render signature form
        signature_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sign Quote #{{ quote.quote_number }}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background-color: #f8f9fa; 
                }
                .container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                }
                .quote-summary {
                    background: #e9ecef;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 30px;
                }
                .signature-pad {
                    border: 2px solid #333;
                    margin: 20px 0;
                    border-radius: 5px;
                    cursor: crosshair;
                    background: white;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                .btn {
                    padding: 12px 30px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 5px;
                }
                .btn-primary {
                    background-color: #007bff;
                    color: white;
                }
                .btn-secondary {
                    background-color: #6c757d;
                    color: white;
                }
                .btn:hover {
                    opacity: 0.8;
                }
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .terms {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    font-size: 12px;
                    margin: 20px 0;
                }
                .error {
                    color: #dc3545;
                    font-size: 14px;
                    margin: 10px 0;
                }
                .success {
                    color: #28a745;
                    font-size: 14px;
                    margin: 10px 0;
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
        </head>
        <body>
            <div class="container">
                <h1>Digital Quote Signature</h1>
                
                <div class="quote-summary">
                    <h3>Quote Summary</h3>
                    <p><strong>Quote Number:</strong> {{ quote.quote_number }}</p>
                    <p><strong>Project:</strong> {{ quote.project.name }}</p>
                    <p><strong>Total Amount:</strong> €{{ "%.2f"|format(quote.total_amount) }}</p>
                    <p><strong>Valid Until:</strong> {{ quote.valid_until.strftime('%B %d, %Y') }}</p>
                    <p><strong>Company:</strong> {{ quote.project.company.name }}</p>
                </div>
                
                <form id="signatureForm">
                    <div class="form-group">
                        <label for="clientName">Full Name *</label>
                        <input type="text" id="clientName" name="clientName" 
                               value="{{ quote.project.client_name or '' }}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="clientEmail">Email Address *</label>
                        <input type="email" id="clientEmail" name="clientEmail" 
                               value="{{ quote.project.client_email or '' }}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="signaturePad">Digital Signature *</label>
                        <p style="font-size: 12px; color: #666;">
                            Please sign in the box below using your mouse, trackpad, or finger on mobile devices.
                        </p>
                        <canvas id="signaturePad" class="signature-pad" width="600" height="200"></canvas>
                        <button type="button" id="clearSignature" class="btn btn-secondary">Clear Signature</button>
                    </div>
                    
                    <div class="terms">
                        <label>
                            <input type="checkbox" id="acceptTerms" required>
                            I accept the terms and conditions of this quotation and authorize the work to proceed as specified. 
                            I understand this digital signature has the same legal effect as a handwritten signature.
                        </label>
                    </div>
                    
                    <div id="errorMessage" class="error" style="display: none;"></div>
                    <div id="successMessage" class="success" style="display: none;"></div>
                    
                    <button type="submit" id="signButton" class="btn btn-primary">
                        Sign Quote Digitally
                    </button>
                    
                    <a href="/api/quotes/{{ quote.id }}/download" class="btn btn-secondary" target="_blank">
                        View Full Quote PDF
                    </a>
                </form>
            </div>
            
            <script>
                // Initialize signature pad
                const canvas = document.getElementById('signaturePad');
                const signaturePad = new SignaturePad(canvas, {
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    penColor: 'rgb(0, 0, 0)'
                });
                
                // Clear signature button
                document.getElementById('clearSignature').addEventListener('click', function() {
                    signaturePad.clear();
                });
                
                // Form submission
                document.getElementById('signatureForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const errorDiv = document.getElementById('errorMessage');
                    const successDiv = document.getElementById('successMessage');
                    const signButton = document.getElementById('signButton');
                    
                    // Clear previous messages
                    errorDiv.style.display = 'none';
                    successDiv.style.display = 'none';
                    
                    // Validate form
                    const clientName = document.getElementById('clientName').value.trim();
                    const clientEmail = document.getElementById('clientEmail').value.trim();
                    const acceptTerms = document.getElementById('acceptTerms').checked;
                    
                    if (!clientName) {
                        errorDiv.textContent = 'Please enter your full name.';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    if (!clientEmail) {
                        errorDiv.textContent = 'Please enter your email address.';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    if (signaturePad.isEmpty()) {
                        errorDiv.textContent = 'Please provide your digital signature.';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    if (!acceptTerms) {
                        errorDiv.textContent = 'Please accept the terms and conditions.';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    // Disable button and show loading
                    signButton.disabled = true;
                    signButton.textContent = 'Signing...';
                    
                    try {
                        // Submit signature
                        const signatureData = signaturePad.toDataURL();
                        
                        const response = await fetch(`/api/quotes/{{ quote.id }}/sign`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                client_name: clientName,
                                client_email: clientEmail,
                                signature_data: signatureData
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok) {
                            successDiv.textContent = 'Quote signed successfully! You will receive a confirmation email shortly.';
                            successDiv.style.display = 'block';
                            
                            // Redirect after 3 seconds
                            setTimeout(function() {
                                window.location.href = `/api/quotes/{{ quote.id }}/signed`;
                            }, 3000);
                        } else {
                            errorDiv.textContent = result.error || 'Failed to sign quote. Please try again.';
                            errorDiv.style.display = 'block';
                        }
                        
                    } catch (error) {
                        errorDiv.textContent = 'Network error. Please check your connection and try again.';
                        errorDiv.style.display = 'block';
                    } finally {
                        signButton.disabled = false;
                        signButton.textContent = 'Sign Quote Digitally';
                    }
                });
                
                // Resize canvas for mobile
                function resizeCanvas() {
                    const ratio = Math.max(window.devicePixelRatio || 1, 1);
                    const canvas = document.getElementById('signaturePad');
                    canvas.width = canvas.offsetWidth * ratio;
                    canvas.height = canvas.offsetHeight * ratio;
                    canvas.getContext('2d').scale(ratio, ratio);
                    signaturePad.clear();
                }
                
                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();
            </script>
        </body>
        </html>
        """
        
        return render_template_string(signature_html, quote=quote)
        
    except Exception as e:
        current_app.logger.error(f'Quote signature page error: {e}')
        return jsonify({'error': 'Failed to load signature page'}), 500

@quotes_bp.route('/<int:quote_id>/sign', methods=['POST'])
def sign_quote(quote_id):
    """Process digital signature"""
    try:
        quote = Quote.query.get_or_404(quote_id)
        
        if quote.is_signed:
            return jsonify({'error': 'Quote is already signed'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        client_name = data.get('client_name', '').strip()
        client_email = data.get('client_email', '').strip()
        signature_data = data.get('signature_data', '').strip()
        
        if not all([client_name, client_email, signature_data]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, client_email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate signature data
        if not signature_data.startswith('data:image/png;base64,'):
            return jsonify({'error': 'Invalid signature format'}), 400
        
        # Create signature record
        verification_token = secrets.token_urlsafe(32)

        from models.quote import QuoteSignature
        
        signature = QuoteSignature(
            quote_id=quote_id,
            client_name=client_name,
            client_email=client_email,
            signature_data=signature_data,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            verification_token=verification_token,
            is_verified=True  # Auto-verify for now
        )
        
        # Update quote status
        quote.is_signed = True
        quote.signed_at = datetime.utcnow()
        quote.status = 'accepted'
        
        db.session.add(signature)
        db.session.flush()

        # Generate signed PDF with signature
        try:
            from services.quote_generator import QuoteGenerator
            quote_generator = QuoteGenerator()
            
            output_dir = os.path.join(
                current_app.config.get('RESULTS_FOLDER', 'static/generated'),
                str(quote.project.company_id),
                str(quote.project_id)
            )
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate signed PDF
            signed_pdf_path = quote_generator.generate_signed_quote_pdf(
                quote=quote,
                signature=signature,
                project=quote.project,
                company=quote.project.company,
                output_dir=output_dir
            )
            
            # Update quote with signed PDF path
            quote.signed_pdf_path = signed_pdf_path
            current_app.logger.info(f"✅ Signed PDF generated: {signed_pdf_path}")
            
        except Exception as pdf_error:
            current_app.logger.error(f"❌ Failed to generate signed PDF: {pdf_error}")
            # Continue without failing the signature process
        
        db.session.commit()
        
        # Send confirmation emails
        try:
            from services.email_service import send_signature_confirmation_email, send_quote_signed_notification_email
            
            # Email to client
            send_signature_confirmation_email(
                client_email=client_email,
                client_name=client_name,
                quote=quote
            )
            
            # Email to company
            if quote.project.company.email:
                send_quote_signed_notification_email(
                    company_email=quote.project.company.email,
                    company_name=quote.project.company.name,
                    quote=quote,
                    client_name=client_name
                )
                
        except Exception as email_error:
            current_app.logger.warning(f'Failed to send signature emails: {email_error}')
        
        return jsonify({
            'message': 'Quote signed successfully',
            'signature_id': signature.id,
            'signed_at': signature.signed_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Sign quote error: {e}')
        return jsonify({'error': 'Failed to sign quote'}), 500

@quotes_bp.route('/<int:quote_id>/signed', methods=['GET'])
def quote_signed_confirmation(quote_id):
    """Display signed quote confirmation"""
    try:
        quote = Quote.query.get_or_404(quote_id)
        signature = quote.latest_signature
        
        confirmation_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote Signed Successfully</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 40px; 
                    background-color: #f8f9fa;
                    text-align: center;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .success-icon {
                    font-size: 64px;
                    color: #28a745;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #28a745;
                    margin-bottom: 20px;
                }
                .details {
                    background: #e8f5e8;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                    text-align: left;
                }
                .details p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .next-steps {
                    background: #f0f8ff;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>Quote Signed Successfully!</h1>
                <p>Thank you for digitally signing the quote. Your signature has been recorded and verified.</p>
                
                {% if signature %}
                <div class="details">
                    <h3>Signature Details</h3>
                    <p><strong>Quote Number:</strong> {{ quote.quote_number }}</p>
                    <p><strong>Signed By:</strong> {{ signature.client_name }}</p>
                    <p><strong>Email:</strong> {{ signature.client_email }}</p>
                    <p><strong>Signed On:</strong> {{ signature.signed_at.strftime('%B %d, %Y at %I:%M %p') }}</p>
                    <p><strong>Project:</strong> {{ quote.project.name }}</p>
                    <p><strong>Total Amount:</strong> €{{ "%.2f"|format(quote.total_amount) }}</p>
                </div>
                {% endif %}
                
                <div class="next-steps">
                    <h3>What Happens Next?</h3>
                    <ul style="text-align: left;">
                        <li>You will receive a confirmation email with the signed quote</li>
                        <li>{{ quote.project.company.name }} has been notified of your acceptance</li>
                        <li>A project representative will contact you to schedule the work</li>
                        <li>All project details and terms remain as specified in the quote</li>
                    </ul>
                </div>
                
                <a href="/api/quotes/{{ quote.id }}/download" class="btn" target="_blank">
                    Download Signed Quote PDF
                </a>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    This digital signature has the same legal validity as a handwritten signature.
                    For questions, contact {{ quote.project.company.name }} at 
                    {{ quote.project.company.email or quote.project.company.phone or 'your specified contact method' }}.
                </p>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(confirmation_html, quote=quote, signature=signature)
        
    except Exception as e:
        current_app.logger.error(f'Quote signed confirmation error: {e}')
        return jsonify({'error': 'Failed to load confirmation page'}), 500


@quotes_bp.route('/<int:quote_id>/public', methods=['GET'])
def get_public_quote(quote_id):
    """Get quote data for public signature page (no authentication required)"""
    try:
        quote = Quote.query.get_or_404(quote_id)
        
        # Check if already signed
        if quote.is_signed:
            return jsonify({
                'quote': {
                    'id': quote.id,
                    'quote_number': quote.quote_number,
                    'is_signed': True,
                    'signed_at': quote.signed_at.isoformat() if quote.signed_at else None,
                    'project_name': quote.project.name,
                    'total_amount': float(quote.total_amount)
                },
                'already_signed': True
            })
        
        # Return limited quote data for signing
        quote_data = {
            'id': quote.id,
            'quote_number': quote.quote_number,
            'title': quote.title,
            'description': quote.description,
            'subtotal': float(quote.subtotal),
            'vat_amount': float(quote.vat_amount),
            'total_amount': float(quote.total_amount),
            'valid_until': quote.valid_until.isoformat() if quote.valid_until else None,
            'created_at': quote.created_at.isoformat() if quote.created_at else None,
            'is_signed': quote.is_signed,
            
            # Project info
            'project_name': quote.project.name,
            'property_address': quote.project.property_address,
            
            # Client info (pre-populate form)
            'client_company_name': quote.project.client_name,
            'client_email': quote.project.client_email,
            
            # Company info
            'company': {
                'name': quote.project.company.name,
                'email': quote.project.company.email,
                'phone': quote.project.company.phone,
                'website': quote.project.company.website
            }
        }
        
        return jsonify({
            'quote': quote_data,
            'already_signed': False
        })
        
    except Exception as e:
        current_app.logger.error(f'Get public quote error: {e}')
        return jsonify({'error': 'Quote not found'}), 404

@quotes_bp.route('/<int:quote_id>/send', methods=['POST'])
@jwt_required()
def send_quote_email_manual(quote_id):
    """Send quote email manually using enhanced email service"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 400
        
        quote = Quote.query.join(Project).filter(
            Quote.id == quote_id,
            Project.company_id == user.company_id
        ).first()
        
        if not quote:
            return jsonify({'error': 'Quote not found'}), 404
        
        data = request.get_json() or {}
        client_email = data.get('client_email') or quote.project.client_email
        client_name = data.get('client_name') or quote.project.client_name or 'Valued Client'
        
        if not client_email:
            return jsonify({'error': 'Client email is required'}), 400
        
        # Enhanced logging
        current_app.logger.info(f"📧 Starting manual email send for quote {quote_id} to {client_email}")
        
        # Check SMTP configuration
        smtp_server = current_app.config.get('MAIL_SERVER')
        smtp_port = current_app.config.get('MAIL_PORT', 587)
        smtp_user = current_app.config.get('MAIL_USERNAME')
        smtp_password = current_app.config.get('MAIL_PASSWORD')
        
        current_app.logger.info(f"📧 SMTP Config - Server: {smtp_server}, Port: {smtp_port}, User: {smtp_user[:5]}...{smtp_user[-5:] if smtp_user else 'None'}")
        
        # Generate PDF if it doesn't exist
        pdf_status = {
            'path_exists': bool(quote.pdf_path),
            'file_exists': False,
            'file_size': 0,
            'path': quote.pdf_path
        }
        
        if not quote.pdf_path or not os.path.exists(quote.pdf_path):
            current_app.logger.info(f"📄 PDF not found, generating new PDF for quote {quote_id}")
            
            try:
                from services.quote_generator import QuoteGenerator
                quote_generator = QuoteGenerator()
                
                output_dir = os.path.join(
                    current_app.config.get('RESULTS_FOLDER', 'static/generated'),
                    str(user.company_id),
                    str(quote.project_id)
                )
                os.makedirs(output_dir, exist_ok=True)
                
                pdf_path = quote_generator.generate_enhanced_quote_pdf(
                    quote=quote,
                    project=quote.project,
                    company=user.company,
                    output_dir=output_dir
                )
                quote.pdf_path = pdf_path
                db.session.commit()
                current_app.logger.info(f"✅ PDF generated successfully: {pdf_path}")
                
                # Update PDF status
                pdf_status['path_exists'] = True
                pdf_status['path'] = pdf_path
                
            except Exception as pdf_error:
                current_app.logger.error(f"❌ PDF generation failed: {str(pdf_error)}")
                return jsonify({'error': 'Failed to generate PDF'}), 500
        
        # Check PDF availability
        if quote.pdf_path and os.path.exists(quote.pdf_path):
            pdf_status['file_exists'] = True
            pdf_status['file_size'] = os.path.getsize(quote.pdf_path)
            current_app.logger.info(f"📎 PDF found: {quote.pdf_path} (Size: {pdf_status['file_size']} bytes)")
        else:
            current_app.logger.warning(f"⚠️ PDF not available for quote {quote_id}")
        
        # Handle development/staging environment gracefully
        if not all([smtp_server, smtp_user, smtp_password]):
            current_app.logger.warning('📧 SMTP not fully configured - simulating email send')
            
            # Update quote status even in simulation mode
            quote.status = 'sent'
            quote.sent_at = datetime.utcnow()
            db.session.commit()
            
            frontend_url = current_app.config.get('FRONTEND_URL', 'https://flotto.jaytechprinterimports.co.ke')
            
            return jsonify({
                'message': f'Quote email prepared successfully (SMTP not configured - simulation mode)',
                'timestamp': datetime.utcnow().isoformat(),
                'development_mode': True,
                'pdf_status': pdf_status,
                'email_details': {
                    'to': client_email,
                    'subject': f'Quote #{quote.quote_number} - {user.company.name}',
                    'client_name': client_name,
                    'quote_number': quote.quote_number,
                    'total_amount': float(quote.total_amount),
                    'signature_url': f"{frontend_url}/quotes/{quote_id}/sign"
                },
                'smtp_config': {
                    'server_configured': bool(smtp_server),
                    'user_configured': bool(smtp_user),
                    'password_configured': bool(smtp_password)
                }
            })
        
        # Get frontend URL for signature link
        frontend_url = current_app.config.get('FRONTEND_URL', 'https://flotto.jaytechprinterimports.co.ke')
        
        # Use the enhanced email service
        try:
            from services.email_service import send_quote_with_signature_link_frontend
            
            # Send enhanced email with signature link
            send_quote_with_signature_link_frontend(
                client_email=client_email,
                client_name=client_name,
                quote=quote,
                company=user.company,
                frontend_url=frontend_url,
                pdf_path=quote.pdf_path
            )
            
            current_app.logger.info(f"✅ Email sent successfully to {client_email}")
            
            # Update quote status only after successful email send
            quote.status = 'sent'
            quote.sent_at = datetime.utcnow()
            db.session.commit()
            
            current_app.logger.info(f"📊 Quote status updated to 'sent'")
            
            return jsonify({
                'message': f'Quote sent successfully to {client_email}',
                'timestamp': datetime.utcnow().isoformat(),
                'email_details': {
                    'to': client_email,
                    'subject': f'Quote #{quote.quote_number} - {user.company.name}',
                    'client_name': client_name,
                    'quote_number': quote.quote_number,
                    'total_amount': float(quote.total_amount),
                    'pdf_attached': pdf_status['file_exists'],
                    'signature_url': f"{frontend_url}/quotes/{quote_id}/sign",
                    'sent_at': datetime.utcnow().isoformat()
                },
                'pdf_status': pdf_status
            })
            
        except ImportError as e:
            current_app.logger.error(f'❌ Email service import failed: {e}')
            return jsonify({
                'error': 'Email service not available',
                'details': 'Email functionality is not properly configured'
            }), 500
            
        except Exception as email_error:
            current_app.logger.error(f'❌ Email sending failed: {str(email_error)}')
            
            # Provide specific error messages based on the exception
            error_message = str(email_error).lower()
            
            if 'authentication' in error_message or 'auth' in error_message:
                return jsonify({
                    'error': 'Email authentication failed',
                    'details': 'Please check email server credentials'
                }), 500
            elif 'connection' in error_message or 'connect' in error_message:
                return jsonify({
                    'error': 'Email server connection failed',
                    'details': 'Please check SMTP server configuration'
                }), 500
            else:
                return jsonify({
                    'error': 'Failed to send email',
                    'details': 'Please contact support if this persists'
                }), 500
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'❌ Send quote route error: {str(e)}')
        current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
        return jsonify({
            'error': 'Failed to process quote sending',
            'details': str(e)
        }), 500
    

@quotes_bp.route('/<int:quote_id>/download-signed', methods=['GET'])
def download_signed_quote_pdf(quote_id):
    """Download signed quote PDF (public access)"""
    try:
        quote = Quote.query.get_or_404(quote_id)
        
        if not quote.is_signed:
            return jsonify({'error': 'Quote is not signed yet'}), 400
        
        if not quote.signed_pdf_path or not os.path.exists(quote.signed_pdf_path):
            return jsonify({'error': 'Signed PDF not available'}), 404
        
        filename = f"signed_quote_{quote.quote_number}.pdf"
        
        return send_file(
            quote.signed_pdf_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        current_app.logger.error(f'Download signed PDF error: {e}')
        return jsonify({'error': 'Failed to download signed PDF'}), 500







