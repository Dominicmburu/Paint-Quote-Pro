# models/client.py
from datetime import datetime
from . import db

class Client(db.Model):
    __tablename__ = 'clients'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Company Information
    company_name = db.Column(db.String(200), nullable=True)
    contact_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    
    # Address Information
    address = db.Column(db.String(500), nullable=True)
    postcode = db.Column(db.String(20), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    
    # Business Information
    btw_number = db.Column(db.String(50), nullable=True)  # BTW nummer
    kvk_number = db.Column(db.String(50), nullable=True)  # KVK nummer
    iban = db.Column(db.String(50), nullable=True)        # IBAN
    website = db.Column(db.String(200), nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    company = db.relationship('Company', backref='clients')
    created_by_user = db.relationship('User', backref='created_clients')
    projects = db.relationship('Project', back_populates='client', lazy='dynamic')
    
    def get_full_address(self):
        """Get formatted full address"""
        parts = [self.address, self.postcode, self.city]
        return ', '.join([part for part in parts if part])
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'postcode': self.postcode,
            'city': self.city,
            'full_address': self.get_full_address(),
            'btw_number': self.btw_number,
            'kvk_number': self.kvk_number,
            'iban': self.iban,
            'website': self.website,
            'projects_count': self.projects.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }