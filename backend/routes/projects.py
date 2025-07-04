import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
import json

from models import db
from models.user import User
from models.project import Project
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
        # Use new Session.get method instead of deprecated Query.get
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        # Get pagination parameters from URL query params (not JSON body)
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 100)
        status_filter = request.args.get('status')
        search = request.args.get('search')
        
        # Build query
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
        
        # Order by most recent
        query = query.order_by(Project.created_at.desc())
        
        # Paginate
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
        current_app.logger.error(f'Get projects error: {e}')
        return jsonify({'error': 'Failed to get projects'}), 500


@projects_bp.route('', methods=['POST'])    
@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project"""
    try:
        current_user_id = get_jwt_identity()
        # FIX 1: Use consistent user fetching method
        user = db.session.get(User, int(current_user_id))
        
        if not user:
            current_app.logger.error(f'User not found: {current_user_id}')
            return jsonify({'error': 'User not found'}), 404
            
        if not user.company:
            current_app.logger.error(f'Company not found for user: {current_user_id}')
            return jsonify({'error': 'Company not found'}), 404
        
        # Check subscription limits
        subscription = user.company.subscription
        if subscription:
            try:
                max_projects = subscription.get_max_projects() if hasattr(subscription, 'get_max_projects') else getattr(subscription, 'max_projects', 0)
                projects_used = getattr(subscription, 'projects_used_this_month', 0)
                
                if max_projects > 0 and projects_used >= max_projects:
                    return jsonify({
                        'error': 'Project limit reached for your subscription plan',
                        'current_plan': getattr(subscription, 'plan_name', 'unknown'),
                        'projects_used': projects_used,
                        'max_projects': max_projects
                    }), 403
            except Exception as sub_error:
                current_app.logger.warning(f'Subscription check error: {sub_error}')
                # Continue with project creation if subscription check fails
        
        # Get JSON data from request body
        data = request.get_json()
        if not data:
            current_app.logger.error('No JSON data provided')
            return jsonify({'error': 'No data provided'}), 400
        
        current_app.logger.info(f'Creating project with data: {data}')
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Project name is required'}), 400
        
        # FIX 2: Handle missing project_type field
        project_type = data.get('project_type', 'interior')
        property_type = data.get('property_type', 'residential')
        
        # FIX 3: Ensure all fields exist in your Project model
        try:
            # Create project with error handling for each field
            project = Project(
                name=data['name'],
                description=data.get('description', ''),
                client_name=data.get('client_name', ''),
                client_email=data.get('client_email', ''),
                client_phone=data.get('client_phone', ''),
                client_address=data.get('client_address', ''),
                property_type=property_type,
                company_id=user.company_id,
                created_by=user.id,
                status='draft'
            )
            
            # FIX 4: Only set project_type if the field exists in your model
            if hasattr(Project, 'project_type'):
                project.project_type = project_type
            
            current_app.logger.info(f'Project object created: {project.name}')
            
        except Exception as model_error:
            current_app.logger.error(f'Error creating project model: {model_error}')
            return jsonify({'error': f'Model creation error: {str(model_error)}'}), 400
        
        try:
            db.session.add(project)
            current_app.logger.info('Project added to session')
            
            # Update subscription usage
            if subscription:
                if hasattr(subscription, 'projects_used_this_month'):
                    subscription.projects_used_this_month = getattr(subscription, 'projects_used_this_month', 0) + 1
                    current_app.logger.info(f'Updated subscription usage: {subscription.projects_used_this_month}')
            
            db.session.commit()
            current_app.logger.info(f'Project created successfully with ID: {project.id}')
            
            # FIX 5: Ensure to_dict() method works properly
            try:
                project_dict = project.to_dict()
            except Exception as dict_error:
                current_app.logger.warning(f'Error converting project to dict: {dict_error}')
                # Fallback to basic dict
                project_dict = {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'client_name': project.client_name,
                    'client_email': project.client_email,
                    'client_phone': project.client_phone,
                    'client_address': project.client_address,
                    'property_type': project.property_type,
                    'status': project.status,
                    'created_at': project.created_at.isoformat() if hasattr(project, 'created_at') and project.created_at else None,
                    'company_id': project.company_id,
                    'created_by': project.created_by
                }
                
                # Add project_type if it exists
                if hasattr(project, 'project_type'):
                    project_dict['project_type'] = project.project_type
            
            return jsonify({
                'message': 'Project created successfully',
                'project': project_dict
            }), 201
            
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f'Database error: {db_error}')
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create project error: {e}', exc_info=True)
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
        current_app.logger.error(f'Get project error: {e}')
        return jsonify({'error': 'Failed to get project'}), 500

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update a project"""
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
        
        # Update allowed fields
        updatable_fields = [
            'name', 'description', 'client_name', 'client_email',
            'client_phone', 'client_address', 'project_type', 'property_type'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(project, field, data[field])
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Project updated successfully',
            'project': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update project error: {e}')
        return jsonify({'error': 'Failed to update project'}), 500

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """Delete a project"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Delete associated files
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
            current_app.logger.warning(f'Error deleting project files: {e}')
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Project deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete project error: {e}')
        return jsonify({'error': 'Failed to delete project'}), 500

@projects_bp.route('/<int:project_id>/upload', methods=['POST'])
@jwt_required()
def upload_project_files(project_id):
    """Upload floor plan images for a project"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
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
                
                # Create unique filename
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                
                # Create project-specific directory
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
                
                # Add to project's uploaded images
                project.add_uploaded_image(file_path)
        
        return jsonify({
            'message': f'Successfully uploaded {len(uploaded_files)} files',
            'files': uploaded_files,
            'project': project.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Upload files error: {e}')
        return jsonify({'error': 'Failed to upload files'}), 500

@projects_bp.route('/<int:project_id>/analyze', methods=['POST'])
@jwt_required()
@require_active_subscription
def analyze_floor_plan(project_id):
    """Analyze uploaded floor plan using AI"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if not project.uploaded_images:
            return jsonify({'error': 'No images uploaded for analysis'}), 400
        
        # Update project status
        project.status = 'analyzing'
        db.session.commit()
        
        # Initialize floor plan analyzer
        analyzer = FloorPlanAnalyzer(
            openai_api_key=current_app.config['OPENAI_API_KEY']
        )
        
        # Create results directory
        results_dir = os.path.join(
            current_app.config['RESULTS_FOLDER'],
            str(user.company_id),
            str(project_id),
            f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        )
        os.makedirs(results_dir, exist_ok=True)
        
        # Analyze the first uploaded image (floor plan)
        floor_plan_path = project.uploaded_images[0]
        
        analysis_results = analyzer.process_floor_plan(
            image_path=floor_plan_path,
            results_dir=results_dir,
            analysis_id=f"project_{project_id}"
        )
        
        if analysis_results.get('status') == 'success':
            # Save analysis results to project
            project.set_analysis_results(analysis_results)
            
            # Save generated files paths
            generated_files = []
            for filename in os.listdir(results_dir):
                file_path = os.path.join(results_dir, filename)
                generated_files.append(file_path)
            
            project.generated_files = generated_files
            db.session.commit()
            
            return jsonify({
                'message': 'Floor plan analysis completed successfully',
                'analysis': analysis_results,
                'project': project.to_dict()
            })
        else:
            project.status = 'draft'
            db.session.commit()
            return jsonify({
                'error': 'Floor plan analysis failed',
                'details': analysis_results.get('message', 'Unknown error')
            }), 500
            
    except Exception as e:
        # Reset project status on error
        try:
            project.status = 'draft'
            db.session.commit()
        except:
            pass
            
        current_app.logger.error(f'Analyze floor plan error: {e}')
        return jsonify({'error': 'Floor plan analysis failed'}), 500

@projects_bp.route('/<int:project_id>/manual-measurements', methods=['POST'])
@jwt_required()
def save_manual_measurements(project_id):
    """Save manual measurements for a project"""
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
        
        # Validate measurements data structure
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid measurements data format'}), 400
        
        # Save manual measurements
        project.manual_measurements = data
        
        # Update status if this is the first data entry
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
        current_app.logger.error(f'Save manual measurements error: {e}')
        return jsonify({'error': 'Failed to save measurements'}), 500

@projects_bp.route('/<int:project_id>/files/<path:filename>', methods=['GET'])
@jwt_required()
def download_project_file(project_id, filename):
    """Download a project file"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Security check: ensure file belongs to this project
        file_found = False
        file_path = None
        
        # Check in uploaded images
        if project.uploaded_images:
            for image_path in project.uploaded_images:
                if os.path.basename(image_path) == filename:
                    file_path = image_path
                    file_found = True
                    break
        
        # Check in generated files
        if not file_found and project.generated_files:
            for gen_file_path in project.generated_files:
                if os.path.basename(gen_file_path) == filename:
                    file_path = gen_file_path
                    file_found = True
                    break
        
        # Check quote PDF
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
        current_app.logger.error(f'Download file error: {e}')
        return jsonify({'error': 'Failed to download file'}), 500

@projects_bp.route('/<int:project_id>/duplicate', methods=['POST'])
@jwt_required()
@require_active_subscription
def duplicate_project(project_id):
    """Create a duplicate of an existing project"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        original_project = Project.query.filter_by(
            id=project_id,
            company_id=user.company_id
        ).first()
        
        if not original_project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Check subscription limits
        subscription = user.company.subscription
        if not subscription.can_create_project():
            return jsonify({
                'error': 'Project limit reached for your subscription plan'
            }), 403
        
        data = request.get_json()
        new_name = data.get('name', f"{original_project.name} (Copy)")
        
        # Create duplicate project
        duplicate_project = Project(
            name=new_name,
            description=original_project.description,
            client_name=original_project.client_name,
            client_email=original_project.client_email,
            client_phone=original_project.client_phone,
            client_address=original_project.client_address,
            project_type=original_project.project_type,
            property_type=original_project.property_type,
            manual_measurements=original_project.manual_measurements,
            company_id=user.company_id,
            created_by=user.id,
            status='draft'  # Start as draft
        )
        
        db.session.add(duplicate_project)
        db.session.flush()  # Get the new project ID
        
        # Copy files if they exist
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
        
        # Update subscription usage
        subscription.projects_used_this_month += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project duplicated successfully',
            'project': duplicate_project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Duplicate project error: {e}')
        return jsonify({'error': 'Failed to duplicate project'}), 500
  

@projects_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_project_stats():
    """Get project statistics for the company"""
    try:
        current_user_id = get_jwt_identity()
        
        # FIX 1: Use db.session.get instead of deprecated User.query.get
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        # Get basic counts
        total_projects = Project.query.filter_by(company_id=user.company_id).count()
        
        draft_projects = Project.query.filter_by(
            company_id=user.company_id,
            status='draft'
        ).count()
        
        analyzing_projects = Project.query.filter_by(
            company_id=user.company_id,
            status='analyzing'
        ).count()
        
        # FIX 2: Add ready projects count (missing in your stats)
        ready_projects = Project.query.filter_by(
            company_id=user.company_id,
            status='ready'
        ).count()
        
        completed_projects = Project.query.filter_by(
            company_id=user.company_id,
            status='completed'
        ).count()
        
        # FIX 3: Safe revenue calculation with error handling
        total_revenue = 0.0
        try:
            completed_project_objects = Project.query.filter_by(
                company_id=user.company_id,
                status='completed'
            ).all()
            
            for project in completed_project_objects:
                # Handle multiple possible attribute names for quote total
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
                        # Skip invalid values
                        continue
        except Exception as e:
            current_app.logger.warning(f'Error calculating revenue: {e}')
            total_revenue = 0.0
        
        # FIX 4: Safe recent projects query
        recent_projects = []
        try:
            recent_projects_query = Project.query.filter_by(
                company_id=user.company_id
            ).order_by(Project.created_at.desc()).limit(5).all()
            
            recent_projects = [project.to_dict() for project in recent_projects_query]
        except Exception as e:
            current_app.logger.warning(f'Error getting recent projects: {e}')
            recent_projects = []
        
        # FIX 5: Safe subscription info handling
        subscription = user.company.subscription
        projects_this_month = 0
        project_limit = 0
        subscription_dict = None
        
        try:
            if subscription:
                projects_this_month = getattr(subscription, 'projects_used_this_month', 0)
                
                # Handle get_max_projects method safely
                if hasattr(subscription, 'get_max_projects'):
                    try:
                        project_limit = subscription.get_max_projects()
                    except Exception:
                        project_limit = getattr(subscription, 'max_projects', 0)
                else:
                    project_limit = getattr(subscription, 'max_projects', 0)
                
                # Safe subscription.to_dict() call
                if hasattr(subscription, 'to_dict'):
                    try:
                        subscription_dict = subscription.to_dict()
                    except Exception as e:
                        current_app.logger.warning(f'Error converting subscription to dict: {e}')
                        subscription_dict = {
                            'id': getattr(subscription, 'id', None),
                            'plan_name': getattr(subscription, 'plan_name', 'unknown'),
                            'status': getattr(subscription, 'status', 'unknown'),
                            'max_projects': project_limit,
                            'projects_used_this_month': projects_this_month
                        }
        except Exception as e:
            current_app.logger.warning(f'Error processing subscription: {e}')
        
        # FIX 6: Safe division for average project value
        avg_project_value = 0.0
        if completed_projects > 0 and total_revenue > 0:
            avg_project_value = total_revenue / completed_projects
        
        return jsonify({
            'stats': {
                'total_projects': total_projects,
                'draft_projects': draft_projects,
                'analyzing_projects': analyzing_projects,
                'ready_projects': ready_projects,  # Added this
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
        current_app.logger.error(f'Get project stats error: {e}')
        # Return basic empty stats instead of failing completely
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
