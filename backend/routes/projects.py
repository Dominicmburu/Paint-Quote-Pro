import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
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


# routes/projects.py - Updated create_project function
@projects_bp.route('', methods=['POST'])
@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project with basic project details only"""
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
        
        # Only require basic project fields
        required_fields = ['name', 'property_type', 'property_address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create project with only basic details
        project = Project(
            name=data['name'],
            description=data.get('description', ''),
            project_type=data.get('project_type', 'interior'),
            property_type=data['property_type'],
            property_address=data['property_address'],
            # Client fields are now optional and will be None initially
            client_id=None,
            client_name=None,
            client_email=None,
            client_phone=None,
            client_address=None,
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

# Add a new route for updating client information
@projects_bp.route('/<int:project_id>/client', methods=['PUT'])
@jwt_required()
def update_project_client(project_id):
    """Update client information for a project"""
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
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Handle client selection or creation
        client_id = data.get('client_id')
        client = None
        
        if client_id:
            # Using existing client
            client = Client.query.filter_by(
                id=client_id,
                company_id=user.company_id
            ).first()
            
            if not client:
                return jsonify({'error': 'Selected client not found'}), 404
        else:
            # Creating new client or using manual entry
            client_data = data.get('client_data', {})
            if client_data and client_data.get('company_name') and client_data.get('email'):
                # Check if client already exists
                existing_client = Client.query.filter_by(
                    company_id=user.company_id,
                    email=client_data['email']
                ).first()
                
                if existing_client:
                    client = existing_client
                else:
                    # Create new client
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
        
        # Update project with client information
        if client:
            project.client_id = client.id
            project.client_name = client.company_name
            project.client_email = client.email
            project.client_phone = client.phone
            project.client_address = client.address
        else:
            # Manual client entry without creating a client record
            project.client_name = data.get('client_name', '')
            project.client_email = data.get('client_email', '')
            project.client_phone = data.get('client_phone', '')
            project.client_address = data.get('client_address', '')
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Client information updated successfully',
            'project': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update project client error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': 'Failed to update client information'}), 500


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
        
        # 🔧 NEW: Clean up existing analysis files and data
        current_app.logger.info(f"🧹 Cleaning up existing analysis data for project {project_id}")
        
        # Clear existing analysis data
        project.floor_plan_analysis = None
        project.manual_measurements = None
        
        # Remove existing generated files
        if project.generated_files:
            for file_path in project.generated_files:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        current_app.logger.info(f"🗑️ Deleted existing file: {file_path}")
                except Exception as e:
                    current_app.logger.warning(f"⚠️ Could not delete file {file_path}: {e}")
        
        # Remove existing analysis directories
        base_results_dir = os.path.join(
            current_app.config['RESULTS_FOLDER'],
            str(user.company_id),
            str(project_id)
        )
        
        if os.path.exists(base_results_dir):
            try:
                import shutil
                shutil.rmtree(base_results_dir)
                current_app.logger.info(f"🗑️ Deleted existing analysis directory: {base_results_dir}")
            except Exception as e:
                current_app.logger.warning(f"⚠️ Could not delete directory {base_results_dir}: {e}")
        
        project.generated_files = []
        project.status = 'analyzing'
        db.session.commit()
        current_app.logger.info("✅ Cleanup completed, starting fresh analysis")
        
        # Create new analysis
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
        
        current_app.logger.info(f"🚀 Starting fresh AI analysis for project {project_id}")
        analysis_results = analyzer.process_floor_plan(
            image_path=floor_plan_path,
            results_dir=results_dir,
            analysis_id=f"project_{project_id}"
        )
        
        if analysis_results.get('status') == 'success':
            # Save analysis results
            project.floor_plan_analysis = analysis_results
            
            # 🔧 ENHANCED: Save structured measurements immediately to database
            if 'structured_measurements' in analysis_results:
                measurements = analysis_results['structured_measurements']
                project.manual_measurements = measurements
                
                # Log the measurements for debugging
                rooms_count = len(measurements.get('rooms', []))
                current_app.logger.info(f"💾 Saving {rooms_count} rooms to database")
                
                for i, room in enumerate(measurements.get('rooms', [])):
                    walls_count = len(room.get('walls', []))
                    ceiling_area = room.get('ceiling', {}).get('area', 0) if room.get('ceiling') else 0
                    current_app.logger.info(f"  Room {i+1}: {room.get('name')} - {walls_count} walls, ceiling: {ceiling_area}m²")
            
            # Save generated files
            generated_files = []
            for filename in os.listdir(results_dir):
                file_path = os.path.join(results_dir, filename)
                generated_files.append(file_path)
            
            project.generated_files = generated_files
            project.status = 'ready'
            project.updated_at = datetime.utcnow()
            db.session.commit()
            
            # Log success with details
            rooms_detected = len(analysis_results.get('structured_measurements', {}).get('rooms', []))
            current_app.logger.info(f"✅ Analysis completed successfully - {rooms_detected} rooms detected")
            
            return jsonify({
                'message': f'Floor plan analysis completed successfully - {rooms_detected} rooms detected',
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


# @projects_bp.route('/<int:project_id>/quote', methods=['POST'])
# @jwt_required()
# def generate_quote(project_id):
#     """Generate a comprehensive quote from project measurements"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = db.session.get(User, int(current_user_id))
        
#         project = Project.query.filter_by(
#             id=project_id,
#             company_id=user.company_id
#         ).first()
        
#         if not project:
#             return jsonify({'error': 'Project not found'}), 404
        
#         if not project.manual_measurements:
#             return jsonify({'error': 'No measurements found for quote generation'}), 400
        
#         data = request.get_json()
#         measurements = project.manual_measurements
        
#         # Generate comprehensive line items from measurements
#         line_items = []
        
#         # Process rooms (walls and ceilings)
#         rooms = measurements.get('rooms', [])
#         for room in rooms:
#             room_name = room.get('name', 'Unknown Room')
            
#             # Process walls
#             walls = room.get('walls', [])
#             for wall in walls:
#                 wall_name = wall.get('name', 'Wall')
#                 wall_area = wall.get('area', 0)
                
#                 if wall_area > 0:
#                     # Sanding/Filling
#                     if wall.get('sanding_filling'):
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Sanding & Filling',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': data.get('wall_sanding_price', 5.00),
#                             'total': wall_area * data.get('wall_sanding_price', 5.00)
#                         })
                    
#                     # Priming
#                     if wall.get('priming'):
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Priming',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': data.get('wall_priming_price', 4.50),
#                             'total': wall_area * data.get('wall_priming_price', 4.50)
#                         })
                    
#                     # One Coat
#                     if wall.get('one_coat'):
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Painting (1 Coat)',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': data.get('wall_one_coat_price', 6.00),
#                             'total': wall_area * data.get('wall_one_coat_price', 6.00)
#                         })
                    
#                     # Two Coats
#                     if wall.get('two_coats'):
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Painting (2 Coats)',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': data.get('wall_two_coats_price', 9.50),
#                             'total': wall_area * data.get('wall_two_coats_price', 9.50)
#                         })
            
#             # Process ceiling
#             ceiling = room.get('ceiling')
#             if ceiling and ceiling.get('area', 0) > 0:
#                 ceiling_area = ceiling['area']
                
#                 # Ceiling Sanding/Filling
#                 if ceiling.get('sanding_filling'):
#                     line_items.append({
#                         'description': f'{room_name} - Ceiling - Sanding & Filling',
#                         'quantity': ceiling_area,
#                         'unit': 'm²',
#                         'unit_price': data.get('ceiling_prep_price', 4.00),
#                         'total': ceiling_area * data.get('ceiling_prep_price', 4.00)
#                     })
                
#                 # Ceiling Priming
#                 if ceiling.get('priming'):
#                     line_items.append({
#                         'description': f'{room_name} - Ceiling - Priming',
#                         'quantity': ceiling_area,
#                         'unit': 'm²',
#                         'unit_price': data.get('ceiling_priming_price', 4.00),
#                         'total': ceiling_area * data.get('ceiling_priming_price', 4.00)
#                     })
                
#                 # Ceiling One Coat
#                 if ceiling.get('one_coat'):
#                     line_items.append({
#                         'description': f'{room_name} - Ceiling - Painting (1 Coat)',
#                         'quantity': ceiling_area,
#                         'unit': 'm²',
#                         'unit_price': data.get('ceiling_one_coat_price', 5.50),
#                         'total': ceiling_area * data.get('ceiling_one_coat_price', 5.50)
#                     })
                
#                 # Ceiling Two Coats
#                 if ceiling.get('two_coats'):
#                     line_items.append({
#                         'description': f'{room_name} - Ceiling - Painting (2 Coats)',
#                         'quantity': ceiling_area,
#                         'unit': 'm²',
#                         'unit_price': data.get('ceiling_two_coats_price', 8.50),
#                         'total': ceiling_area * data.get('ceiling_two_coats_price', 8.50)
#                     })
        
#         # Process interior items
#         interior_items = measurements.get('interiorItems', {})
#         interior_prices = {
#             'doors': data.get('interior_door_price', 85.00),
#             'fixedWindows': data.get('interior_fixed_window_price', 45.00),
#             'turnWindows': data.get('interior_turn_window_price', 55.00),
#             'stairs': data.get('interior_stairs_price', 25.00),
#             'radiators': data.get('interior_radiator_price', 35.00),
#             'skirtingBoards': data.get('interior_skirting_price', 12.00),
#             'otherItems': data.get('interior_other_price', 10.00)
#         }
        
#         for item_type, items in interior_items.items():
#             if item_type in interior_prices:
#                 for item in items:
#                     quantity = item.get('quantity', 0)
#                     description = item.get('description', item_type.replace('_', ' ').title())
#                     if quantity > 0:
#                         line_items.append({
#                             'description': f'Interior - {description}',
#                             'quantity': quantity,
#                             'unit': 'piece',
#                             'unit_price': interior_prices[item_type],
#                             'total': quantity * interior_prices[item_type]
#                         })
        
#         # Process exterior items
#         exterior_items = measurements.get('exteriorItems', {})
#         exterior_prices = {
#             'doors': data.get('exterior_door_price', 120.00),
#             'fixedWindows': data.get('exterior_fixed_window_price', 65.00),
#             'turnWindows': data.get('exterior_turn_window_price', 75.00),
#             'dormerWindows': data.get('exterior_dormer_window_price', 120.00),
#             'fasciaBoards': data.get('exterior_fascia_price', 18.00),
#             'rainPipe': data.get('exterior_rain_pipe_price', 15.00),
#             'otherItems': data.get('exterior_other_price', 15.00)
#         }
        
#         for item_type, items in exterior_items.items():
#             if item_type in exterior_prices:
#                 for item in items:
#                     quantity = item.get('quantity', 0)
#                     description = item.get('description', item_type.replace('_', ' ').title())
#                     if quantity > 0:
#                         line_items.append({
#                             'description': f'Exterior - {description}',
#                             'quantity': quantity,
#                             'unit': 'piece',
#                             'unit_price': exterior_prices[item_type],
#                             'total': quantity * exterior_prices[item_type]
#                         })
        
#         # Process special jobs
#         special_jobs = measurements.get('specialJobs', [])
#         for job in special_jobs:
#             if job.get('quantity', 0) > 0 and job.get('unitPrice', 0) > 0:
#                 line_items.append({
#                     'description': f'Special Job - {job.get("name", "Custom Work")}',
#                     'quantity': job.get('quantity', 1),
#                     'unit': job.get('unit', 'job'),
#                     'unit_price': job.get('unitPrice', 0),
#                     'total': job.get('quantity', 1) * job.get('unitPrice', 0)
#                 })
        
#         # Add cleanup fee if there are items
#         if line_items:
#             cleanup_fee = data.get('cleanup_fee', 150.00)
#             line_items.append({
#                 'description': 'Site Cleanup & Preparation',
#                 'quantity': 1,
#                 'unit': 'job',
#                 'unit_price': cleanup_fee,
#                 'total': cleanup_fee
#             })
        
#         if not line_items:
#             return jsonify({'error': 'No work items found to generate quote from'}), 400
        
#         # Calculate totals
#         subtotal = sum(item['total'] for item in line_items)
#         vat_rate = user.company.vat_rate if user.company and hasattr(user.company, 'vat_rate') else 0.20
#         vat_amount = subtotal * vat_rate
#         total_amount = subtotal + vat_amount
        
#         # Create quote
#         from models.quote import Quote
#         quote = Quote(
#             quote_number=Quote.generate_quote_number(),
#             title=data.get('title', f"Paint Quote - {project.name}"),
#             description=data.get('description', f"Comprehensive painting quote for {project.name} including detailed room-by-room breakdown"),
#             subtotal=round(subtotal, 2),
#             vat_amount=round(vat_amount, 2),
#             total_amount=round(total_amount, 2),
#             line_items=line_items,
#             project_id=project_id,
#             valid_until=datetime.utcnow() + timedelta(days=data.get('valid_days', 30))
#         )
        
#         db.session.add(quote)
#         db.session.flush()
        
#         # Generate PDF
#         from services.quote_generator import QuoteGenerator
#         quote_generator = QuoteGenerator()
#         pdf_path = quote_generator.generate_quote_pdf(
#             quote=quote,
#             project=project,
#             company=user.company,
#             output_dir=os.path.join(
#                 current_app.config['RESULTS_FOLDER'],
#                 str(user.company_id),
#                 str(project_id)
#             )
#         )
        
#         quote.pdf_path = pdf_path
#         project.quote_pdf_path = pdf_path
#         project.quote_data = {
#             'quote_id': quote.id,
#             'quote_number': quote.quote_number,
#             'subtotal': quote.subtotal,
#             'vat_amount': quote.vat_amount,
#             'total_amount': quote.total_amount,
#             'line_items_count': len(line_items),
#             'generated_at': datetime.utcnow().isoformat()
#         }
        
#         if project.status in ['draft', 'ready']:
#             project.status = 'quoted'
        
#         db.session.commit()
        
#         return jsonify({
#             'message': 'Quote generated successfully with detailed measurements',
#             'quote': quote.to_dict(include_project=True, include_company=True),
#             'quote_id': quote.id,
#             'pdf_path': pdf_path
#         }), 201
        
#     except Exception as e:
#         db.session.rollback()
#         current_app.logger.error(f'Generate project quote error: {e}')
#         return jsonify({'error': 'Failed to generate quote'}), 500


# @projects_bp.route('/<int:project_id>/quote', methods=['POST'])
# @jwt_required()
# def generate_quote(project_id):
#     """Generate a comprehensive quote from project measurements"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = db.session.get(User, int(current_user_id))
        
#         project = Project.query.filter_by(
#             id=project_id,
#             company_id=user.company_id
#         ).first()
        
#         if not project:
#             return jsonify({'error': 'Project not found'}), 404
        
#         if not project.manual_measurements:
#             return jsonify({'error': 'No measurements found for quote generation'}), 400
        
#         data = request.get_json()
#         measurements = project.manual_measurements
        
#         # Generate comprehensive line items from measurements
#         line_items = []
        
#         current_app.logger.info(f"🔄 Generating quote for project {project_id}")
#         current_app.logger.info(f"📊 Measurements data: {measurements}")
        
#         # Process rooms (walls and ceilings)
#         rooms = measurements.get('rooms', [])
#         current_app.logger.info(f"🏠 Processing {len(rooms)} rooms")
        
#         for room in rooms:
#             room_name = room.get('name', 'Unknown Room')
#             current_app.logger.info(f"🔄 Processing room: {room_name}")
            
#             # Process walls
#             walls = room.get('walls', [])
#             for wall in walls:
#                 wall_name = wall.get('name', 'Wall')
                
#                 # Ensure area is a float
#                 try:
#                     wall_area = float(wall.get('area', 0))
#                 except (ValueError, TypeError):
#                     wall_area = 0.0
                
#                 current_app.logger.info(f"🧱 Processing wall: {wall_name}, area: {wall_area}")
                
#                 if wall_area > 0:
#                     # Sanding/Filling
#                     if wall.get('sanding_filling') is True:
#                         price = float(data.get('wall_sanding_price', 5.00))
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Sanding & Filling',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': wall_area * price
#                         })
#                         current_app.logger.info(f"✅ Added sanding/filling: {wall_area}m² × £{price}")
                    
#                     # Priming
#                     if wall.get('priming') is True:
#                         price = float(data.get('wall_priming_price', 4.50))
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Priming',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': wall_area * price
#                         })
#                         current_app.logger.info(f"✅ Added priming: {wall_area}m² × £{price}")
                    
#                     # One Coat
#                     if wall.get('one_coat') is True:
#                         price = float(data.get('wall_one_coat_price', 6.00))
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Painting (1 Coat)',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': wall_area * price
#                         })
#                         current_app.logger.info(f"✅ Added one coat: {wall_area}m² × £{price}")
                    
#                     # Two Coats
#                     if wall.get('two_coats') is True:
#                         price = float(data.get('wall_two_coats_price', 9.50))
#                         line_items.append({
#                             'description': f'{room_name} - {wall_name} - Painting (2 Coats)',
#                             'quantity': wall_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': wall_area * price
#                         })
#                         current_app.logger.info(f"✅ Added two coats: {wall_area}m² × £{price}")
            
#             # Process ceiling
#             ceiling = room.get('ceiling')
#             if ceiling and ceiling.get('area'):
#                 try:
#                     ceiling_area = float(ceiling.get('area', 0))
#                 except (ValueError, TypeError):
#                     ceiling_area = 0.0
                
#                 current_app.logger.info(f"🏔️ Processing ceiling, area: {ceiling_area}")
                
#                 if ceiling_area > 0:
#                     # Ceiling Sanding/Filling
#                     if ceiling.get('sanding_filling') is True:
#                         price = float(data.get('ceiling_prep_price', 4.00))
#                         line_items.append({
#                             'description': f'{room_name} - Ceiling - Sanding & Filling',
#                             'quantity': ceiling_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': ceiling_area * price
#                         })
#                         current_app.logger.info(f"✅ Added ceiling sanding: {ceiling_area}m² × £{price}")
                    
#                     # Ceiling Priming
#                     if ceiling.get('priming') is True:
#                         price = float(data.get('ceiling_priming_price', 4.00))
#                         line_items.append({
#                             'description': f'{room_name} - Ceiling - Priming',
#                             'quantity': ceiling_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': ceiling_area * price
#                         })
#                         current_app.logger.info(f"✅ Added ceiling priming: {ceiling_area}m² × £{price}")
                    
#                     # Ceiling One Coat
#                     if ceiling.get('one_coat') is True:
#                         price = float(data.get('ceiling_one_coat_price', 5.50))
#                         line_items.append({
#                             'description': f'{room_name} - Ceiling - Painting (1 Coat)',
#                             'quantity': ceiling_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': ceiling_area * price
#                         })
#                         current_app.logger.info(f"✅ Added ceiling one coat: {ceiling_area}m² × £{price}")
                    
#                     # Ceiling Two Coats
#                     if ceiling.get('two_coats') is True:
#                         price = float(data.get('ceiling_two_coats_price', 8.50))
#                         line_items.append({
#                             'description': f'{room_name} - Ceiling - Painting (2 Coats)',
#                             'quantity': ceiling_area,
#                             'unit': 'm²',
#                             'unit_price': price,
#                             'total': ceiling_area * price
#                         })
#                         current_app.logger.info(f"✅ Added ceiling two coats: {ceiling_area}m² × £{price}")
        
#         # Process interior items
#         interior_items = measurements.get('interiorItems', {})
#         interior_prices = {
#             'doors': float(data.get('interior_door_price', 85.00)),
#             'fixedWindows': float(data.get('interior_fixed_window_price', 45.00)),
#             'turnWindows': float(data.get('interior_turn_window_price', 55.00)),
#             'stairs': float(data.get('interior_stairs_price', 25.00)),
#             'radiators': float(data.get('interior_radiator_price', 35.00)),
#             'skirtingBoards': float(data.get('interior_skirting_price', 12.00)),
#             'otherItems': float(data.get('interior_other_price', 10.00))
#         }
        
#         current_app.logger.info(f"🏠 Processing interior items: {interior_items}")
        
#         for item_type, items in interior_items.items():
#             if item_type in interior_prices and isinstance(items, list):
#                 for item in items:
#                     try:
#                         quantity = float(item.get('quantity', 0))
#                     except (ValueError, TypeError):
#                         quantity = 0.0
                    
#                     description = item.get('description', item_type.replace('_', ' ').title())
                    
#                     if quantity > 0:
#                         price = interior_prices[item_type]
#                         line_items.append({
#                             'description': f'Interior - {description}',
#                             'quantity': quantity,
#                             'unit': 'piece',
#                             'unit_price': price,
#                             'total': quantity * price
#                         })
#                         current_app.logger.info(f"✅ Added interior item: {description}, qty: {quantity}")
        
#         # Process exterior items
#         exterior_items = measurements.get('exteriorItems', {})
#         exterior_prices = {
#             'doors': float(data.get('exterior_door_price', 120.00)),
#             'fixedWindows': float(data.get('exterior_fixed_window_price', 65.00)),
#             'turnWindows': float(data.get('exterior_turn_window_price', 75.00)),
#             'dormerWindows': float(data.get('exterior_dormer_window_price', 120.00)),
#             'fasciaBoards': float(data.get('exterior_fascia_price', 18.00)),
#             'rainPipe': float(data.get('exterior_rain_pipe_price', 15.00)),
#             'otherItems': float(data.get('exterior_other_price', 15.00))
#         }
        
#         current_app.logger.info(f"🌿 Processing exterior items: {exterior_items}")
        
#         for item_type, items in exterior_items.items():
#             if item_type in exterior_prices and isinstance(items, list):
#                 for item in items:
#                     try:
#                         quantity = float(item.get('quantity', 0))
#                     except (ValueError, TypeError):
#                         quantity = 0.0
                    
#                     description = item.get('description', item_type.replace('_', ' ').title())
                    
#                     if quantity > 0:
#                         price = exterior_prices[item_type]
#                         line_items.append({
#                             'description': f'Exterior - {description}',
#                             'quantity': quantity,
#                             'unit': 'piece',
#                             'unit_price': price,
#                             'total': quantity * price
#                         })
#                         current_app.logger.info(f"✅ Added exterior item: {description}, qty: {quantity}")
        
#         # Process special jobs
#         special_jobs = measurements.get('specialJobs', [])
#         current_app.logger.info(f"🔧 Processing {len(special_jobs)} special jobs")
        
#         for job in special_jobs:
#             try:
#                 quantity = float(job.get('quantity', 0))
#                 unit_price = float(job.get('unitPrice', 0))
#             except (ValueError, TypeError):
#                 quantity = 0.0
#                 unit_price = 0.0
            
#             if quantity > 0 and unit_price > 0:
#                 line_items.append({
#                     'description': f'Special Job - {job.get("name", "Custom Work")}',
#                     'quantity': quantity,
#                     'unit': job.get('unit', 'job'),
#                     'unit_price': unit_price,
#                     'total': quantity * unit_price
#                 })
#                 current_app.logger.info(f"✅ Added special job: {job.get('name')}, qty: {quantity}")
        
#         # Add cleanup fee if there are items
#         if line_items:
#             cleanup_fee = float(data.get('cleanup_fee', 150.00))
#             line_items.append({
#                 'description': 'Site Cleanup & Preparation',
#                 'quantity': 1,
#                 'unit': 'job',
#                 'unit_price': cleanup_fee,
#                 'total': cleanup_fee
#             })
#             current_app.logger.info(f"✅ Added cleanup fee: £{cleanup_fee}")
        
#         if not line_items:
#             current_app.logger.error("❌ No line items generated")
#             return jsonify({'error': 'No work items found to generate quote from'}), 400
        
#         # Calculate totals
#         subtotal = sum(float(item['total']) for item in line_items)
#         vat_rate = float(getattr(user.company, 'vat_rate', 0.20))
#         vat_amount = subtotal * vat_rate
#         total_amount = subtotal + vat_amount
        
#         current_app.logger.info(f"💰 Quote totals: subtotal=£{subtotal}, vat=£{vat_amount}, total=£{total_amount}")
        
#         # Import Quote model
#         from models.quote import Quote
        
#         # Create quote
#         quote = Quote(
#             quote_number=Quote.generate_quote_number(),
#             title=data.get('title', f"Paint Quote - {project.name}"),
#             description=data.get('description', f"Comprehensive painting quote for {project.name} including detailed room-by-room breakdown"),
#             subtotal=round(subtotal, 2),
#             vat_amount=round(vat_amount, 2),
#             total_amount=round(total_amount, 2),
#             line_items=line_items,
#             project_id=project_id,
#             valid_until=datetime.utcnow() + timedelta(days=int(data.get('valid_days', 30)))
#         )
        
#         db.session.add(quote)
#         db.session.flush()
        
#         current_app.logger.info(f"✅ Quote created with ID: {quote.id}")
        
#         # Generate PDF
#         from services.quote_generator import QuoteGenerator
#         quote_generator = QuoteGenerator()
        
#         # Create output directory
#         output_dir = os.path.join(
#             current_app.config.get('RESULTS_FOLDER', 'static/generated'),
#             str(user.company_id),
#             str(project_id)
#         )
        
#         pdf_path = quote_generator.generate_quote_pdf(
#             quote=quote,
#             project=project,
#             company=user.company,
#             output_dir=output_dir
#         )
        
#         # Update quote and project with PDF path
#         quote.pdf_path = pdf_path
#         project.quote_pdf_path = pdf_path
#         project.quote_data = {
#             'quote_id': quote.id,
#             'quote_number': quote.quote_number,
#             'subtotal': quote.subtotal,
#             'vat_amount': quote.vat_amount,
#             'total_amount': quote.total_amount,
#             'line_items_count': len(line_items),
#             'generated_at': datetime.utcnow().isoformat()
#         }
        
#         # Update project status
#         if project.status in ['draft', 'ready']:
#             project.status = 'quoted'
        
#         db.session.commit()
        
#         current_app.logger.info(f"🎉 Quote generation completed successfully")
        
#         return jsonify({
#             'message': 'Quote generated successfully with detailed measurements',
#             'quote': quote.to_dict(include_project=True, include_company=True),
#             'quote_id': quote.id,
#             'pdf_path': pdf_path
#         }), 201
        
#     except Exception as e:
#         db.session.rollback()
#         current_app.logger.error(f'Generate project quote error: {str(e)}')
#         current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
#         return jsonify({'error': 'Failed to generate quote'}), 500


@projects_bp.route('/<int:project_id>/quote', methods=['POST'])
@jwt_required()
def generate_quote(project_id):
    """Generate a comprehensive quote with full project details"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if not project.manual_measurements:
            return jsonify({'error': 'No measurements found for quote generation'}), 400
        
        data = request.get_json()
        measurements = project.manual_measurements
        
        # Generate comprehensive line items with full details
        line_items = []
        measurement_details = {
            'rooms': [],
            'interior_items': [],
            'exterior_items': [],
            'special_jobs': []
        }
        
        current_app.logger.info(f"🔄 Generating detailed quote for project {project_id}")
        
        # Process rooms with full wall and ceiling details
        rooms = measurements.get('rooms', [])
        current_app.logger.info(f"🏠 Processing {len(rooms)} rooms with detailed measurements")
        
        for room in rooms:
            room_name = room.get('name', 'Unknown Room')
            room_type = room.get('type', 'general')
            
            room_details = {
                'name': room_name,
                'type': room_type,
                'walls': [],
                'ceiling': None,
                'total_wall_area': 0,
                'total_ceiling_area': 0,
                'room_total': 0
            }
            
            current_app.logger.info(f"🔄 Processing room: {room_name} ({room_type})")
            
            # Process each wall with full details
            walls = room.get('walls', [])
            wall_subtotal = 0
            
            for wall in walls:
                wall_name = wall.get('name', 'Wall')
                
                try:
                    wall_length = float(wall.get('length', 0))
                    wall_height = float(wall.get('height', 2.4))
                    wall_area = float(wall.get('area', 0))
                except (ValueError, TypeError):
                    wall_length = wall_height = wall_area = 0.0
                
                # Get selected treatments
                treatments_selected = {
                    'sanding_filling': wall.get('sanding_filling', False),
                    'priming': wall.get('priming', False),
                    'one_coat': wall.get('one_coat', False),
                    'two_coats': wall.get('two_coats', False)
                }
                
                wall_detail = {
                    'name': wall_name,
                    'length': wall_length,
                    'height': wall_height,
                    'area': wall_area,
                    'treatments': treatments_selected,
                    'wall_total': 0
                }
                
                wall_total = 0
                
                if wall_area > 0:
                    room_details['total_wall_area'] += wall_area
                    
                    # Add line items for each selected treatment
                    if treatments_selected['sanding_filling']:
                        price = float(data.get('wall_sanding_price', 5.00))
                        treatment_total = wall_area * price
                        wall_total += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - {wall_name} - Sanding & Filling',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'wall',
                            'treatment': 'sanding_filling',
                            'measurements': {
                                'length': wall_length,
                                'height': wall_height,
                                'area': wall_area
                            }
                        })
                    
                    if treatments_selected['priming']:
                        price = float(data.get('wall_priming_price', 4.50))
                        treatment_total = wall_area * price
                        wall_total += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - {wall_name} - Priming',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'wall',
                            'treatment': 'priming',
                            'measurements': {
                                'length': wall_length,
                                'height': wall_height,
                                'area': wall_area
                            }
                        })
                    
                    if treatments_selected['one_coat']:
                        price = float(data.get('wall_one_coat_price', 6.00))
                        treatment_total = wall_area * price
                        wall_total += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - {wall_name} - Painting (1 Coat)',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'wall',
                            'treatment': 'one_coat',
                            'measurements': {
                                'length': wall_length,
                                'height': wall_height,
                                'area': wall_area
                            }
                        })
                    
                    if treatments_selected['two_coats']:
                        price = float(data.get('wall_two_coats_price', 9.50))
                        treatment_total = wall_area * price
                        wall_total += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - {wall_name} - Painting (2 Coats)',
                            'quantity': wall_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'wall',
                            'treatment': 'two_coats',
                            'measurements': {
                                'length': wall_length,
                                'height': wall_height,
                                'area': wall_area
                            }
                        })
                
                wall_detail['wall_total'] = wall_total
                wall_subtotal += wall_total
                room_details['walls'].append(wall_detail)
                
                current_app.logger.info(f"✅ Wall {wall_name}: {wall_length}m × {wall_height}m = {wall_area}m², total: £{wall_total}")
            
            # Process ceiling with full details
            ceiling = room.get('ceiling')
            ceiling_subtotal = 0
            
            if ceiling and ceiling.get('area'):
                try:
                    ceiling_length = float(ceiling.get('length', 0))
                    ceiling_width = float(ceiling.get('width', 0))
                    ceiling_area = float(ceiling.get('area', 0))
                except (ValueError, TypeError):
                    ceiling_length = ceiling_width = ceiling_area = 0.0
                
                # Get selected ceiling treatments
                ceiling_treatments = {
                    'sanding_filling': ceiling.get('sanding_filling', False),
                    'priming': ceiling.get('priming', False),
                    'one_coat': ceiling.get('one_coat', False),
                    'two_coats': ceiling.get('two_coats', False)
                }
                
                ceiling_detail = {
                    'length': ceiling_length,
                    'width': ceiling_width,
                    'area': ceiling_area,
                    'treatments': ceiling_treatments,
                    'ceiling_total': 0
                }
                
                if ceiling_area > 0:
                    room_details['total_ceiling_area'] = ceiling_area
                    
                    # Add line items for each selected ceiling treatment
                    if ceiling_treatments['sanding_filling']:
                        price = float(data.get('ceiling_prep_price', 4.00))
                        treatment_total = ceiling_area * price
                        ceiling_subtotal += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - Ceiling - Sanding & Filling',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'ceiling',
                            'treatment': 'sanding_filling',
                            'measurements': {
                                'length': ceiling_length,
                                'width': ceiling_width,
                                'area': ceiling_area
                            }
                        })
                    
                    if ceiling_treatments['priming']:
                        price = float(data.get('ceiling_priming_price', 4.00))
                        treatment_total = ceiling_area * price
                        ceiling_subtotal += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - Ceiling - Priming',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'ceiling',
                            'treatment': 'priming',
                            'measurements': {
                                'length': ceiling_length,
                                'width': ceiling_width,
                                'area': ceiling_area
                            }
                        })
                    
                    if ceiling_treatments['one_coat']:
                        price = float(data.get('ceiling_one_coat_price', 5.50))
                        treatment_total = ceiling_area * price
                        ceiling_subtotal += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - Ceiling - Painting (1 Coat)',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'ceiling',
                            'treatment': 'one_coat',
                            'measurements': {
                                'length': ceiling_length,
                                'width': ceiling_width,
                                'area': ceiling_area
                            }
                        })
                    
                    if ceiling_treatments['two_coats']:
                        price = float(data.get('ceiling_two_coats_price', 8.50))
                        treatment_total = ceiling_area * price
                        ceiling_subtotal += treatment_total
                        
                        line_items.append({
                            'description': f'{room_name} - Ceiling - Painting (2 Coats)',
                            'quantity': ceiling_area,
                            'unit': 'm²',
                            'unit_price': price,
                            'total': treatment_total,
                            'category': 'room_work',
                            'room': room_name,
                            'surface': 'ceiling',
                            'treatment': 'two_coats',
                            'measurements': {
                                'length': ceiling_length,
                                'width': ceiling_width,
                                'area': ceiling_area
                            }
                        })
                
                ceiling_detail['ceiling_total'] = ceiling_subtotal
                room_details['ceiling'] = ceiling_detail
                
                current_app.logger.info(f"✅ Ceiling: {ceiling_length}m × {ceiling_width}m = {ceiling_area}m², total: £{ceiling_subtotal}")
            
            room_details['room_total'] = wall_subtotal + ceiling_subtotal
            measurement_details['rooms'].append(room_details)
        
        # Process interior items with full details
        interior_items = measurements.get('interiorItems', {})
        interior_prices = {
            'doors': float(data.get('interior_door_price', 85.00)),
            'fixedWindows': float(data.get('interior_fixed_window_price', 45.00)),
            'turnWindows': float(data.get('interior_turn_window_price', 55.00)),
            'stairs': float(data.get('interior_stairs_price', 25.00)),
            'radiators': float(data.get('interior_radiator_price', 35.00)),
            'skirtingBoards': float(data.get('interior_skirting_price', 12.00)),
            'otherItems': float(data.get('interior_other_price', 10.00))
        }
        
        for item_type, items in interior_items.items():
            if item_type in interior_prices and isinstance(items, list):
                for item in items:
                    try:
                        quantity = float(item.get('quantity', 0))
                    except (ValueError, TypeError):
                        quantity = 0.0
                    
                    if quantity > 0:
                        price = interior_prices[item_type]
                        item_total = quantity * price
                        
                        # Get detailed item information
                        item_detail = {
                            'type': item_type,
                            'description': item.get('description', item_type.replace('_', ' ').title()),
                            'quantity': quantity,
                            'unit_price': price,
                            'total': item_total,
                            'condition': item.get('condition', 'N/A'),
                            'size': item.get('size', 'N/A'),
                            'notes': item.get('notes', ''),
                            'location': item.get('location', ''),
                            'material': item.get('material', ''),
                            'finish': item.get('finish', '')
                        }
                        
                        # Create detailed description based on item type
                        if item_type == 'doors':
                            detailed_desc = f"Interior Door - {item.get('description', 'Door')} (Condition: {item.get('condition', 'Standard')})"
                        elif item_type in ['fixedWindows', 'turnWindows']:
                            detailed_desc = f"Interior Window - {item.get('description', 'Window')} (Size: {item.get('size', 'Standard')})"
                        else:
                            detailed_desc = f"Interior - {item.get('description', item_type.replace('_', ' ').title())}"
                        
                        line_items.append({
                            'description': detailed_desc,
                            'quantity': quantity,
                            'unit': 'piece',
                            'unit_price': price,
                            'total': item_total,
                            'category': 'interior',
                            'item_type': item_type,
                            'details': item_detail
                        })
                        
                        measurement_details['interior_items'].append(item_detail)
                        current_app.logger.info(f"✅ Interior {item_type}: {detailed_desc}, qty: {quantity}")
        
        # Process exterior items with full details
        exterior_items = measurements.get('exteriorItems', {})
        exterior_prices = {
            'doors': float(data.get('exterior_door_price', 120.00)),
            'fixedWindows': float(data.get('exterior_fixed_window_price', 65.00)),
            'turnWindows': float(data.get('exterior_turn_window_price', 75.00)),
            'dormerWindows': float(data.get('exterior_dormer_window_price', 120.00)),
            'fasciaBoards': float(data.get('exterior_fascia_price', 18.00)),
            'rainPipe': float(data.get('exterior_rain_pipe_price', 15.00)),
            'otherItems': float(data.get('exterior_other_price', 15.00))
        }
        
        for item_type, items in exterior_items.items():
            if item_type in exterior_prices and isinstance(items, list):
                for item in items:
                    try:
                        quantity = float(item.get('quantity', 0))
                    except (ValueError, TypeError):
                        quantity = 0.0
                    
                    if quantity > 0:
                        price = exterior_prices[item_type]
                        item_total = quantity * price
                        
                        # Get detailed item information
                        item_detail = {
                            'type': item_type,
                            'description': item.get('description', item_type.replace('_', ' ').title()),
                            'quantity': quantity,
                            'unit_price': price,
                            'total': item_total,
                            'door_type': item.get('doorType', 'N/A'),
                            'size': item.get('size', 'N/A'),
                            'notes': item.get('notes', ''),
                            'location': item.get('location', ''),
                            'material': item.get('material', ''),
                            'finish': item.get('finish', ''),
                            'weatherproof': item.get('weatherproof', False)
                        }
                        
                        # Create detailed description based on item type
                        if item_type == 'doors':
                            detailed_desc = f"Exterior Door - {item.get('description', 'Door')} (Type: {item.get('doorType', 'Standard')})"
                        elif item_type in ['fixedWindows', 'turnWindows', 'dormerWindows']:
                            detailed_desc = f"Exterior Window - {item.get('description', 'Window')} (Size: {item.get('size', 'Standard')})"
                        else:
                            detailed_desc = f"Exterior - {item.get('description', item_type.replace('_', ' ').title())}"
                        
                        line_items.append({
                            'description': detailed_desc,
                            'quantity': quantity,
                            'unit': 'piece',
                            'unit_price': price,
                            'total': item_total,
                            'category': 'exterior',
                            'item_type': item_type,
                            'details': item_detail
                        })
                        
                        measurement_details['exterior_items'].append(item_detail)
                        current_app.logger.info(f"✅ Exterior {item_type}: {detailed_desc}, qty: {quantity}")
        
        # Process special jobs with full details
        special_jobs = measurements.get('specialJobs', [])
        for job in special_jobs:
            try:
                quantity = float(job.get('quantity', 0))
                unit_price = float(job.get('unitPrice', 0))
            except (ValueError, TypeError):
                quantity = unit_price = 0.0
            
            if quantity > 0 and unit_price > 0:
                job_total = quantity * unit_price
                
                job_detail = {
                    'name': job.get('name', 'Custom Work'),
                    'description': job.get('description', ''),
                    'quantity': quantity,
                    'unit': job.get('unit', 'job'),
                    'unit_price': unit_price,
                    'total': job_total,
                    'category': job.get('category', 'General'),
                    'location': job.get('location', ''),
                    'materials_included': job.get('materialsIncluded', True),
                    'estimated_hours': job.get('estimatedHours', 0),
                    'difficulty': job.get('difficulty', 'Standard'),
                    'notes': job.get('notes', '')
                }
                
                detailed_desc = f"Special Job - {job.get('name', 'Custom Work')}"
                if job.get('description'):
                    detailed_desc += f" ({job.get('description')})"
                
                line_items.append({
                    'description': detailed_desc,
                    'quantity': quantity,
                    'unit': job.get('unit', 'job'),
                    'unit_price': unit_price,
                    'total': job_total,
                    'category': 'special',
                    'details': job_detail
                })
                
                measurement_details['special_jobs'].append(job_detail)
                current_app.logger.info(f"✅ Special job: {job.get('name')}, qty: {quantity}")
        
        # Add cleanup fee if there are items
        if line_items:
            cleanup_fee = float(data.get('cleanup_fee', 150.00))
            line_items.append({
                'description': 'Site Cleanup & Preparation',
                'quantity': 1,
                'unit': 'job',
                'unit_price': cleanup_fee,
                'total': cleanup_fee,
                'category': 'general'
            })
        
        if not line_items:
            return jsonify({'error': 'No work items found to generate quote from'}), 400
        
        # Calculate totals
        subtotal = sum(float(item['total']) for item in line_items)
        vat_rate = float(getattr(user.company, 'vat_rate', 0.20))
        vat_amount = subtotal * vat_rate
        total_amount = subtotal + vat_amount
        
        # Import Quote model
        from models.quote import Quote
        
        # Create quote with detailed information
        quote = Quote(
            quote_number=Quote.generate_quote_number(),
            title=data.get('title', f"Comprehensive Paint Quote - {project.name}"),
            description=data.get('description', f"Detailed painting quote for {project.name} including comprehensive room-by-room breakdown with measurements and selected treatments"),
            subtotal=round(subtotal, 2),
            vat_amount=round(vat_amount, 2),
            total_amount=round(total_amount, 2),
            line_items=line_items,
            project_id=project_id,
            valid_until=datetime.utcnow() + timedelta(days=int(data.get('valid_days', 30))),
            measurement_details=measurement_details  # Store detailed measurements
        )
        
        db.session.add(quote)
        db.session.flush()
        
        # Generate enhanced PDF with full details
        from services.quote_generator import QuoteGenerator
        quote_generator = QuoteGenerator()
        
        output_dir = os.path.join(
            current_app.config.get('RESULTS_FOLDER', 'static/generated'),
            str(user.company_id),
            str(project_id)
        )
        
        pdf_path = quote_generator.generate_enhanced_quote_pdf(
            quote=quote,
            project=project,
            company=user.company,
            output_dir=output_dir
        )
        
        # Update quote and project
        quote.pdf_path = pdf_path
        project.quote_pdf_path = pdf_path
        project.quote_data = {
            'quote_id': quote.id,
            'quote_number': quote.quote_number,
            'subtotal': quote.subtotal,
            'vat_amount': quote.vat_amount,
            'total_amount': quote.total_amount,
            'line_items_count': len(line_items),
            'rooms_count': len(measurement_details['rooms']),
            'interior_items_count': len(measurement_details['interior_items']),
            'exterior_items_count': len(measurement_details['exterior_items']),
            'special_jobs_count': len(measurement_details['special_jobs']),
            'generated_at': datetime.utcnow().isoformat()
        }
        
        if project.status in ['draft', 'ready']:
            project.status = 'quoted'
        
        db.session.commit()
        
        current_app.logger.info(f"🎉 Comprehensive quote generation completed successfully")
        
        return jsonify({
            'message': 'Comprehensive quote generated successfully with detailed measurements',
            'quote': quote.to_dict(include_project=True, include_company=True),
            'quote_id': quote.id,
            'pdf_path': pdf_path,
            'summary': {
                'total_line_items': len(line_items),
                'rooms_processed': len(measurement_details['rooms']),
                'interior_items': len(measurement_details['interior_items']),
                'exterior_items': len(measurement_details['exterior_items']),
                'special_jobs': len(measurement_details['special_jobs'])
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate comprehensive quote error: {str(e)}')
        current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
        return jsonify({'error': 'Failed to generate quote'}), 500
















