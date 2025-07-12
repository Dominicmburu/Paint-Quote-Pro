# models/project.py (Updated)
from datetime import datetime
import json
from . import db
import os

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Project details
    project_type = db.Column(db.String(50), default='interior')  # interior, exterior, both
    property_type = db.Column(db.String(50), nullable=False)     # residential, commercial
    property_address = db.Column(db.Text, nullable=False)        # Property address
    
    # Client information (legacy support - will use client_id when available)
    client_name = db.Column(db.String(100), nullable=True)
    client_email = db.Column(db.String(120), nullable=True)
    client_phone = db.Column(db.String(20), nullable=True)
    client_address = db.Column(db.Text, nullable=True)
    
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
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=True)  # New client relationship
    
    company = db.relationship('Company', back_populates='projects')
    created_by_user = db.relationship('User', back_populates='projects')
    client = db.relationship('Client', back_populates='projects')
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
    
    def get_client_info(self):
        """Get client information from either client relationship or legacy fields"""
        if self.client:
            return {
                'company_name': self.client.company_name,
                'contact_name': self.client.contact_name,
                'email': self.client.email,
                'phone': self.client.phone,
                'address': self.client.get_full_address(),
                'btw_number': self.client.btw_number,
                'kvk_number': self.client.kvk_number,
                'iban': self.client.iban,
                'website': self.client.website
            }
        else:
            return {
                'company_name': self.client_name,
                'contact_name': None,
                'email': self.client_email,
                'phone': self.client_phone,
                'address': self.client_address,
                'btw_number': None,
                'kvk_number': None,
                'iban': None,
                'website': None
            }
    
    def to_dict(self):
        client_info = self.get_client_info()
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_type': self.project_type,
            'property_type': self.property_type,
            'property_address': self.property_address,
            'status': self.status,
            
            # Client information (unified)
            'client_info': client_info,
            'client_name': client_info['company_name'],
            'client_email': client_info['email'],
            'client_phone': client_info['phone'],
            'client_address': client_info['address'],
            
            # Analysis and measurements
            'floor_plan_analysis': self.floor_plan_analysis,
            'manual_measurements': self.manual_measurements,
            'uploaded_images': self.uploaded_images,
            'generated_files': self.generated_files,
            'quote_data': self.quote_data,
            'quote_pdf_path': self.quote_pdf_path,
            
            # Metadata
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'created_by': self.created_by_user.full_name if self.created_by_user else None,
            'company_id': self.company_id,
            'client_id': self.client_id
        }
    


def clear_analysis_data(self):
    """Clear all analysis data and files"""
    self.floor_plan_analysis = None
    self.manual_measurements = None
    
    # Clean up generated files
    if self.generated_files:
        for file_path in self.generated_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete file {file_path}: {e}")
    
    self.generated_files = []
    db.session.commit()

def set_analysis_results(self, results):
    """Set analysis results and ensure measurements are saved"""
    self.floor_plan_analysis = results
    
    # Automatically save structured measurements if available
    if 'structured_measurements' in results:
        self.manual_measurements = results['structured_measurements']
        print(f"💾 Auto-saved {len(results['structured_measurements'].get('rooms', []))} rooms to manual_measurements")
    
    self.status = 'ready'
    self.updated_at = datetime.utcnow()
    db.session.commit()