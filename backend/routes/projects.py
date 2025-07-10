import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
import json
import traceback

from models import db
from models.user import User
from models.project import Project
from models.client import Client
from models.subscription import Subscription
from services.floor_plan_analyzer import FloorPlanAnalyzer
from utils.decorators import require_active_subscription
from utils.validators import allowed_file

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('', methods=['GET'])
@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects for the user's company"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 100)
        status_filter = request.args.get('status')
        search = request.args.get('search')
        
        query = Project.query.filter_by(company_id=user.company_id)
        
        if status_filter:
            query = query.filter(Project.status == status_filter)
        
        if search:
            query = query.filter(
                db.or_(
                    Project.name.ilike(f'%{search}%'),
                    Project.client_name.ilike(f'%{search}%'),
                    Project.description.ilike(f'%{search}%')
                )
            )
        
        query = query.order_by(Project.created_at.desc())
        projects_paginated = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'projects': [project.to_dict() for project in projects_paginated.items],
            'pagination': {
                'page': page,
                'pages': projects_paginated.pages,
                'per_page': per_page,
                'total': projects_paginated.total,
                'has_next': projects_paginated.has_next,
                'has_prev': projects_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get projects error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to get projects'}), 500

@projects_bp.route('', methods=['POST'])
@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project with client integration"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        subscription = user.company.subscription
        if subscription:
            max_projects = getattr(subscription, 'max_projects', 0)
            projects_used = getattr(subscription, 'projects_used_this_month', 0)
            
            if max_projects > 0 and projects_used >= max_projects:
                return jsonify({
                    'error': 'Project limit reached for your subscription plan'
                }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'property_type', 'property_address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        client_id = data.get('client_id')
        client = None
        
        if client_id:
            client = Client.query.filter_by(
                id=client_id,
                company_id=user.company_id
            ).first()
            
            if not client:
                return jsonify({'error': 'Selected client not found'}), 404
        else:
            client_data = data.get('client_data', {})
            if client_data and client_data.get('company_name') and client_data.get('email'):
                existing_client = Client.query.filter_by(
                    company_id=user.company_id,
                    email=client_data['email']
                ).first()
                
                if existing_client:
                    client = existing_client
                else:
                    client = Client(
                        company_name=client_data['company_name'],
                        contact_name=client_data.get('contact_name', ''),
                        email=client_data['email'],
                        phone=client_data.get('phone', ''),
                        address=client_data.get('address', ''),
                        postcode=client_data.get('postcode', ''),
                        city=client_data.get('city', ''),
                        btw_number=client_data.get('btw_number', ''),
                        kvk_number=client_data.get('kvk_number', ''),
                        iban=client_data.get('iban', ''),
                        website=client_data.get('website', ''),
                        company_id=user.company_id,
                        created_by=user.id
                    )
                    db.session.add(client)
                    db.session.flush()
        
        project = Project(
            name=data['name'],
            description=data.get('description', ''),
            project_type=data.get('project_type', 'interior'),
            property_type=data['property_type'],
            property_address=data['property_address'],
            client_id=client.id if client else None,
            client_name=client.company_name if client else data.get('client_name', ''),
            client_email=client.email if client else data.get('client_email', ''),
            client_phone=client.phone if client else data.get('client_phone', ''),
            client_address=client.address if client else data.get('client_address', ''),
            company_id=user.company_id,
            created_by=user.id,
            status='draft'
        )
        
        db.session.add(project)
        
        if subscription and hasattr(subscription, 'projects_used_this_month'):
            subscription.projects_used_this_month = getattr(subscription, 'projects_used_this_month', 0) + 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project created successfully',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create project error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': f'Failed to create project: {str(e)}'}), 500

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Get a specific project"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify({
            'project': project.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get project error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to get project'}), 500

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update a project"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        data = request.get_json()
        
        updatable_fields = [
            'name', 'description', 'project_type', 'property_type', 'property_address',
            'client_name', 'client_email', 'client_phone', 'client_address'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(project, field, data[field])
        
        if 'client_data' in data and project.client_id:
            client = Client.query.get(project.client_id)
            if client:
                client_data = data['client_data']
                client.company_name = client_data.get('company_name', client.company_name)
                client.contact_name = client_data.get('contact_name', client.contact_name)
                client.email = client_data.get('email', client.email)
                client.phone = client_data.get('phone', client.phone)
                client.address = client_data.get('address', client.address)
                client.postcode = client_data.get('postcode', client.postcode)
                client.city = client_data.get('city', client.city)
                client.btw_number = client_data.get('btw_number', client.btw_number)
                client.kvk_number = client_data.get('kvk_number', client.kvk_number)
                client.iban = client_data.get('iban', client.iban)
                client.website = client_data.get('website', client.website)
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Project updated successfully',
            'project': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update project error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to update project'}), 500

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """Delete a project"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        try:
            if project.uploaded_images:
                for image_path in project.uploaded_images:
                    if os.path.exists(image_path):
                        os.remove(image_path)
            
            if project.generated_files:
                for file_path in project.generated_files:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        
            if project.quote_pdf_path and os.path.exists(project.quote_pdf_path):
                os.remove(project.quote_pdf_path)
                
        except Exception as e:
            current_app.logger.warning(f'Error deleting project files: {str(e)}\n{traceback.format_exc()}')
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Project deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete project error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to delete project'}), 500

@projects_bp.route('/<int:project_id>/upload', methods=['POST'])
@jwt_required()
def upload_project_files(project_id):
    """Upload floor plan images for a project"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        uploaded_files = []
        
        for file in files:
            if file and file.filename:
                if not allowed_file(file.filename):
                    return jsonify({
                        'error': f'Invalid file type: {file.filename}. Allowed: png, jpg, jpeg, gif, bmp, tiff, pdf'
                    }), 400
                
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                
                upload_dir = os.path.join(
                    current_app.config['UPLOAD_FOLDER'],
                    str(user.company_id),
                    str(project_id)
                )
                os.makedirs(upload_dir, exist_ok=True)
                
                file_path = os.path.join(upload_dir, unique_filename)
                file.save(file_path)
                
                uploaded_files.append({
                    'original_name': filename,
                    'saved_name': unique_filename,
                    'path': file_path,
                    'size': os.path.getsize(file_path)
                })
                
                project.add_uploaded_image(file_path)
        
        return jsonify({
            'message': f'Successfully uploaded {len(uploaded_files)} files',
            'files': uploaded_files,
            'project': project.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Upload files error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to upload files'}), 500

@projects_bp.route('/<int:project_id>/analyze', methods=['POST'])
@jwt_required()
@require_active_subscription
def analyze_floor_plan(project_id):
    """Analyze uploaded floor plan using simplified AI (rooms, walls, and ceilings only)"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if not project.uploaded_images:
            return jsonify({'error': 'No images uploaded for analysis'}), 400
        
        project.status = 'analyzing'
        db.session.commit()
        
        analyzer = FloorPlanAnalyzer(
            openai_api_key=current_app.config['OPENAI_API_KEY']
        )
        
        results_dir = os.path.join(
            current_app.config['RESULTS_FOLDER'],
            str(user.company_id),
            str(project_id),
            f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        )
        os.makedirs(results_dir, exist_ok=True)
        
        floor_plan_path = project.uploaded_images[0]
        
        analysis_results = analyzer.process_floor_plan(
            image_path=floor_plan_path,
            results_dir=results_dir,
            analysis_id=f"project_{project_id}"
        )
        
        if analysis_results.get('status') == 'success':
            project.set_analysis_results(analysis_results)
            
            generated_files = []
            for filename in os.listdir(results_dir):
                file_path = os.path.join(results_dir, filename)
                generated_files.append(file_path)
            
            project.generated_files = generated_files
            project.status = 'ready'
            db.session.commit()
            
            return jsonify({
                'message': 'Floor plan analysis completed successfully (rooms, walls, and ceilings only)',
                'analysis': analysis_results,
                'project': project.to_dict()
            })
        else:
            project.status = 'draft'
            db.session.commit()
            error_details = analysis_results.get('message', 'Unknown error')
            current_app.logger.error(f'Floor plan analysis failed: {error_details}')
            return jsonify({
                'error': 'Floor plan analysis failed',
                'details': error_details
            }), 500
            
    except Exception as e:
        try:
            project.status = 'draft'
            db.session.commit()
        except:
            pass
            
        error_msg = f'Analyze floor plan error: {str(e)}\n{traceback.format_exc()}'
        current_app.logger.error(error_msg)
        return jsonify({
            'error': 'Floor plan analysis failed',
            'details': str(e)
        }), 500

@projects_bp.route('/<int:project_id>/manual-measurements', methods=['POST'])
@jwt_required()
def save_manual_measurements(project_id):
    """Save manual measurements for a project"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        data = request.get_json()
        
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid measurements data format'}), 400
        
        project.manual_measurements = data
        
        if project.status == 'draft':
            project.status = 'ready'
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Manual measurements saved successfully',
            'project': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Save manual measurements error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to save measurements'}), 500

@projects_bp.route('/<int:project_id>/files/<path:filename>', methods=['GET'])
@jwt_required()
def download_project_file(project_id, filename):
    """Download a project file"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        file_found = False
        file_path = None
        
        if project.uploaded_images:
            for image_path in project.uploaded_images:
                if os.path.basename(image_path) == filename:
                    file_path = image_path
                    file_found = True
                    break
        
        if not file_found and project.generated_files:
            for gen_file_path in project.generated_files:
                if os.path.basename(gen_file_path) == filename:
                    file_path = gen_file_path
                    file_found = True
                    break
        
        if not file_found and project.quote_pdf_path:
            if os.path.basename(project.quote_pdf_path) == filename:
                file_path = project.quote_pdf_path
                file_found = True
        
        if not file_found or not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        current_app.logger.error(f'Download file error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to download file'}), 500

@projects_bp.route('/<int:project_id>/duplicate', methods=['POST'])
@jwt_required()
@require_active_subscription
def duplicate_project(project_id):
    """Create a duplicate of an existing project"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        original_project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not original_project:
            return jsonify({'error': 'Project not found'}), 404
        
        subscription = user.company.subscription
        if not subscription.can_create_project():
            return jsonify({
                'error': 'Project limit reached for your subscription plan'
            }), 403
        
        data = request.get_json()
        new_name = data.get('name', f"{original_project.name} (Copy)")
        
        duplicate_project = Project(
            name=new_name,
            description=original_project.description,
            client_name=original_project.client_name,
            client_email=original_project.client_email,
            client_phone=original_project.client_phone,
            client_address=original_project.client_address,
            project_type=original_project.project_type,
            property_type=original_project.property_type,
            property_address=original_project.property_address,
            manual_measurements=original_project.manual_measurements,
            company_id=user.company_id,
            created_by=user.id,
            status='draft'
        )
        
        db.session.add(duplicate_project)
        db.session.flush()
        
        if original_project.uploaded_images:
            new_upload_dir = os.path.join(
                current_app.config['UPLOAD_FOLDER'],
                str(user.company_id),
                str(duplicate_project.id)
            )
            os.makedirs(new_upload_dir, exist_ok=True)
            
            new_uploaded_images = []
            for original_path in original_project.uploaded_images:
                if os.path.exists(original_path):
                    filename = os.path.basename(original_path)
                    new_path = os.path.join(new_upload_dir, filename)
                    
                    import shutil
                    shutil.copy2(original_path, new_path)
                    new_uploaded_images.append(new_path)
            
            duplicate_project.uploaded_images = new_uploaded_images
        
        subscription.projects_used_this_month += 1
        db.session.commit()
        
        return jsonify({
            'message': 'Project duplicated successfully',
            'project': duplicate_project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Duplicate project error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to duplicate project'}), 500

@projects_bp.route('/<int:project_id>/email-quote', methods=['POST'])
@jwt_required()
def email_quote(project_id):
    """Send quote email to client"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 400

        data = request.get_json()
        if not data or 'client_email' not in data or 'project_name' not in data or 'total_cost' not in data:
            return jsonify({'error': 'Client email, project name, and total cost are required'}), 400

        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        client_email = data['client_email']
        project_name = data['project_name']
        total_cost = data['total_cost']
        quote_id = data.get('quote_id', 'N/A')

        smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.example.com')
        smtp_port = current_app.config.get('SMTP_PORT', 587)
        smtp_user = current_app.config.get('SMTP_USER', 'your-email@example.com')
        smtp_password = current_app.config.get('SMTP_PASSWORD', 'your-password')

        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        import smtplib

        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = client_email
        msg['Subject'] = f'Quote for Project: {project_name}'

        body = f"""
Dear {data.get('client_name', 'Client')},

Thank you for choosing our services for your project "{project_name}". Below is the quote summary:

Project: {project_name}
Quote ID: {quote_id}
Total Cost: £{total_cost:.2f}

Please review the attached quote details (if applicable) and contact us with any questions.

Best regards,
{user.company.name}
"""

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return jsonify({
            'message': 'Quote emailed successfully',
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f'Email quote error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({
            'error': 'Failed to send quote email',
            'details': str(e)
        }), 500

@projects_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_project_stats():
    """Get project statistics for the company"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        total_projects = Project.query.filter_by(company_id=user.company_id).count()
        draft_projects = Project.query.filter_by(company_id=user.company_id, status='draft').count()
        analyzing_projects = Project.query.filter_by(company_id=user.company_id, status='analyzing').count()
        ready_projects = Project.query.filter_by(company_id=user.company_id, status='ready').count()
        completed_projects = Project.query.filter_by(company_id=user.company_id, status='completed').count()
        
        total_revenue = 0.0
        try:
            completed_project_objects = Project.query.filter_by(
                company_id=user.company_id,
                status='completed'
            ).all()
            
            for project in completed_project_objects:
                quote_total = None
                if hasattr(project, 'quote_total_with_vat') and project.quote_total_with_vat:
                    quote_total = project.quote_total_with_vat
                elif hasattr(project, 'quote_total') and project.quote_total:
                    quote_total = project.quote_total
                elif hasattr(project, 'total_amount') and project.total_amount:
                    quote_total = project.total_amount
                
                if quote_total:
                    try:
                        total_revenue += float(quote_total)
                    except (ValueError, TypeError):
                        continue
        except Exception as e:
            current_app.logger.warning(f'Error calculating revenue: {str(e)}\n{traceback.format_exc()}')
            total_revenue = 0.0
        
        recent_projects = []
        try:
            recent_projects_query = Project.query.filter_by(
                company_id=user.company_id
            ).order_by(Project.created_at.desc()).limit(5).all()
            recent_projects = [project.to_dict() for project in recent_projects_query]
        except Exception as e:
            current_app.logger.warning(f'Error getting recent projects: {str(e)}\n{traceback.format_exc()}')
            recent_projects = []
        
        subscription = user.company.subscription
        projects_this_month = 0
        project_limit = 0
        subscription_dict = None
        
        try:
            if subscription:
                projects_this_month = getattr(subscription, 'projects_used_this_month', 0)
                if hasattr(subscription, 'get_max_projects'):
                    try:
                        project_limit = subscription.get_max_projects()
                    except Exception:
                        project_limit = getattr(subscription, 'max_projects', 0)
                else:
                    project_limit = getattr(subscription, 'max_projects', 0)
                if hasattr(subscription, 'to_dict'):
                    try:
                        subscription_dict = subscription.to_dict()
                    except Exception as e:
                        current_app.logger.warning(f'Error converting subscription to dict: {str(e)}\n{traceback.format_exc()}')
                        subscription_dict = {
                            'id': getattr(subscription, 'id', None),
                            'plan_name': getattr(subscription, 'plan_name', 'unknown'),
                            'status': getattr(subscription, 'status', 'unknown'),
                            'max_projects': project_limit,
                            'projects_used_this_month': projects_this_month
                        }
        except Exception as e:
            current_app.logger.warning(f'Error processing subscription: {str(e)}\n{traceback.format_exc()}')
        
        avg_project_value = 0.0
        if completed_projects > 0 and total_revenue > 0:
            avg_project_value = total_revenue / completed_projects
        
        return jsonify({
            'stats': {
                'total_projects': total_projects,
                'draft_projects': draft_projects,
                'analyzing_projects': analyzing_projects,
                'ready_projects': ready_projects,
                'completed_projects': completed_projects,
                'projects_this_month': projects_this_month,
                'project_limit': project_limit,
                'total_revenue': round(total_revenue, 2),
                'avg_project_value': round(avg_project_value, 2)
            },
            'recent_projects': recent_projects,
            'subscription_status': subscription_dict
        })
        
    except Exception as e:
        current_app.logger.error(f'Get project stats error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({
            'stats': {
                'total_projects': 0,
                'draft_projects': 0,
                'analyzing_projects': 0,
                'ready_projects': 0,
                'completed_projects': 0,
                'projects_this_month': 0,
                'project_limit': 0,
                'total_revenue': 0.0,
                'avg_project_value': 0.0
            },
            'recent_projects': [],
            'subscription_status': None
        }), 200