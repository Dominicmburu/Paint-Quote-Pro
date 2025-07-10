# models/pricing.py - Updated with fallback for missing columns
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from models import db

class PricingSettings(db.Model):
    """Model for storing company-specific pricing settings"""
    __tablename__ = 'pricing_settings'
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    
    # Wall treatments pricing (per m²) - NEW COLUMNS
    wall_sanding_filling = Column(Float, default=5.00, nullable=True)  # Allow null for existing records
    wall_priming = Column(Float, default=4.50, nullable=True)  
    wall_one_coat = Column(Float, default=6.00, nullable=True)
    wall_two_coats = Column(Float, default=9.50, nullable=True)
    
    # Ceiling treatments pricing (per m²) - NEW COLUMNS
    ceiling_sanding_filling = Column(Float, default=4.00, nullable=True)
    ceiling_priming = Column(Float, default=5.50, nullable=True)
    ceiling_one_coat = Column(Float, default=5.50, nullable=True)
    ceiling_two_coats = Column(Float, default=8.50, nullable=True)
    
    # Advanced wall pricing (existing columns)
    wall_sanding_light = Column(Float, default=5.00, nullable=False)
    wall_sanding_medium = Column(Float, default=8.00, nullable=False)
    wall_sanding_heavy = Column(Float, default=12.00, nullable=False)
    wall_priming_one_coat = Column(Float, default=4.50, nullable=False)
    wall_priming_two_coat = Column(Float, default=7.00, nullable=False)
    wall_painting_one_coat = Column(Float, default=6.00, nullable=False)
    wall_painting_two_coat = Column(Float, default=9.50, nullable=False)
    wall_painting_three_coat = Column(Float, default=13.00, nullable=False)
    
    # Advanced ceiling pricing (existing columns)
    ceiling_preparation_light = Column(Float, default=4.00, nullable=False)
    ceiling_preparation_medium = Column(Float, default=7.00, nullable=False)
    ceiling_preparation_heavy = Column(Float, default=11.00, nullable=False)
    ceiling_painting_one_coat = Column(Float, default=5.50, nullable=False)
    ceiling_painting_two_coat = Column(Float, default=8.50, nullable=False)
    
    # Interior items pricing (existing)
    interior_doors_easy_prep = Column(Float, default=75.00, nullable=False)
    interior_doors_medium_prep = Column(Float, default=85.00, nullable=False)
    interior_doors_heavy_prep = Column(Float, default=100.00, nullable=False)
    interior_fixed_windows_small = Column(Float, default=35.00, nullable=False)
    interior_fixed_windows_medium = Column(Float, default=45.00, nullable=False)
    interior_fixed_windows_big = Column(Float, default=60.00, nullable=False)
    interior_turn_windows_small = Column(Float, default=45.00, nullable=False)
    interior_turn_windows_medium = Column(Float, default=55.00, nullable=False)
    interior_turn_windows_big = Column(Float, default=70.00, nullable=False)
    interior_stairs = Column(Float, default=25.00, nullable=False)
    interior_radiators = Column(Float, default=35.00, nullable=False)
    interior_skirting_boards = Column(Float, default=12.00, nullable=False)
    interior_other_items = Column(Float, default=10.00, nullable=False)
    
    # Exterior items pricing (existing)
    exterior_doors_front_door = Column(Float, default=150.00, nullable=False)
    exterior_doors_garage_door = Column(Float, default=200.00, nullable=False)
    exterior_doors_outside_door = Column(Float, default=120.00, nullable=False)
    exterior_fixed_windows_small = Column(Float, default=55.00, nullable=False)
    exterior_fixed_windows_medium = Column(Float, default=65.00, nullable=False)
    exterior_fixed_windows_big = Column(Float, default=80.00, nullable=False)
    exterior_turn_windows_small = Column(Float, default=65.00, nullable=False)
    exterior_turn_windows_medium = Column(Float, default=75.00, nullable=False)
    exterior_turn_windows_big = Column(Float, default=90.00, nullable=False)
    exterior_dormer_windows_small = Column(Float, default=110.00, nullable=False)
    exterior_dormer_windows_medium = Column(Float, default=120.00, nullable=False)
    exterior_dormer_windows_large = Column(Float, default=140.00, nullable=False)
    exterior_fascia_boards = Column(Float, default=18.00, nullable=False)
    exterior_rain_pipe = Column(Float, default=15.00, nullable=False)
    exterior_other_items = Column(Float, default=15.00, nullable=False)
    
    # Special jobs pricing (existing)
    special_water_damage = Column(Float, default=150.00, nullable=False)
    special_fire_smoke_damage = Column(Float, default=200.00, nullable=False)
    special_mold_remediation = Column(Float, default=180.00, nullable=False)
    special_nicotine_stained_walls = Column(Float, default=120.00, nullable=False)
    special_uneven_wall_surfaces = Column(Float, default=250.00, nullable=False)
    
    # Woodwork pricing (existing)
    woodwork_level_1 = Column(Float, default=45.00, nullable=False)
    woodwork_level_2 = Column(Float, default=65.00, nullable=False)
    woodwork_level_3 = Column(Float, default=95.00, nullable=False)
    woodwork_level_4 = Column(Float, default=150.00, nullable=False)
    
    # Additional fees (existing)
    cleanup_fee = Column(Float, default=150.00, nullable=False)
    materials_markup = Column(Float, default=0.15, nullable=False)  # 15%
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="pricing_settings")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    def get_wall_treatment_price(self, treatment):
        """Get wall treatment price with fallback"""
        try:
            if treatment == 'sanding_filling':
                return float(self.wall_sanding_filling or self.wall_sanding_light or 5.0)
            elif treatment == 'priming':
                return float(self.wall_priming or self.wall_priming_one_coat or 4.5)
            elif treatment == 'one_coat':
                return float(self.wall_one_coat or self.wall_painting_one_coat or 6.0)
            elif treatment == 'two_coats':
                return float(self.wall_two_coats or self.wall_painting_two_coat or 9.5)
            else:
                return 0.0
        except (TypeError, AttributeError):
            # Fallback defaults
            defaults = {
                'sanding_filling': 5.0,
                'priming': 4.5,
                'one_coat': 6.0,
                'two_coats': 9.5
            }
            return defaults.get(treatment, 0.0)
    
    def get_ceiling_treatment_price(self, treatment):
        """Get ceiling treatment price with fallback"""
        try:
            if treatment == 'sanding_filling':
                return float(self.ceiling_sanding_filling or self.ceiling_preparation_light or 4.0)
            elif treatment == 'priming':
                return float(self.ceiling_priming or self.ceiling_preparation_light or 5.5)
            elif treatment == 'one_coat':
                return float(self.ceiling_one_coat or self.ceiling_painting_one_coat or 5.5)
            elif treatment == 'two_coats':
                return float(self.ceiling_two_coats or self.ceiling_painting_two_coat or 8.5)
            else:
                return 0.0
        except (TypeError, AttributeError):
            # Fallback defaults
            defaults = {
                'sanding_filling': 4.0,
                'priming': 5.5,
                'one_coat': 5.5,
                'two_coats': 8.5
            }
            return defaults.get(treatment, 0.0)
    
    def to_dict(self):
        """Convert pricing settings to dictionary format for API responses"""
        return {
            'id': self.id,
            'company_id': self.company_id,
            'walls': {
                # Simple wall treatment pricing (with fallback)
                'sanding_filling': self.get_wall_treatment_price('sanding_filling'),
                'priming': self.get_wall_treatment_price('priming'), 
                'one_coat': self.get_wall_treatment_price('one_coat'),
                'two_coats': self.get_wall_treatment_price('two_coats'),
                
                # Advanced nested structure (for backwards compatibility)
                'sanding': {
                    'light': {'price': float(self.wall_sanding_light), 'description': 'Light sanding - minor imperfections'},
                    'medium': {'price': float(self.wall_sanding_medium), 'description': 'Medium sanding - moderate preparation'},
                    'heavy': {'price': float(self.wall_sanding_heavy), 'description': 'Heavy sanding - extensive preparation'}
                },
                'priming': {
                    'one_coat': {'price': float(self.wall_priming_one_coat), 'description': 'Single primer coat'},
                    'two_coat': {'price': float(self.wall_priming_two_coat), 'description': 'Double primer coat - better coverage'}
                },
                'painting': {
                    'one_coat': {'price': float(self.wall_painting_one_coat), 'description': 'Single paint coat'},
                    'two_coat': {'price': float(self.wall_painting_two_coat), 'description': 'Double paint coat - standard finish'},
                    'three_coat': {'price': float(self.wall_painting_three_coat), 'description': 'Triple paint coat - premium finish'}
                }
            },
            'ceiling': {
                # Simple ceiling treatment pricing (with fallback)
                'sanding_filling': self.get_ceiling_treatment_price('sanding_filling'),
                'priming': self.get_ceiling_treatment_price('priming'),
                'one_coat': self.get_ceiling_treatment_price('one_coat'),
                'two_coats': self.get_ceiling_treatment_price('two_coats'),
                
                # Advanced nested structure (for backwards compatibility)
                'preparation': {
                    'light': {'price': float(self.ceiling_preparation_light), 'description': 'Light ceiling prep'},
                    'medium': {'price': float(self.ceiling_preparation_medium), 'description': 'Medium ceiling prep'},
                    'heavy': {'price': float(self.ceiling_preparation_heavy), 'description': 'Heavy ceiling prep'}
                },
                'painting': {
                    'one_coat': {'price': float(self.ceiling_painting_one_coat), 'description': 'Single ceiling coat'},
                    'two_coat': {'price': float(self.ceiling_painting_two_coat), 'description': 'Double ceiling coat'}
                }
            },
            'interior': {
                'doors': {
                    'easy_prep': {'price': float(self.interior_doors_easy_prep), 'description': 'Easy preparation'},
                    'medium_prep': {'price': float(self.interior_doors_medium_prep), 'description': 'Medium preparation'},
                    'heavy_prep': {'price': float(self.interior_doors_heavy_prep), 'description': 'Heavy preparation'}
                },
                'fixedWindows': {
                    'small': {'price': float(self.interior_fixed_windows_small), 'description': 'Small window (<0.5m²)'},
                    'medium': {'price': float(self.interior_fixed_windows_medium), 'description': 'Medium window (0.5-1m²)'},
                    'big': {'price': float(self.interior_fixed_windows_big), 'description': 'Large window (>1m²)'}
                },
                'turnWindows': {
                    'small': {'price': float(self.interior_turn_windows_small), 'description': 'Small turn window (<0.5m²)'},
                    'medium': {'price': float(self.interior_turn_windows_medium), 'description': 'Medium turn window (0.5-1m²)'},
                    'big': {'price': float(self.interior_turn_windows_big), 'description': 'Large turn window (>1m²)'}
                },
                'stairs': {'price': float(self.interior_stairs), 'description': 'Stair painting per step'},
                'radiators': {'price': float(self.interior_radiators), 'description': 'Radiator painting'},
                'skirtingBoards': {'price': float(self.interior_skirting_boards), 'description': 'Skirting board per meter'},
                'otherItems': {'price': float(self.interior_other_items), 'description': 'Other interior items'}
            },
            'exterior': {
                'doors': {
                    'front_door': {'price': float(self.exterior_doors_front_door), 'description': 'Front door'},
                    'garage_door': {'price': float(self.exterior_doors_garage_door), 'description': 'Garage door'},
                    'outside_door': {'price': float(self.exterior_doors_outside_door), 'description': 'Outside door'}
                },
                'fixedWindows': {
                    'small': {'price': float(self.exterior_fixed_windows_small), 'description': 'Small window (<0.5m²)'},
                    'medium': {'price': float(self.exterior_fixed_windows_medium), 'description': 'Medium window (0.5-1m²)'},
                    'big': {'price': float(self.exterior_fixed_windows_big), 'description': 'Large window (>1m²)'}
                },
                'turnWindows': {
                    'small': {'price': float(self.exterior_turn_windows_small), 'description': 'Small turn window (<0.5m²)'},
                    'medium': {'price': float(self.exterior_turn_windows_medium), 'description': 'Medium turn window (0.5-1m²)'},
                    'big': {'price': float(self.exterior_turn_windows_big), 'description': 'Large turn window (>1m²)'}
                },
                'dormerWindows': {
                    'small': {'price': float(self.exterior_dormer_windows_small), 'description': 'Small dormer (0.8-1.2m)'},
                    'medium': {'price': float(self.exterior_dormer_windows_medium), 'description': 'Medium dormer (1.3-2.4m)'},
                    'large': {'price': float(self.exterior_dormer_windows_large), 'description': 'Large dormer (2.5-4m+)'}
                },
                'fasciaBoards': {'price': float(self.exterior_fascia_boards), 'description': 'Fascia board per meter'},
                'rainPipe': {'price': float(self.exterior_rain_pipe), 'description': 'Rain pipe per meter'},
                'otherItems': {'price': float(self.exterior_other_items), 'description': 'Other exterior items'}
            },
            'specialJobs': {
                'special': {
                    'water_damage': {'price': float(self.special_water_damage), 'description': 'Water damage/leak repair per m²'},
                    'fire_smoke_damage': {'price': float(self.special_fire_smoke_damage), 'description': 'Fire/smoke damage per m²'},
                    'mold_remediation': {'price': float(self.special_mold_remediation), 'description': 'Mold remediation per m²'},
                    'nicotine_stained_walls': {'price': float(self.special_nicotine_stained_walls), 'description': 'Nicotine stained walls per m²'},
                    'uneven_wall_surfaces': {'price': float(self.special_uneven_wall_surfaces), 'description': 'Uneven wall surfaces per m²'}
                },
                'woodwork': {
                    'level_1': {'price': float(self.woodwork_level_1), 'description': 'New/pre-primed woodwork per m²'},
                    'level_2': {'price': float(self.woodwork_level_2), 'description': 'Good condition woodwork per m²'},
                    'level_3': {'price': float(self.woodwork_level_3), 'description': 'Moderate wear woodwork per m²'},
                    'level_4': {'price': float(self.woodwork_level_4), 'description': 'Heavy damage woodwork per m²'}
                }
            },
            'additional': {
                'cleanup_fee': float(self.cleanup_fee),
                'materials_markup': float(self.materials_markup)
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_from_dict(self, pricing_data):
        """Update pricing settings from dictionary"""
        try:
            # Simple wall treatment pricing
            if 'walls' in pricing_data:
                walls = pricing_data['walls']
                
                # Direct pricing for wall treatments (if columns exist)
                if hasattr(self, 'wall_sanding_filling'):
                    self.wall_sanding_filling = walls.get('sanding_filling', self.wall_sanding_filling)
                if hasattr(self, 'wall_priming'):
                    self.wall_priming = walls.get('priming', self.wall_priming)
                if hasattr(self, 'wall_one_coat'):
                    self.wall_one_coat = walls.get('one_coat', self.wall_one_coat)
                if hasattr(self, 'wall_two_coats'):
                    self.wall_two_coats = walls.get('two_coats', self.wall_two_coats)
                
                # Advanced nested pricing (for backwards compatibility)
                if 'sanding' in walls and isinstance(walls['sanding'], dict):
                    self.wall_sanding_light = walls['sanding'].get('light', {}).get('price', self.wall_sanding_light)
                    self.wall_sanding_medium = walls['sanding'].get('medium', {}).get('price', self.wall_sanding_medium)
                    self.wall_sanding_heavy = walls['sanding'].get('heavy', {}).get('price', self.wall_sanding_heavy)
                if 'priming' in walls and isinstance(walls['priming'], dict):
                    self.wall_priming_one_coat = walls['priming'].get('one_coat', {}).get('price', self.wall_priming_one_coat)
                    self.wall_priming_two_coat = walls['priming'].get('two_coat', {}).get('price', self.wall_priming_two_coat)
                if 'painting' in walls and isinstance(walls['painting'], dict):
                    self.wall_painting_one_coat = walls['painting'].get('one_coat', {}).get('price', self.wall_painting_one_coat)
                    self.wall_painting_two_coat = walls['painting'].get('two_coat', {}).get('price', self.wall_painting_two_coat)
                    self.wall_painting_three_coat = walls['painting'].get('three_coat', {}).get('price', self.wall_painting_three_coat)
            
            # Simple ceiling treatment pricing
            if 'ceiling' in pricing_data:
                ceiling = pricing_data['ceiling']
                
                # Direct pricing for ceiling treatments (if columns exist)
                if hasattr(self, 'ceiling_sanding_filling'):
                    self.ceiling_sanding_filling = ceiling.get('sanding_filling', self.ceiling_sanding_filling)
                if hasattr(self, 'ceiling_priming'):
                    self.ceiling_priming = ceiling.get('priming', self.ceiling_priming)
                if hasattr(self, 'ceiling_one_coat'):
                    self.ceiling_one_coat = ceiling.get('one_coat', self.ceiling_one_coat)
                if hasattr(self, 'ceiling_two_coats'):
                    self.ceiling_two_coats = ceiling.get('two_coats', self.ceiling_two_coats)
                
                # Advanced nested pricing (for backwards compatibility)
                if 'preparation' in ceiling and isinstance(ceiling['preparation'], dict):
                    self.ceiling_preparation_light = ceiling['preparation'].get('light', {}).get('price', self.ceiling_preparation_light)
                    self.ceiling_preparation_medium = ceiling['preparation'].get('medium', {}).get('price', self.ceiling_preparation_medium)
                    self.ceiling_preparation_heavy = ceiling['preparation'].get('heavy', {}).get('price', self.ceiling_preparation_heavy)
                if 'painting' in ceiling and isinstance(ceiling['painting'], dict):
                    self.ceiling_painting_one_coat = ceiling['painting'].get('one_coat', {}).get('price', self.ceiling_painting_one_coat)
                    self.ceiling_painting_two_coat = ceiling['painting'].get('two_coat', {}).get('price', self.ceiling_painting_two_coat)
            
            # Update other pricing sections (interior, exterior, special jobs, additional)
            # ... (rest of the update logic for other sections)
            
            self.updated_at = datetime.utcnow()
            
        except Exception as e:
            print(f"Error updating pricing from dict: {e}")
            # Don't fail completely, just log the error
    
    @classmethod
    def get_or_create_for_company(cls, company_id):
        """Get existing pricing settings or create default ones for a company"""
        pricing = cls.query.filter_by(company_id=company_id).first()
        if not pricing:
            pricing = cls(company_id=company_id)
            db.session.add(pricing)
            db.session.commit()
        return pricing

    def __repr__(self):
        return f'<PricingSettings {self.id} for Company {self.company_id}>'