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
    """Send quote email to client with enhanced error handling and PDF attachment logging"""
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

        # 📊 LOG: Starting email process
        current_app.logger.info(f"📧 Starting email process for project {project_id} to {client_email}")

        # Check PDF availability first
        quote_pdf_path = project.quote_pdf_path
        pdf_status = {
            'path_exists': bool(quote_pdf_path),
            'file_exists': False,
            'file_size': 0,
            'path': quote_pdf_path
        }
        
        if quote_pdf_path:
            if os.path.exists(quote_pdf_path):
                pdf_status['file_exists'] = True
                pdf_status['file_size'] = os.path.getsize(quote_pdf_path)
                current_app.logger.info(f"📎 PDF found: {quote_pdf_path} (Size: {pdf_status['file_size']} bytes)")
            else:
                current_app.logger.warning(f"⚠️ PDF path exists but file not found: {quote_pdf_path}")
        else:
            current_app.logger.warning(f"⚠️ No PDF path set for project {project_id}")

        # Check SMTP configuration
        smtp_server = current_app.config.get('SMTP_SERVER')
        smtp_port = current_app.config.get('SMTP_PORT', 587)
        smtp_user = current_app.config.get('SMTP_USER')
        smtp_password = current_app.config.get('SMTP_PASSWORD')
        
        # Handle development environment gracefully
        if not smtp_server or not smtp_user or not smtp_password:
            current_app.logger.warning('📧 SMTP not configured - simulating email send in development')
            
            return jsonify({
                'message': f'Quote prepared successfully (Email simulation - SMTP not configured)',
                'timestamp': datetime.utcnow().isoformat(),
                'development_mode': True,
                'pdf_status': pdf_status,
                'email_details': {
                    'to': client_email,
                    'subject': f'Quote for Project: {project_name}',
                    'total_cost': total_cost,
                    'quote_id': quote_id
                }
            })

        # Production email sending with PDF attachment
        try:
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            from email.mime.base import MIMEBase
            from email import encoders
            import smtplib

            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = client_email
            msg['Subject'] = f'Comprehensive Quote for Project: {project_name}'

            # Enhanced email body
            body = f"""
Dear {data.get('client_name', 'Valued Client')},

Thank you for choosing {user.company.name} for your painting project "{project_name}".

We have prepared a comprehensive quote that includes:
✓ Detailed room-by-room measurements
✓ Complete specifications for all work
✓ Transparent pricing breakdown
✓ Professional treatment recommendations

QUOTE SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: {project_name}
Quote ID: {quote_id}
Total Cost: £{total_cost:.2f}
Valid Until: {(datetime.utcnow() + timedelta(days=30)).strftime('%B %d, %Y')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The attached comprehensive quote includes:
- Complete room measurements with wall and ceiling details
- Interior and exterior work specifications
- Special job requirements and process steps
- Terms and conditions
- Contact information for any questions

Next Steps:
1. Review the detailed quote and specifications
2. Contact us with any questions or modifications
3. We're ready to schedule the work at your convenience

We look forward to transforming your space with professional quality painting!

Best regards,
{user.company.name}
Phone: {user.company.phone or 'Contact via email'}
Email: {user.company.email or smtp_user}
{f'Website: {user.company.website}' if user.company.website else ''}

---
This comprehensive quote was generated with complete project specifications.
All measurements, materials, and labor costs are included unless otherwise noted.
"""

            msg.attach(MIMEText(body, 'plain'))

            # 📎 LOG: Attempting PDF attachment
            pdf_attachment_result = {
                'attempted': False,
                'successful': False,
                'error': None,
                'filename': None,
                'size_bytes': 0
            }

            if quote_pdf_path and os.path.exists(quote_pdf_path):
                pdf_attachment_result['attempted'] = True
                current_app.logger.info(f"📎 Attempting to attach PDF: {quote_pdf_path}")
                
                try:
                    with open(quote_pdf_path, "rb") as attachment:
                        pdf_data = attachment.read()
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(pdf_data)
                    
                    encoders.encode_base64(part)
                    filename = f"comprehensive_quote_{quote_id}.pdf"
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename="{filename}"',
                    )
                    msg.attach(part)
                    
                    pdf_attachment_result['successful'] = True
                    pdf_attachment_result['filename'] = filename
                    pdf_attachment_result['size_bytes'] = len(pdf_data)
                    
                    current_app.logger.info(f"✅ PDF attached successfully: {filename} ({len(pdf_data)} bytes)")
                    
                except Exception as e:
                    pdf_attachment_result['error'] = str(e)
                    current_app.logger.error(f"❌ Failed to attach PDF: {e}")
            else:
                current_app.logger.warning(f"⚠️ PDF attachment skipped - file not available")
                pdf_attachment_result['error'] = "PDF file not found or path not set"

            # 📧 LOG: Sending email
            current_app.logger.info(f"📤 Sending email to {client_email} with PDF attachment: {pdf_attachment_result['successful']}")
            
            # Send email with timeout and retry logic
            with smtplib.SMTP(smtp_server, smtp_port, timeout=30) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

            # 📧 LOG: Email sent successfully
            current_app.logger.info(f"✅ Email sent successfully to {client_email}")
            current_app.logger.info(f"📎 PDF Attachment Summary: {pdf_attachment_result}")

            return jsonify({
                'message': f'Comprehensive quote emailed successfully to {client_email}',
                'timestamp': datetime.utcnow().isoformat(),
                'email_details': {
                    'to': client_email,
                    'subject': f'Comprehensive Quote for Project: {project_name}',
                    'total_cost': total_cost,
                    'quote_id': quote_id,
                    'pdf_attached': pdf_attachment_result['successful'],
                    'pdf_filename': pdf_attachment_result['filename'],
                    'pdf_size_bytes': pdf_attachment_result['size_bytes']
                },
                'pdf_status': pdf_status,
                'pdf_attachment_result': pdf_attachment_result
            })

        except smtplib.SMTPAuthenticationError:
            current_app.logger.error('❌ SMTP Authentication failed - check email credentials')
            return jsonify({
                'error': 'Email authentication failed',
                'details': 'Please check email server configuration'
            }), 500
            
        except smtplib.SMTPConnectError:
            current_app.logger.error('❌ SMTP Connection failed - check server settings')
            return jsonify({
                'error': 'Email server connection failed',
                'details': 'Please check SMTP server configuration'
            }), 500
            
        except Exception as e:
            current_app.logger.error(f'❌ Email sending failed: {str(e)}')
            return jsonify({
                'error': 'Failed to send email',
                'details': 'Please contact support if this persists'
            }), 500

    except Exception as e:
        current_app.logger.error(f'❌ Email quote error: {str(e)}')
        current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
        return jsonify({
            'error': 'Failed to process email request',
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


@projects_bp.route('/<int:project_id>/quote', methods=['POST'])
@jwt_required()
def generate_comprehensive_quote_total_wall_area(project_id):
    """Generate a comprehensive quote with total wall area approach"""
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
        
        # Process measurement details from the request
        measurement_details = data.get('measurement_details', {})
        
        # Generate line items from total wall area approach
        line_items = []
        
        current_app.logger.info(f"🔄 Processing quote for project {project_id} with total wall area approach")
        
        # Process rooms with total wall area approach
        rooms_data = measurement_details.get('rooms', [])
        current_app.logger.info(f"🏠 Processing {len(rooms_data)} rooms with total wall area")
        
        for room_data in rooms_data:
            room_name = room_data.get('name', 'Unknown Room')
            walls_surface_m2 = float(room_data.get('walls_surface_m2', 0))
            area_m2 = float(room_data.get('area_m2', 0))
            
            current_app.logger.info(f"🔄 Processing room: {room_name} - Walls: {walls_surface_m2}m², Ceiling: {area_m2}m²")
            
            # Process wall treatments for total wall area
            wall_treatments = room_data.get('wall_treatments', {})
            if walls_surface_m2 > 0:
                if wall_treatments.get('sanding_filling') is True:
                    price = float(data.get('wall_sanding_price', 5.00))
                    line_items.append({
                        'description': f'{room_name} - Walls - Sanding & Filling',
                        'quantity': walls_surface_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': walls_surface_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'walls',
                        'treatment': 'sanding_filling'
                    })
                    current_app.logger.info(f"✅ Added wall one coat: {walls_surface_m2}m² × £{price}")
                
                if wall_treatments.get('two_coats') is True:
                    price = float(data.get('wall_two_coats_price', 9.50))
                    line_items.append({
                        'description': f'{room_name} - Walls - Painting (2 Coats)',
                        'quantity': walls_surface_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': walls_surface_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'walls',
                        'treatment': 'two_coats'
                    })
                    current_app.logger.info(f"✅ Added wall two coats: {walls_surface_m2}m² × £{price}")
            
            # Process ceiling treatments for ceiling area
            ceiling_treatments = room_data.get('ceiling_treatments', {})
            if area_m2 > 0:
                if ceiling_treatments.get('sanding_filling') is True:
                    price = float(data.get('ceiling_prep_price', 4.00))
                    line_items.append({
                        'description': f'{room_name} - Ceiling - Sanding & Filling',
                        'quantity': area_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': area_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'ceiling',
                        'treatment': 'sanding_filling'
                    })
                    current_app.logger.info(f"✅ Added ceiling sanding/filling: {area_m2}m² × £{price}")
                
                if ceiling_treatments.get('priming') is True:
                    price = float(data.get('ceiling_priming_price', 4.00))
                    line_items.append({
                        'description': f'{room_name} - Ceiling - Priming',
                        'quantity': area_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': area_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'ceiling',
                        'treatment': 'priming'
                    })
                    current_app.logger.info(f"✅ Added ceiling priming: {area_m2}m² × £{price}")
                
                if ceiling_treatments.get('one_coat') is True:
                    price = float(data.get('ceiling_one_coat_price', 5.50))
                    line_items.append({
                        'description': f'{room_name} - Ceiling - Painting (1 Coat)',
                        'quantity': area_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': area_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'ceiling',
                        'treatment': 'one_coat'
                    })
                    current_app.logger.info(f"✅ Added ceiling one coat: {area_m2}m² × £{price}")
                
                if ceiling_treatments.get('two_coats') is True:
                    price = float(data.get('ceiling_two_coats_price', 8.50))
                    line_items.append({
                        'description': f'{room_name} - Ceiling - Painting (2 Coats)',
                        'quantity': area_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': area_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'ceiling',
                        'treatment': 'two_coats'
                    })
                    current_app.logger.info(f"✅ Added ceiling two coats: {area_m2}m² × £{price}")
        
        # Process interior items (unchanged from original)
        interior_items_data = measurement_details.get('interior_items', {})
        current_app.logger.info(f"🏠 Processing interior items")
        
        for item_type, items in interior_items_data.items():
            if isinstance(items, list):
                for item_data in items:
                    quantity = float(item_data.get('quantity', 0))
                    unit_price = float(item_data.get('unit_price', 0))
                    
                    if quantity > 0 and unit_price > 0:
                        base_description = item_data.get('description', item_type.replace('_', ' ').title())
                        detailed_description = f"Interior - {base_description}"
                        
                        line_items.append({
                            'description': detailed_description,
                            'quantity': quantity,
                            'unit': 'piece',
                            'unit_price': unit_price,
                            'total': quantity * unit_price,
                            'category': 'interior',
                            'item_type': item_type,
                            'specifications': {
                                'type': item_type,
                                'location': item_data.get('location', ''),
                                'notes': item_data.get('notes', '')
                            }
                        })
                        
                        current_app.logger.info(f"✅ Added interior item: {detailed_description}, qty: {quantity}")
        
        # Process exterior items (unchanged from original)
        exterior_items_data = measurement_details.get('exterior_items', {})
        current_app.logger.info(f"🌿 Processing exterior items")
        
        for item_type, items in exterior_items_data.items():
            if isinstance(items, list):
                for item_data in items:
                    quantity = float(item_data.get('quantity', 0))
                    unit_price = float(item_data.get('unit_price', 0))
                    
                    if quantity > 0 and unit_price > 0:
                        base_description = item_data.get('description', item_type.replace('_', ' ').title())
                        detailed_description = f"Exterior - {base_description}"
                        
                        line_items.append({
                            'description': detailed_description,
                            'quantity': quantity,
                            'unit': 'm' if item_type in ['fasciaBoards', 'rainPipe'] else 'piece',
                            'unit_price': unit_price,
                            'total': quantity * unit_price,
                            'category': 'exterior',
                            'item_type': item_type,
                            'specifications': {
                                'type': item_type,
                                'location': item_data.get('location', ''),
                                'notes': item_data.get('notes', '')
                            }
                        })
                        
                        current_app.logger.info(f"✅ Added exterior item: {detailed_description}, qty: {quantity}")
        
        # Process special jobs (unchanged from original)
        special_jobs_data = measurement_details.get('special_jobs', [])
        current_app.logger.info(f"🔧 Processing {len(special_jobs_data)} special jobs")
        
        for job_data in special_jobs_data:
            quantity = float(job_data.get('quantity', 0))
            unit_price = float(job_data.get('unit_price', 0))
            
            if quantity > 0 and unit_price > 0:
                job_name = job_data.get('name', 'Custom Work')
                job_description = job_data.get('description', '')
                
                detailed_description = f"Special Job - {job_name}"
                if job_description:
                    detailed_description += f" ({job_description})"
                
                line_items.append({
                    'description': detailed_description,
                    'quantity': quantity,
                    'unit': job_data.get('unit', 'job'),
                    'unit_price': unit_price,
                    'total': quantity * unit_price,
                    'category': 'special',
                    'specifications': {
                        'job_type': job_data.get('type', 'custom'),
                        'name': job_name,
                        'description': job_description,
                        'notes': job_data.get('notes', '')
                    }
                })
                
                current_app.logger.info(f"✅ Added special job: {job_name}, qty: {quantity}")
        
        # Add cleanup fee
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
        
        # Create quote
        quote = Quote(
            quote_number=Quote.generate_quote_number(),
            title=data.get('title', f"Total Wall Area Paint Quote - {project.name}"),
            description=data.get('description', f"Detailed painting quote for {project.name} with total wall area approach"),
            subtotal=round(subtotal, 2),
            vat_amount=round(vat_amount, 2),
            total_amount=round(total_amount, 2),
            line_items=line_items,
            project_id=project_id,
            valid_until=datetime.utcnow() + timedelta(days=int(data.get('valid_days', 30))),
            measurement_details=measurement_details
        )
        
        db.session.add(quote)
        db.session.flush()
        
        # Generate PDF
        from services.quote_generator import QuoteGenerator
        quote_generator = QuoteGenerator()
        
        output_dir = os.path.join(
            current_app.config.get('RESULTS_FOLDER', 'static/generated'),
            str(user.company_id),
            str(project_id)
        )
        
        try:
            pdf_path = quote_generator.generate_enhanced_quote_pdf(
                quote=quote,
                project=project,
                company=user.company,
                output_dir=output_dir
            )
            current_app.logger.info(f"✅ PDF generated successfully: {pdf_path}")
        except Exception as pdf_error:
            current_app.logger.error(f"❌ PDF generation failed: {str(pdf_error)}")
            pdf_path = None
        
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
            'generated_at': datetime.utcnow().isoformat(),
            'pdf_generated': pdf_path is not None,
            'approach': 'total_wall_area'
        }
        
        if project.status in ['draft', 'ready']:
            project.status = 'quoted'
        
        db.session.commit()
        
        current_app.logger.info(f"🎉 Total wall area quote generation completed successfully")
        
        return jsonify({
            'message': 'Quote generated successfully with total wall area approach',
            'quote': quote.to_dict(include_project=True, include_company=True),
            'quote_id': quote.id,
            'pdf_path': pdf_path,
            'pdf_generated': pdf_path is not None,
            'approach': 'total_wall_area'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate total wall area quote error: {str(e)}')
        current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
        return jsonify({'error': 'Failed to generate quote'}), 500




