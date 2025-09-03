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
            
            # ✅ FIXED: Only require email, not company_name
            if client_data and client_data.get('email'):
                # Check if client already exists
                existing_client = Client.query.filter_by(
                    company_id=user.company_id,
                    email=client_data['email']
                ).first()
                
                if existing_client:
                    client = existing_client
                    current_app.logger.info(f'Found existing client: {existing_client.id}')
                else:
                    # ✅ Create new client with proper default handling
                    client = Client(
                        company_name=client_data.get('company_name', ''),  # Default to empty string
                        contact_name=client_data.get('contact_name', ''),
                        email=client_data['email'],  # Required field
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
                    db.session.flush()  # Get ID without committing yet
                    current_app.logger.info(f'Created new client: {client.id}')
        
        # Update project with client information
        if client:
            project.client_id = client.id
            project.client_name = client.company_name or client.email  # Use email as fallback
            project.client_email = client.email
            project.client_phone = client.phone
            project.client_address = client.address
        else:
            # Manual client entry without creating a client record
            project.client_id = None  # Clear client_id
            project.client_name = data.get('client_name', '')
            project.client_email = data.get('client_email', '')
            project.client_phone = data.get('client_phone', '')
            project.client_address = data.get('client_address', '')
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        # ✅ Return client_id for frontend to update its state
        return jsonify({
            'message': 'Client information updated successfully',
            'project': project.to_dict(),
            'client_id': client.id if client else None
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update project client error: {str(e)}\n{traceback.format_exc()}')
        return jsonify({'error': f'Failed to update client information: {str(e)}'}), 500


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


# @projects_bp.route('/<int:project_id>/email-quote', methods=['POST'])
# @jwt_required()
# def email_quote(project_id):
#     """Send quote email to client with enhanced error handling and PDF attachment logging"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = db.session.get(User, int(current_user_id))
        
#         if not user or not user.company:
#             return jsonify({'error': 'User or company not found'}), 400

#         data = request.get_json()
#         if not data:
#             return jsonify({'error': 'No data provided'}), 400
            
#         # Validate required fields
#         required_fields = ['client_email', 'project_name', 'total_cost']
#         missing_fields = [field for field in required_fields if not data.get(field)]
#         if missing_fields:
#             return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

#         project = Project.query.filter_by(
#             id=project_id,
#             company_id=user.company_id
#         ).first()
        
#         if not project:
#             return jsonify({'error': 'Project not found'}), 404

#         client_email = data['client_email']
#         project_name = data['project_name']
#         total_cost = data['total_cost']
#         quote_id = data.get('quote_id', 'N/A')
#         client_name = data.get('client_name', 'Valued Client')

#         # Enhanced logging
#         current_app.logger.info(f"📧 Starting email process for project {project_id} to {client_email}")

#         # Check SMTP configuration
#         smtp_server = current_app.config.get('MAIL_SERVER')
#         smtp_port = current_app.config.get('MAIL_PORT', 587)
#         smtp_user = current_app.config.get('MAIL_USERNAME')
#         smtp_password = current_app.config.get('MAIL_PASSWORD')
        
#         current_app.logger.info(f"📧 SMTP Config - Server: {smtp_server}, Port: {smtp_port}, User: {smtp_user[:5]}...{smtp_user[-5:] if smtp_user else 'None'}")
        
#         # Check PDF availability
#         quote_pdf_path = project.quote_pdf_path
#         pdf_status = {
#             'path_exists': bool(quote_pdf_path),
#             'file_exists': False,
#             'file_size': 0,
#             'path': quote_pdf_path
#         }
        
#         if quote_pdf_path and os.path.exists(quote_pdf_path):
#             pdf_status['file_exists'] = True
#             pdf_status['file_size'] = os.path.getsize(quote_pdf_path)
#             current_app.logger.info(f"📎 PDF found: {quote_pdf_path} (Size: {pdf_status['file_size']} bytes)")
#         else:
#             current_app.logger.warning(f"⚠️ PDF not available for project {project_id}")

#         # Handle development/staging environment gracefully
#         if not all([smtp_server, smtp_user, smtp_password]):
#             current_app.logger.warning('📧 SMTP not fully configured - simulating email send')
            
#             return jsonify({
#                 'message': f'Quote email prepared successfully (SMTP not configured - simulation mode)',
#                 'timestamp': datetime.utcnow().isoformat(),
#                 'development_mode': True,
#                 'pdf_status': pdf_status,
#                 'email_details': {
#                     'to': client_email,
#                     'subject': f'Quote for Project: {project_name}',
#                     'total_cost': total_cost,
#                     'quote_id': quote_id,
#                     'client_name': client_name
#                 },
#                 'smtp_config': {
#                     'server_configured': bool(smtp_server),
#                     'user_configured': bool(smtp_user),
#                     'password_configured': bool(smtp_password)
#                 }
#             })

#         # Get frontend URL for signature link
#         frontend_url = current_app.config.get('FRONTEND_URL', 'https://paint-quote-pro.vercel.app')
        
#         # Use the enhanced email service
#         try:
#             from services.email_service import send_quote_with_signature_link_frontend
            
#             # Get or create quote object for email
#             from models.quote import Quote
#             quote_obj = None
            
#             if quote_id and quote_id != 'N/A':
#                 quote_obj = Quote.query.filter_by(id=quote_id, project_id=project_id).first()
            
#             if not quote_obj:
#                 # Create a temporary quote-like object for email
#                 class TempQuote:
#                     def __init__(self, quote_id, project_name, total_cost):
#                         self.id = quote_id
#                         self.quote_number = quote_id
#                         self.total_amount = float(total_cost)
#                         self.valid_until = datetime.utcnow() + timedelta(days=30)
#                         self.project = project
                
#                 quote_obj = TempQuote(quote_id, project_name, total_cost)
            
#             # Send enhanced email with signature link
#             send_quote_with_signature_link_frontend(
#                 client_email=client_email,
#                 client_name=client_name or "Valued Client",
#                 quote=quote_obj,
#                 company=user.company,
#                 frontend_url=frontend_url,
#                 pdf_path=quote_pdf_path
#             )
            
#             current_app.logger.info(f"✅ Email sent successfully to {client_email}")
            
#             return jsonify({
#                 'message': f'Quote email sent successfully to {client_email}',
#                 'timestamp': datetime.utcnow().isoformat(),
#                 'email_details': {
#                     'to': client_email,
#                     'subject': f'Quote #{quote_id} - {user.company.name}',
#                     'total_cost': total_cost,
#                     'quote_id': quote_id,
#                     'client_name': client_name,
#                     'pdf_attached': pdf_status['file_exists'],
#                     'signature_url': f"{frontend_url}/quotes/{quote_id}/sign"
#                 },
#                 'pdf_status': pdf_status
#             })

#         except ImportError as e:
#             current_app.logger.error(f'❌ Email service import failed: {e}')
#             return jsonify({
#                 'error': 'Email service not available',
#                 'details': 'Email functionality is not properly configured'
#             }), 500
            
#         except Exception as email_error:
#             current_app.logger.error(f'❌ Email sending failed: {str(email_error)}')
            
#             # Provide specific error messages based on the exception
#             if 'authentication' in str(email_error).lower():
#                 return jsonify({
#                     'error': 'Email authentication failed',
#                     'details': 'Please check email server credentials'
#                 }), 500
#             elif 'connection' in str(email_error).lower():
#                 return jsonify({
#                     'error': 'Email server connection failed',
#                     'details': 'Please check SMTP server configuration'
#                 }), 500
#             else:
#                 return jsonify({
#                     'error': 'Failed to send email',
#                     'details': 'Please contact support if this persists'
#                 }), 500

#     except Exception as e:
#         current_app.logger.error(f'❌ Email quote error: {str(e)}')
#         current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
#         return jsonify({
#             'error': 'Failed to process email request',
#             'details': str(e)
#         }), 500


# @projects_bp.route('/<int:project_id>/email-quote', methods=['POST'])
# @jwt_required()
# def email_quote(project_id):
#     """Simple test email - temporarily replacing the main function"""
#     try:
#         current_user_id = get_jwt_identity()
#         user = db.session.get(User, int(current_user_id))
        
#         if not user or not user.company:
#             return jsonify({'error': 'User or company not found'}), 400

#         data = request.get_json()
#         if not data or not data.get('client_email'):
#             return jsonify({'error': 'client_email is required'}), 400

#         client_email = data['client_email']

#         # Check SMTP configuration
#         smtp_server = current_app.config.get('MAIL_SERVER')
#         smtp_user = current_app.config.get('MAIL_USERNAME')
#         smtp_password = current_app.config.get('MAIL_PASSWORD')
        
#         current_app.logger.info(f"📧 SMTP Config - Server: {smtp_server}, User: {smtp_user}")
        
#         if not all([smtp_server, smtp_user, smtp_password]):
#             return jsonify({'error': 'SMTP not configured'}), 500

#         # Use your existing email service
#         try:
#             from services.email_service import send_simple_test_email_debug
            
#             send_simple_test_email_debug(
#                 client_email=client_email,
#                 company=user.company
#             )
            
#             current_app.logger.info(f"✅ Test email sent successfully to {client_email}")
            
#             return jsonify({
#                 'message': f'Test email sent successfully to {client_email}',
#                 'timestamp': datetime.utcnow().isoformat()
#             })

#         except Exception as email_error:
#             current_app.logger.error(f'❌ Test email failed: {str(email_error)}')
#             return jsonify({
#                 'error': 'Failed to send test email',
#                 'details': str(email_error)
#             }), 500

#     except Exception as e:
#         current_app.logger.error(f'❌ Test email error: {str(e)}')
#         return jsonify({
#             'error': 'Failed to process test email request',
#             'details': str(e)
#         }), 500


@projects_bp.route('/<int:project_id>/email-quote', methods=['POST'])
@jwt_required()
def email_quote(project_id):
    """Send quote email to client with enhanced error handling"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 400

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        required_fields = ['client_email', 'project_name', 'total_cost']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

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
        client_name = data.get('client_name', 'Valued Client')

        # Enhanced logging
        current_app.logger.info(f"📧 Starting email process for project {project_id} to {client_email}")

        # Check SMTP configuration
        smtp_server = current_app.config.get('MAIL_SERVER')
        smtp_port = current_app.config.get('MAIL_PORT', 587)
        smtp_user = current_app.config.get('MAIL_USERNAME')
        smtp_password = current_app.config.get('MAIL_PASSWORD')
        
        current_app.logger.info(f"📧 SMTP Config - Server: {smtp_server}, Port: {smtp_port}, User: {smtp_user[:5]}...{smtp_user[-5:] if smtp_user else 'None'}")
        
        # Check PDF availability
        quote_pdf_path = project.quote_pdf_path
        pdf_status = {
            'path_exists': bool(quote_pdf_path),
            'file_exists': False,
            'file_size': 0,
            'path': quote_pdf_path
        }
        
        if quote_pdf_path and os.path.exists(quote_pdf_path):
            pdf_status['file_exists'] = True
            pdf_status['file_size'] = os.path.getsize(quote_pdf_path)
            current_app.logger.info(f"📎 PDF found: {quote_pdf_path} (Size: {pdf_status['file_size']} bytes)")
        else:
            current_app.logger.warning(f"⚠️ PDF not available for project {project_id}")

        # Handle development/staging environment gracefully
        if not all([smtp_server, smtp_user, smtp_password]):
            current_app.logger.warning('📧 SMTP not fully configured - simulating email send')
            
            return jsonify({
                'message': f'Quote email prepared successfully (SMTP not configured - simulation mode)',
                'timestamp': datetime.utcnow().isoformat(),
                'development_mode': True,
                'pdf_status': pdf_status,
                'email_details': {
                    'to': client_email,
                    'subject': f'Quote for Project: {project_name}',
                    'total_cost': total_cost,
                    'quote_id': quote_id,
                    'client_name': client_name
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
            
            # Get or create quote object for email
            from models.quote import Quote
            quote_obj = None
            
            if quote_id and quote_id != 'N/A':
                quote_obj = Quote.query.filter_by(id=quote_id, project_id=project_id).first()
            
            if not quote_obj:
                # Create a temporary quote-like object for email
                class TempQuote:
                    def __init__(self, quote_id, project_name, total_cost):
                        self.id = quote_id
                        self.quote_number = quote_id
                        self.total_amount = float(total_cost)
                        self.valid_until = datetime.utcnow() + timedelta(days=30)
                        self.project = project
                
                quote_obj = TempQuote(quote_id, project_name, total_cost)
            
            # Send enhanced email with signature link
            send_quote_with_signature_link_frontend(
                client_email=client_email,
                client_name=client_name or "Valued Client",
                quote=quote_obj,
                company=user.company,
                frontend_url=frontend_url,
                pdf_path=quote_pdf_path
            )
            
            current_app.logger.info(f"✅ Email sent successfully to {client_email}")
            
            return jsonify({
                'message': f'Quote email sent successfully to {client_email}',
                'timestamp': datetime.utcnow().isoformat(),
                'email_details': {
                    'to': client_email,
                    'subject': f'Quote #{quote_id} - {user.company.name}',
                    'total_cost': total_cost,
                    'quote_id': quote_id,
                    'client_name': client_name,
                    'pdf_attached': pdf_status['file_exists'],
                    'signature_url': f"{frontend_url}/quotes/{quote_id}/sign"
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
            if 'authentication' in str(email_error).lower():
                return jsonify({
                    'error': 'Email authentication failed',
                    'details': 'Please check email server credentials'
                }), 500
            elif 'connection' in str(email_error).lower():
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
    """Generate a comprehensive quote with total wall area approach - FIXED PRICING"""
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
        current_app.logger.info(f"📋 Received request data keys: {list(data.keys())}")
        
        # 🔧 FIXED: Handle different pricing data formats
        def get_price(key, default_value):
            """Safely extract price from various data formats"""
            try:
                value = data.get(key, default_value)
                
                # If it's already a number, return it
                if isinstance(value, (int, float)):
                    return float(value)
                
                # If it's a string, convert to float
                if isinstance(value, str):
                    return float(value)
                
                # If it's a dict, look for common price fields
                if isinstance(value, dict):
                    for price_key in ['price', 'value', 'amount', 'cost']:
                        if price_key in value:
                            return float(value[price_key])
                        


                    
                    
                    
                    
                    pricing_options = ['one_coat', 'single', 'basic', 'standard', 'default']
            
                    for option in pricing_options:
                        if option in value and isinstance(value[option], dict):
                            if 'price' in value[option]:
                                current_app.logger.info(f"💰 Using {option} price for {key}: {value[option]['price']}")
                                return float(value[option]['price'])
            
                    # If no standard options found, use the first available price
                    for nested_key, nested_value in value.items():
                        if isinstance(nested_value, dict) and 'price' in nested_value:
                            current_app.logger.info(f"💰 Using {nested_key} price for {key}: {nested_value['price']}")
                            return float(nested_value['price'])
                        elif isinstance(nested_value, (int, float)):
                            current_app.logger.info(f"💰 Using {nested_key} price for {key}: {nested_value}")
                            return float(nested_value)






                    # If no price field found, use the default
                    current_app.logger.warning(f"⚠️ Price {key} is dict but no price field found: {value}")
                    return float(default_value)
                
                # If it's None or other type, use default
                current_app.logger.warning(f"⚠️ Price {key} has unexpected type {type(value)}: {value}")
                return float(default_value)
                
            except (ValueError, TypeError) as e:
                current_app.logger.error(f"❌ Error parsing price {key}: {e}")
                return float(default_value)
        
        # Extract pricing with safe handling
        pricing = {
            'wall_sanding_price': get_price('wall_sanding_price', 5.00),
            'wall_priming_price': get_price('wall_priming_price', 4.50),
            'wall_one_coat_price': get_price('wall_one_coat_price', 6.00),
            'wall_two_coats_price': get_price('wall_two_coats_price', 9.50),
            'ceiling_prep_price': get_price('ceiling_prep_price', 4.00),
            'ceiling_priming_price': get_price('ceiling_priming_price', 5.50),
            'ceiling_one_coat_price': get_price('ceiling_one_coat_price', 5.50),
            'ceiling_two_coats_price': get_price('ceiling_two_coats_price', 8.50),
            'cleanup_fee': get_price('cleanup_fee', 150.00)
        }
        
        current_app.logger.info(f"💰 Extracted pricing: {pricing}")
        
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
            
            # Use correct field names from frontend
            walls_surface_m2 = float(room_data.get('walls_surface_m2', 0) or room_data.get('total_wall_area', 0))
            area_m2 = float(room_data.get('area_m2', 0) or room_data.get('total_ceiling_area', 0))
            
            current_app.logger.info(f"🔄 Processing room: {room_name} - Walls: {walls_surface_m2}m², Ceiling: {area_m2}m²")
            
            # Skip if no valid areas
            if walls_surface_m2 <= 0 and area_m2 <= 0:
                current_app.logger.warning(f"⚠️ Skipping room {room_name} - no valid areas found")
                continue
            
            # Process wall treatments for total wall area
            wall_treatments = room_data.get('wall_treatments', {})
            if walls_surface_m2 > 0:
                if wall_treatments.get('sanding_filling') is True:
                    price = pricing['wall_sanding_price']
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
                    current_app.logger.info(f"✅ Added wall sanding: {walls_surface_m2}m² × £{price}")
                
                if wall_treatments.get('priming') is True:
                    price = pricing['wall_priming_price']
                    line_items.append({
                        'description': f'{room_name} - Walls - Priming',
                        'quantity': walls_surface_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': walls_surface_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'walls',
                        'treatment': 'priming'
                    })
                    current_app.logger.info(f"✅ Added wall priming: {walls_surface_m2}m² × £{price}")
                
                if wall_treatments.get('one_coat') is True:
                    price = pricing['wall_one_coat_price']
                    line_items.append({
                        'description': f'{room_name} - Walls - Painting (1 Coat)',
                        'quantity': walls_surface_m2,
                        'unit': 'm²',
                        'unit_price': price,
                        'total': walls_surface_m2 * price,
                        'category': 'room_work',
                        'room': room_name,
                        'surface': 'walls',
                        'treatment': 'one_coat'
                    })
                    current_app.logger.info(f"✅ Added wall one coat: {walls_surface_m2}m² × £{price}")
                
                if wall_treatments.get('two_coats') is True:
                    price = pricing['wall_two_coats_price']
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
                    price = pricing['ceiling_prep_price']
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
                    price = pricing['ceiling_priming_price']
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
                    price = pricing['ceiling_one_coat_price']
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
                    price = pricing['ceiling_two_coats_price']
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
        
        # Process interior items with safe pricing
        interior_items_data = measurement_details.get('interior_items', {})
        current_app.logger.info(f"🏠 Processing interior items: {len(interior_items_data)} types")
        
        for item_type, items in interior_items_data.items():
            if isinstance(items, list) and items:
                for item_data in items:
                    try:
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
                    except (ValueError, TypeError) as e:
                        current_app.logger.error(f"❌ Error processing interior item {item_type}: {e}")
                        continue
        
        # Process exterior items with safe pricing
        exterior_items_data = measurement_details.get('exterior_items', {})
        current_app.logger.info(f"🌿 Processing exterior items: {len(exterior_items_data)} types")
        
        for item_type, items in exterior_items_data.items():
            if isinstance(items, list) and items:
                for item_data in items:
                    try:
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
                    except (ValueError, TypeError) as e:
                        current_app.logger.error(f"❌ Error processing exterior item {item_type}: {e}")
                        continue
        
        # Process special jobs with safe pricing
        special_jobs_data = measurement_details.get('special_jobs', [])
        current_app.logger.info(f"🔧 Processing {len(special_jobs_data)} special jobs")
        
        for job_data in special_jobs_data:
            try:
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
            except (ValueError, TypeError) as e:
                current_app.logger.error(f"❌ Error processing special job: {e}")
                continue
        
        # Add cleanup fee
        # if line_items:
        #     cleanup_fee = pricing['cleanup_fee']
        #     line_items.append({
        #         'description': 'Site Cleanup & Preparation',
        #         'quantity': 1,
        #         'unit': 'job',
        #         'unit_price': cleanup_fee,
        #         'total': cleanup_fee,
        #         'category': 'general'
        #     })
        #     current_app.logger.info(f"✅ Added cleanup fee: £{cleanup_fee}")
        
        if not line_items:
            current_app.logger.error("❌ No line items generated")
            return jsonify({'error': 'No work items found to generate quote from'}), 400
        
        # Calculate totals
        subtotal = sum(float(item['total']) for item in line_items)
        vat_rate = float(getattr(user.company, 'vat_rate', 0.20))
        vat_amount = subtotal * vat_rate
        total_amount = subtotal + vat_amount
        
        current_app.logger.info(f"💰 Quote totals: Subtotal £{subtotal:.2f}, VAT £{vat_amount:.2f}, Total £{total_amount:.2f}")
        
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
            'approach': 'total_wall_area',
            'is_signed': False,
            'signed_at': None
        }
        
        if project.status in ['draft', 'ready']:
            project.status = 'quoted'
        
        db.session.commit()
        
        current_app.logger.info(f"🎉 Total wall area quote generation completed successfully with {len(line_items)} line items")
        
        return jsonify({
            'message': 'Quote generated successfully with total wall area approach',
            'quote': quote.to_dict(include_project=True, include_company=True),
            'quote_id': quote.id,
            'pdf_path': pdf_path,
            'pdf_generated': pdf_path is not None,
            'approach': 'total_wall_area',
            'line_items_generated': len(line_items),
            'pricing_used': pricing
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate total wall area quote error: {str(e)}')
        current_app.logger.error(f'Full traceback: {traceback.format_exc()}')
        return jsonify({'error': f'Failed to generate quote: {str(e)}'}), 500


@projects_bp.route('/clients/proj', methods=['GET'])
@jwt_required()
def get_clients():
    """Get all clients for the user's company"""

    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"Current user ID from JWT: {current_user_id}")
        
        user = db.session.get(User, int(current_user_id))        
        
        if not user or not user.company:
            current_app.logger.warning("User or company not found")
            
            return jsonify({'error': 'User or company not found'}), 404
        
        current_app.logger.info(f"User company: {user.company.name if user.company else 'None'}")
        current_app.logger.info(f"Company ID: {user.company_id}")
        
        # Get pagination and search parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        search = request.args.get('search', '')

        current_app.logger.info(f"Query params - Page: {page}, Per page: {per_page}, Search: '{search}'")
        
        
        # Build query
        query = Client.query.filter_by(company_id=user.company_id)
        
        current_app.logger.info(f"Base query built for company_id: {user.company_id}")
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Client.company_name.ilike(search_pattern),
                    Client.contact_name.ilike(search_pattern),
                    Client.email.ilike(search_pattern)
                )
            )
            current_app.logger.info(f"Applied search filter: {search_pattern}")
        
        
        # Order by most recent
        query = query.order_by(Client.updated_at.desc())
        
        # Paginate
        clients_paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'clients': [client.to_dict() for client in clients_paginated.items],
            'pagination': {
                'page': page,
                'pages': clients_paginated.pages,
                'per_page': per_page,
                'total': clients_paginated.total,
                'has_next': clients_paginated.has_next,
                'has_prev': clients_paginated.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get clients error: {e}')
        return jsonify({'error': 'Failed to get clients'}), 500














