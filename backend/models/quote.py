from datetime import datetime, timedelta
import uuid
from . import db

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
    line_items = db.Column(db.JSON, nullable=True)  # Detailed line items
    measurement_details = db.Column(db.JSON, nullable=True)  # NEW: Detailed measurements
    
    # Status and dates
    status = db.Column(db.String(20), default='draft')
    valid_until = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=30))
    sent_at = db.Column(db.DateTime, nullable=True)
    accepted_at = db.Column(db.DateTime, nullable=True)
    
    # File paths
    pdf_path = db.Column(db.String(500), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    project = db.relationship('Project', back_populates='quotes')
    
    @staticmethod
    def generate_quote_number():
        """Generate a unique quote number"""
        return f"PQ{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_expired(self):
        """Check if the quote has expired"""
        return datetime.utcnow() > self.valid_until
    
    def to_dict(self, include_project=True, include_company=True):
        """Convert quote to dictionary with comprehensive information"""
        quote_dict = {
            'id': self.id,
            'quote_number': self.quote_number,
            'title': self.title,
            'description': self.description,
            'subtotal': self.subtotal,
            'vat_amount': self.vat_amount,
            'total_amount': self.total_amount,
            'line_items': self.line_items or [],
            'measurement_details': self.measurement_details or {},
            'status': self.status,
            'valid_until': self.valid_until.isoformat(),
            'is_expired': self.is_expired,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'pdf_path': self.pdf_path,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'project_id': self.project_id
        }
        
        # Include project and client data
        if include_project and self.project:
            client_info = self.project.get_client_info()
            
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
                
                # Direct access fields
                'project_name': self.project.name,
                'property_address': self.project.property_address,
                'project_type': self.project.project_type,
                'property_type': self.project.property_type,
                'client_company_name': client_info['company_name'],
                'client_contact_name': client_info['contact_name'],
                'client_email': client_info['email'],
                'client_phone': client_info['phone'],
                'client_address': client_info['address'],
                'client_btw_number': client_info['btw_number'],
                'client_kvk_number': client_info['kvk_number'],
                'client_iban': client_info['iban'],
                'client_website': client_info['website']
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
                'website': company.website,
                'logo_url': getattr(company, 'logo_url', None),
                'vat_number': getattr(company, 'vat_number', None),
                'vat_rate': getattr(company, 'vat_rate', 0.20)
            }
        
        return quote_dict