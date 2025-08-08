# models/quote.py (Enhanced with better room handling)
from datetime import datetime, timedelta
import uuid
from . import db

class QuoteSignature(db.Model):
    __tablename__ = 'quote_signatures'
    
    id = db.Column(db.Integer, primary_key=True)
    quote_id = db.Column(db.Integer, db.ForeignKey('quotes.id'), nullable=False)
    client_name = db.Column(db.String(255), nullable=False)
    client_email = db.Column(db.String(255), nullable=False)
    signature_data = db.Column(db.Text)  # Base64 encoded signature
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    signed_at = db.Column(db.DateTime, default=datetime.utcnow)
    verification_token = db.Column(db.String(255), unique=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # Relationships
    quote = db.relationship('Quote', back_populates='signatures')
    
    def to_dict(self):
        return {
            'id': self.id,
            'quote_id': self.quote_id,
            'client_name': self.client_name,
            'client_email': self.client_email,
            'signed_at': self.signed_at.isoformat() if self.signed_at else None,
            'is_verified': self.is_verified,
            'ip_address': self.ip_address
        }

class Quote(db.Model):
    __tablename__ = 'quotes'
    
    id = db.Column(db.Integer, primary_key=True)
    quote_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Quote details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Pricing
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    vat_amount = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    
    # Quote items breakdown
    line_items = db.Column(db.JSON, nullable=True)
    measurement_details = db.Column(db.JSON, nullable=True)
    
    # Status and dates
    status = db.Column(db.String(20), default='draft')
    valid_until = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=30))
    sent_at = db.Column(db.DateTime, nullable=True)
    accepted_at = db.Column(db.DateTime, nullable=True)
    
    # Digital Signature fields
    is_signed = db.Column(db.Boolean, default=False)
    signed_at = db.Column(db.DateTime, nullable=True)
    
    # File paths
    pdf_path = db.Column(db.String(500), nullable=True)
    signed_pdf_path = db.Column(db.String(500), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    project = db.relationship('Project', back_populates='quotes')
    signatures = db.relationship('QuoteSignature', back_populates='quote', lazy='dynamic')
    
    @staticmethod
    def generate_quote_number():
        """Generate a unique quote number"""
        return f"PQ{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_expired(self):
        """Check if the quote has expired"""
        return datetime.utcnow() > self.valid_until
    
    @property 
    def latest_signature(self):
        """Get the most recent signature"""
        return self.signatures.order_by(QuoteSignature.signed_at.desc()).first()
    
    def get_room_summary(self):
        """Get room work summary from line items and measurement details"""
        rooms_summary = {}
        
        # Process line items to find room work
        if self.line_items:
            for item in self.line_items:
                if item.get('category') == 'room_work' and item.get('room'):
                    room_name = item['room']
                    if room_name not in rooms_summary:
                        rooms_summary[room_name] = {
                            'wall_items': [],
                            'ceiling_items': [],
                            'wall_total': 0,
                            'ceiling_total': 0,
                            'room_total': 0,
                            'wall_area': 0,
                            'ceiling_area': 0
                        }
                    
                    if item.get('surface') == 'walls':
                        rooms_summary[room_name]['wall_items'].append(item)
                        rooms_summary[room_name]['wall_total'] += item.get('total', 0)
                        rooms_summary[room_name]['wall_area'] = max(
                            rooms_summary[room_name]['wall_area'], 
                            item.get('quantity', 0)
                        )
                    elif item.get('surface') == 'ceiling':
                        rooms_summary[room_name]['ceiling_items'].append(item)
                        rooms_summary[room_name]['ceiling_total'] += item.get('total', 0)
                        rooms_summary[room_name]['ceiling_area'] = max(
                            rooms_summary[room_name]['ceiling_area'], 
                            item.get('quantity', 0)
                        )
                    
                    rooms_summary[room_name]['room_total'] += item.get('total', 0)
        
        # Add measurement details if available
        if self.measurement_details and self.measurement_details.get('rooms'):
            for room_data in self.measurement_details['rooms']:
                room_name = room_data.get('name')
                if room_name in rooms_summary:
                    rooms_summary[room_name]['measurement_data'] = room_data
                    # Update areas from measurement data if larger
                    rooms_summary[room_name]['wall_area'] = max(
                        rooms_summary[room_name]['wall_area'],
                        float(room_data.get('total_wall_area', 0) or room_data.get('walls_surface_m2', 0))
                    )
                    rooms_summary[room_name]['ceiling_area'] = max(
                        rooms_summary[room_name]['ceiling_area'],
                        float(room_data.get('total_ceiling_area', 0) or room_data.get('area_m2', 0))
                    )
        
        return rooms_summary
    
    def get_cost_breakdown(self):
        """Get detailed cost breakdown by category"""
        breakdown = {
            'rooms': 0,
            'interior': 0,
            'exterior': 0,
            'special': 0
        }
        
        if self.line_items:
            for item in self.line_items:
                category = item.get('category', 'special')
                total = item.get('total', 0)
                
                if category == 'room_work':
                    breakdown['rooms'] += total
                elif category in breakdown:
                    breakdown[category] += total
                else:
                    breakdown['special'] += total
        
        return breakdown
    
    def get_work_summary(self):
        """Get comprehensive work summary for display"""
        summary = {
            'total_rooms': 0,
            'total_wall_area': 0,
            'total_ceiling_area': 0,
            'total_interior_items': 0,
            'total_exterior_items': 0,
            'total_special_jobs': 0,
            'cost_breakdown': self.get_cost_breakdown(),
            'rooms_data': self.get_room_summary()
        }
        
        # Count items by category
        if self.line_items:
            for item in self.line_items:
                category = item.get('category', 'general')
                if category == 'interior':
                    summary['total_interior_items'] += 1
                elif category == 'exterior':
                    summary['total_exterior_items'] += 1
                elif category == 'special':
                    summary['total_special_jobs'] += 1
        
        # Calculate room totals
        rooms_summary = summary['rooms_data']
        summary['total_rooms'] = len(rooms_summary)
        summary['total_wall_area'] = sum(room['wall_area'] for room in rooms_summary.values())
        summary['total_ceiling_area'] = sum(room['ceiling_area'] for room in rooms_summary.values())
        
        return summary
    
    def to_dict(self, include_project=True, include_company=True, include_summary=True):
        """Convert quote to dictionary with comprehensive information"""
        quote_dict = {
            'id': self.id,
            'quote_number': self.quote_number,
            'title': self.title,
            'description': self.description,
            'subtotal': float(self.subtotal),
            'vat_amount': float(self.vat_amount),
            'total_amount': float(self.total_amount),
            'line_items': self.line_items or [],
            'measurement_details': self.measurement_details or {},
            'status': self.status,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'is_expired': self.is_expired,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'is_signed': self.is_signed,
            'signed_at': self.signed_at.isoformat() if self.signed_at else None,
            'pdf_path': self.pdf_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'project_id': self.project_id
        }
        
        # Include work summary for better frontend handling
        if include_summary:
            quote_dict['work_summary'] = self.get_work_summary()
            quote_dict['organization_info'] = {
                'total_line_items': len(self.line_items) if self.line_items else 0,
                'room_based_items': len([item for item in (self.line_items or []) if item.get('category') == 'room_work']),
                'interior_items': len([item for item in (self.line_items or []) if item.get('category') == 'interior']),
                'exterior_items': len([item for item in (self.line_items or []) if item.get('category') == 'exterior']),
                'special_items': len([item for item in (self.line_items or []) if item.get('category') == 'special'])
            }
        
        # Include signature info if available
        latest_signature = self.latest_signature
        if latest_signature:
            quote_dict['signature_info'] = {
                'client_name': latest_signature.client_name,
                'client_email': latest_signature.client_email,
                'signed_at': latest_signature.signed_at.isoformat() if latest_signature.signed_at else None,
                'is_verified': latest_signature.is_verified
            }
        
        # Include project and client data
        if include_project and self.project:
            # Get client info safely
            try:
                client_info = self.project.get_client_info()
            except:
                # Fallback if get_client_info method doesn't exist
                client_info = {
                    'company_name': self.project.client_name,
                    'contact_name': self.project.client_name,
                    'email': self.project.client_email,
                    'phone': self.project.client_phone,
                    'address': self.project.client_address,
                    'btw_number': None,
                    'kvk_number': None,
                    'iban': None,
                    'website': None
                }
            
            quote_dict.update({
                'project': {
                    'id': self.project.id,
                    'name': self.project.name,
                    'description': self.project.description,
                    'project_type': self.project.project_type,
                    'property_type': self.project.property_type,
                    'property_address': self.project.property_address,
                    'status': self.project.status,
                    'created_at': self.project.created_at.isoformat() if self.project.created_at else None,
                },
                
                # Direct access fields for easy frontend use
                'project_name': self.project.name,
                'property_address': self.project.property_address,
                'project_type': self.project.project_type,
                'property_type': self.project.property_type,
                'client_company_name': client_info.get('company_name'),
                'client_contact_name': client_info.get('contact_name'),
                'client_email': client_info.get('email'),
                'client_phone': client_info.get('phone'),
                'client_address': client_info.get('address'),
                'client_btw_number': client_info.get('btw_number'),
                'client_kvk_number': client_info.get('kvk_number'),
                'client_iban': client_info.get('iban'),
                'client_website': client_info.get('website')
            })
        
        # Include company information
        if include_company and self.project and self.project.company:
            company = self.project.company
            quote_dict['company'] = {
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'phone': company.phone,
                'address': company.address,
                'city': getattr(company, 'city', ''),
                'website': company.website,
                'logo_url': getattr(company, 'logo_url', None),
                'vat_number': getattr(company, 'vat_number', None),
                'vat_rate': getattr(company, 'vat_rate', 0.20),
                'registration_number': getattr(company, 'registration_number', None),
                'iban': getattr(company, 'iban', None)
            }
        
        return quote_dict

    def __repr__(self):
        return f'<Quote {self.quote_number}: {self.title}>'
    









