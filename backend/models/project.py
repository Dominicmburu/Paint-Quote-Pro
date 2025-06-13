from datetime import datetime
import json
from . import db

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Client information
    client_name = db.Column(db.String(100), nullable=True)
    client_email = db.Column(db.String(120), nullable=True)
    client_phone = db.Column(db.String(20), nullable=True)
    client_address = db.Column(db.Text, nullable=True)
    
    # Project details
    project_type = db.Column(db.String(50), default='interior')  # interior, exterior, both
    property_type = db.Column(db.String(50), nullable=True)  # residential, commercial
    
    # Analysis data
    floor_plan_analysis = db.Column(db.JSON, nullable=True)  # AI analysis results
    manual_measurements = db.Column(db.JSON, nullable=True)  # Manual input data
    
    # Files
    uploaded_images = db.Column(db.JSON, nullable=True)  # List of uploaded image paths
    generated_files = db.Column(db.JSON, nullable=True)  # Generated analysis files
    
    # Quote data
    quote_data = db.Column(db.JSON, nullable=True)  # Final quote calculations
    quote_pdf_path = db.Column(db.String(500), nullable=True)
    
    # Status and workflow
    status = db.Column(db.String(20), default='draft')  # draft, analyzing, ready, quoted, completed
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    company = db.relationship('Company', back_populates='projects')
    created_by_user = db.relationship('User', back_populates='projects')
    quotes = db.relationship('Quote', back_populates='project', lazy='dynamic')
    
    def add_uploaded_image(self, image_path):
        if self.uploaded_images is None:
            self.uploaded_images = []
        self.uploaded_images.append(image_path)
        db.session.commit()
    
    def set_analysis_results(self, results):
        self.floor_plan_analysis = results
        self.status = 'ready'
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'client_name': self.client_name,
            'client_email': self.client_email,
            'client_phone': self.client_phone,
            'client_address': self.client_address,
            'project_type': self.project_type,
            'property_type': self.property_type,
            'status': self.status,
            'floor_plan_analysis': self.floor_plan_analysis,
            'manual_measurements': self.manual_measurements,
            'uploaded_images': self.uploaded_images,
            'generated_files': self.generated_files,
            'quote_data': self.quote_data,
            'quote_pdf_path': self.quote_pdf_path,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'created_by': self.created_by_user.full_name if self.created_by_user else None
        }