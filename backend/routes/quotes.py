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


# Add to routes/quotes.py (updated generate_quote function)
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

# Enhanced existing routes with better error handling and validation
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


# @quotes_bp.route('/<int:quote_id>/send', methods=['POST'])
# @jwt_required()
# def send_quote(quote_id):
#     """Send quote to client with enhanced email handling"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = User.query.get(current_user_id)
        
#         quote = Quote.query.join(Project).filter(
#             Quote.id == quote_id,
#             Project.company_id == user.company_id
#         ).first()
        
#         if not quote:
#             return jsonify({'error': 'Quote not found'}), 404
        
#         data = request.get_json()
#         client_email = data.get('client_email') or quote.project.client_email
        
#         if not client_email:
#             return jsonify({'error': 'Client email is required'}), 400
        
#         # Validate email format
#         import re
#         email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
#         if not re.match(email_pattern, client_email):
#             return jsonify({'error': 'Invalid email format'}), 400
        
#         # Update quote status
#         quote.status = 'sent'
#         quote.sent_at = datetime.utcnow()
#         db.session.commit()
        
#         # Send email with quote (implement email service)
#         try:
#             from services.email_service import send_quote_email
#             send_quote_email(
#                 client_email=client_email,
#                 quote=quote,
#                 project=quote.project,
#                 company=user.company
#             )
            
#             return jsonify({
#                 'message': f'Quote sent successfully to {client_email}',
#                 'quote': quote.to_dict(include_project=True)
#             })
            
#         except Exception as e:
#             current_app.logger.warning(f'Failed to send quote email: {e}')
#             # Revert status change if email fails
#             quote.status = 'draft'
#             quote.sent_at = None
#             db.session.commit()
            
#             return jsonify({
#                 'error': 'Failed to send email',
#                 'details': 'Quote status not changed due to email delivery failure'
#             }), 500
        
#     except Exception as e:
#         db.session.rollback()
#         current_app.logger.error(f'Send quote error: {e}')
#         return jsonify({'error': 'Failed to send quote'}), 500

@quotes_bp.route('/<int:quote_id>/send', methods=['POST'])
@jwt_required()
def send_quote(quote_id):
    """Send quote to client with enhanced email handling and PDF logging"""
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
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, client_email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # 📧 LOG: Starting quote send process
        current_app.logger.info(f"📧 Sending quote #{quote.quote_number} to {client_email}")
        
        # Check PDF status before sending
        pdf_status = {
            'quote_pdf_path': getattr(quote, 'pdf_path', None),
            'project_pdf_path': getattr(quote.project, 'quote_pdf_path', None),
            'pdf_available': False
        }
        
        # Check if any PDF exists
        for path_name, path in [('quote_pdf_path', pdf_status['quote_pdf_path']), 
                               ('project_pdf_path', pdf_status['project_pdf_path'])]:
            if path and os.path.exists(path):
                pdf_status['pdf_available'] = True
                pdf_status[f'{path_name}_exists'] = True
                pdf_status[f'{path_name}_size'] = os.path.getsize(path)
                current_app.logger.info(f"📎 Found PDF at {path_name}: {path} ({pdf_status[f'{path_name}_size']} bytes)")
            else:
                pdf_status[f'{path_name}_exists'] = False
                if path:
                    current_app.logger.warning(f"⚠️ PDF path set but file missing for {path_name}: {path}")
        
        if not pdf_status['pdf_available']:
            current_app.logger.warning(f"⚠️ No PDF available for quote #{quote.quote_number}")
        
        # Send email with quote
        try:
            from services.email_service import send_quote_email
            email_result = send_quote_email(
                client_email=client_email,
                quote=quote,
                project=quote.project,
                company=user.company
            )
            
            # Update quote status only if email was successful
            quote.status = 'sent'
            quote.sent_at = datetime.utcnow()
            db.session.commit()
            
            # 📧 LOG: Quote sent successfully
            current_app.logger.info(f"✅ Quote #{quote.quote_number} sent successfully to {client_email}")
            current_app.logger.info(f"📊 Send summary - PDF attached: {email_result.get('pdf_attached', False)}")
            
            return jsonify({
                'message': f'Quote sent successfully to {client_email}',
                'quote': quote.to_dict(include_project=True),
                'email_details': {
                    'sent_to': client_email,
                    'sent_at': quote.sent_at.isoformat(),
                    'pdf_attached': email_result.get('pdf_attached', False),
                    'pdf_details': email_result.get('pdf_details', {})
                },
                'pdf_status': pdf_status
            })
            
        except Exception as e:
            current_app.logger.error(f'❌ Failed to send quote email: {e}')
            # Revert status change if email fails
            quote.status = 'draft'
            quote.sent_at = None
            db.session.commit()
            
            return jsonify({
                'error': 'Failed to send email',
                'details': 'Quote status not changed due to email delivery failure',
                'pdf_status': pdf_status
            }), 500
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Send quote error: {e}')
        return jsonify({'error': 'Failed to send quote'}), 500


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