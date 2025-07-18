# routes/clients.py
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from models import db
from models.user import User
from models.client import Client

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/', methods=['GET'])
@jwt_required()
def get_clients():
    """Get all clients for the user's company"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        # Get pagination and search parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        search = request.args.get('search', '')
        
        # Build query
        query = Client.query.filter_by(company_id=user.company_id)
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Client.company_name.ilike(search_pattern),
                    Client.contact_name.ilike(search_pattern),
                    Client.email.ilike(search_pattern)
                )
            )
        
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

@clients_bp.route('/', methods=['POST'])
@jwt_required()
def create_client():
    """Create a new client"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        if not data.get('company_name'):
            return jsonify({'error': 'Company name is required'}), 400
        
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        # Check for duplicate email within company
        existing_client = Client.query.filter_by(
            company_id=user.company_id,
            email=data['email']
        ).first()
        
        if existing_client:
            return jsonify({'error': 'Client with this email already exists'}), 400
        
        # Create client
        client = Client(
            company_name=data['company_name'],
            contact_name=data.get('contact_name', ''),
            email=data['email'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            postcode=data.get('postcode', ''),
            city=data.get('city', ''),
            btw_number=data.get('btw_number', ''),
            kvk_number=data.get('kvk_number', ''),
            iban=data.get('iban', ''),
            website=data.get('website', ''),
            company_id=user.company_id,
            created_by=user.id
        )
        
        db.session.add(client)
        db.session.commit()
        
        return jsonify({
            'message': 'Client created successfully',
            'client': client.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create client error: {e}')
        return jsonify({'error': 'Failed to create client'}), 500

@clients_bp.route('/<int:client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    """Get a specific client"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        client = Client.query.filter_by(
            id=client_id,
            company_id=user.company_id
        ).first()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        return jsonify({
            'client': client.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get client error: {e}')
        return jsonify({'error': 'Failed to get client'}), 500

@clients_bp.route('/<int:client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Update a client"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        client = Client.query.filter_by(
            id=client_id,
            company_id=user.company_id
        ).first()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'company_name', 'contact_name', 'email', 'phone',
            'address', 'postcode', 'city', 'btw_number',
            'kvk_number', 'iban', 'website'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(client, field, data[field])
        
        client.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Client updated successfully',
            'client': client.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update client error: {e}')
        return jsonify({'error': 'Failed to update client'}), 500