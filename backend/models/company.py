from datetime import datetime
from . import db

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    website = db.Column(db.String(200), nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    
    # Business settings
    preferred_paint_brand = db.Column(db.String(50), default='Dulux')
    vat_number = db.Column(db.String(50), nullable=True)
    vat_rate = db.Column(db.Float, default=0.20)  # 20% VAT
    
    # Quote settings
    quote_footer_text = db.Column(db.Text, nullable=True)
    quote_terms_conditions = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', back_populates='company')
    projects = db.relationship('Project', back_populates='company', lazy='dynamic')
    subscription = db.relationship('Subscription', back_populates='company', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'website': self.website,
            'logo_url': self.logo_url,
            'preferred_paint_brand': self.preferred_paint_brand,
            'vat_number': self.vat_number,
            'vat_rate': self.vat_rate,
            'quote_footer_text': self.quote_footer_text,
            'quote_terms_conditions': self.quote_terms_conditions,
            'created_at': self.created_at.isoformat()
        }