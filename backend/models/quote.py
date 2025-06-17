# Update your Quote model's to_dict method in models/quote.py

from datetime import datetime, timedelta
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
    line_items = db.Column(db.JSON, nullable=True)  # Detailed breakdown
    
    # Status and dates
    status = db.Column(db.String(20), default='draft')  # draft, sent, accepted, rejected, expired
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
        import uuid
        return f"PQ{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_expired(self):
        return datetime.utcnow() > self.valid_until
    
    def to_dict(self, include_project=True):
        """Convert quote to dictionary with optional project data"""
        quote_dict = {
            'id': self.id,
            'quote_number': self.quote_number,
            'title': self.title,
            'description': self.description,
            'subtotal': self.subtotal,
            'vat_amount': self.vat_amount,
            'total_amount': self.total_amount,
            'line_items': self.line_items,
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
        
        # Include project data if requested and available
        if include_project and self.project:
            quote_dict['project'] = {
                'id': self.project.id,
                'name': self.project.name,
                'description': self.project.description,
                'client_name': self.project.client_name,
                'client_email': self.project.client_email,
                'client_phone': self.project.client_phone,
                'client_address': self.project.client_address,
                'project_type': self.project.project_type,
                'property_type': self.project.property_type,
                'status': self.project.status,
                'created_at': self.project.created_at.isoformat() if self.project.created_at else None
            }
            
            # Also add client info directly to quote for easier access
            quote_dict['client_name'] = self.project.client_name
            quote_dict['client_email'] = self.project.client_email
            quote_dict['client_phone'] = self.project.client_phone
            quote_dict['client_address'] = self.project.client_address
            quote_dict['project_name'] = self.project.name
        
        return quote_dict