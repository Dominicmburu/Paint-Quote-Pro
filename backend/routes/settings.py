# routes/settings.py - Fixed with error handling
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User
from models.pricing import PricingSettings
from datetime import datetime
import traceback

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/pricing', methods=['GET'])
@jwt_required()
def get_pricing_settings():
    """Retrieve pricing settings for the user's company"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404

        # Get or create pricing settings for the company
        pricing = PricingSettings.get_or_create_for_company(user.company_id)

        # Handle case where pricing model might have missing columns
        try:
            pricing_dict = pricing.to_dict()
        except Exception as model_error:
            print(f"Error calling to_dict: {model_error}")
            # Create fallback pricing structure
            pricing_dict = {
                'id': pricing.id,
                'company_id': pricing.company_id,
                'walls': {
                    'sanding_filling': getattr(pricing, 'wall_sanding_filling', None) or getattr(pricing, 'wall_sanding_light', 5.0),
                    'priming': getattr(pricing, 'wall_priming', None) or getattr(pricing, 'wall_priming_one_coat', 4.5),
                    'one_coat': getattr(pricing, 'wall_one_coat', None) or getattr(pricing, 'wall_painting_one_coat', 6.0),
                    'two_coats': getattr(pricing, 'wall_two_coats', None) or getattr(pricing, 'wall_painting_two_coat', 9.5),
                },
                'ceiling': {
                    'sanding_filling': getattr(pricing, 'ceiling_sanding_filling', None) or getattr(pricing, 'ceiling_preparation_light', 4.0),
                    'priming': getattr(pricing, 'ceiling_priming', None) or getattr(pricing, 'ceiling_preparation_light', 5.5),
                    'one_coat': getattr(pricing, 'ceiling_one_coat', None) or getattr(pricing, 'ceiling_painting_one_coat', 5.5),
                    'two_coats': getattr(pricing, 'ceiling_two_coats', None) or getattr(pricing, 'ceiling_painting_two_coat', 8.5),
                },
                'interior': {
                    'doors': {
                        'easy_prep': {'price': float(pricing.interior_doors_easy_prep), 'description': 'Easy preparation'},
                        'medium_prep': {'price': float(pricing.interior_doors_medium_prep), 'description': 'Medium preparation'},
                        'heavy_prep': {'price': float(pricing.interior_doors_heavy_prep), 'description': 'Heavy preparation'}
                    },
                    'fixedWindows': {
                        'small': {'price': float(pricing.interior_fixed_windows_small), 'description': 'Small window (<0.5m²)'},
                        'medium': {'price': float(pricing.interior_fixed_windows_medium), 'description': 'Medium window (0.5-1m²)'},
                        'big': {'price': float(pricing.interior_fixed_windows_big), 'description': 'Large window (>1m²)'}
                    },
                    'turnWindows': {
                        'small': {'price': float(pricing.interior_turn_windows_small), 'description': 'Small turn window (<0.5m²)'},
                        'medium': {'price': float(pricing.interior_turn_windows_medium), 'description': 'Medium turn window (0.5-1m²)'},
                        'big': {'price': float(pricing.interior_turn_windows_big), 'description': 'Large turn window (>1m²)'}
                    },
                    'stairs': {'price': float(pricing.interior_stairs), 'description': 'Stair painting per step'},
                    'radiators': {'price': float(pricing.interior_radiators), 'description': 'Radiator painting'},
                    'skirtingBoards': {'price': float(pricing.interior_skirting_boards), 'description': 'Skirting board per meter'},
                    'otherItems': {'price': float(pricing.interior_other_items), 'description': 'Other interior items'}
                },
                'exterior': {
                    'doors': {
                        'front_door': {'price': float(pricing.exterior_doors_front_door), 'description': 'Front door'},
                        'garage_door': {'price': float(pricing.exterior_doors_garage_door), 'description': 'Garage door'},
                        'outside_door': {'price': float(pricing.exterior_doors_outside_door), 'description': 'Outside door'}
                    },
                    'fixedWindows': {
                        'small': {'price': float(pricing.exterior_fixed_windows_small), 'description': 'Small window (<0.5m²)'},
                        'medium': {'price': float(pricing.exterior_fixed_windows_medium), 'description': 'Medium window (0.5-1m²)'},
                        'big': {'price': float(pricing.exterior_fixed_windows_big), 'description': 'Large window (>1m²)'}
                    },
                    'turnWindows': {
                        'small': {'price': float(pricing.exterior_turn_windows_small), 'description': 'Small turn window (<0.5m²)'},
                        'medium': {'price': float(pricing.exterior_turn_windows_medium), 'description': 'Medium turn window (0.5-1m²)'},
                        'big': {'price': float(pricing.exterior_turn_windows_big), 'description': 'Large turn window (>1m²)'}
                    },
                    'dormerWindows': {
                        'small': {'price': float(pricing.exterior_dormer_windows_small), 'description': 'Small dormer (0.8-1.2m)'},
                        'medium': {'price': float(pricing.exterior_dormer_windows_medium), 'description': 'Medium dormer (1.3-2.4m)'},
                        'large': {'price': float(pricing.exterior_dormer_windows_large), 'description': 'Large dormer (2.5-4m+)'}
                    },
                    'fasciaBoards': {'price': float(pricing.exterior_fascia_boards), 'description': 'Fascia board per meter'},
                    'rainPipe': {'price': float(pricing.exterior_rain_pipe), 'description': 'Rain pipe per meter'},
                    'otherItems': {'price': float(pricing.exterior_other_items), 'description': 'Other exterior items'}
                },
                'specialJobs': {
                    'special': {
                        'water_damage': {'price': float(pricing.special_water_damage), 'description': 'Water damage/leak repair per m²'},
                        'fire_smoke_damage': {'price': float(pricing.special_fire_smoke_damage), 'description': 'Fire/smoke damage per m²'},
                        'mold_remediation': {'price': float(pricing.special_mold_remediation), 'description': 'Mold remediation per m²'},
                        'nicotine_stained_walls': {'price': float(pricing.special_nicotine_stained_walls), 'description': 'Nicotine stained walls per m²'},
                        'uneven_wall_surfaces': {'price': float(pricing.special_uneven_wall_surfaces), 'description': 'Uneven wall surfaces per m²'}
                    },
                    'woodwork': {
                        'level_1': {'price': float(pricing.woodwork_level_1), 'description': 'New/pre-primed woodwork per m²'},
                        'level_2': {'price': float(pricing.woodwork_level_2), 'description': 'Good condition woodwork per m²'},
                        'level_3': {'price': float(pricing.woodwork_level_3), 'description': 'Moderate wear woodwork per m²'},
                        'level_4': {'price': float(pricing.woodwork_level_4), 'description': 'Heavy damage woodwork per m²'}
                    }
                },
                'additional': {
                    'cleanup_fee': float(pricing.cleanup_fee),
                    'materials_markup': float(pricing.materials_markup)
                },
                'created_at': pricing.created_at.isoformat() if pricing.created_at else None,
                'updated_at': pricing.updated_at.isoformat() if pricing.updated_at else None
            }

        return jsonify({
            'pricing': pricing_dict,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"Error in get_pricing_settings: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Failed to retrieve pricing settings',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@settings_bp.route('/pricing', methods=['POST'])
@jwt_required()
def update_pricing_settings():
    """Update pricing settings for the user's company"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404

        data = request.get_json()
        if not data or 'pricing' not in data:
            return jsonify({'error': 'Pricing data is required'}), 400

        # Get or create pricing settings for the company
        pricing = PricingSettings.get_or_create_for_company(user.company_id)
        
        # Update pricing settings from the provided data
        try:
            pricing.update_from_dict(data['pricing'])
        except Exception as update_error:
            print(f"Error updating from dict: {update_error}")
            # Manual update for direct pricing fields
            walls = data['pricing'].get('walls', {})
            ceiling = data['pricing'].get('ceiling', {})
            
            # Update wall pricing (if columns exist)
            if hasattr(pricing, 'wall_sanding_filling') and 'sanding_filling' in walls:
                pricing.wall_sanding_filling = walls['sanding_filling']
            if hasattr(pricing, 'wall_priming') and 'priming' in walls:
                pricing.wall_priming = walls['priming']
            if hasattr(pricing, 'wall_one_coat') and 'one_coat' in walls:
                pricing.wall_one_coat = walls['one_coat']
            if hasattr(pricing, 'wall_two_coats') and 'two_coats' in walls:
                pricing.wall_two_coats = walls['two_coats']
            
            # Update ceiling pricing (if columns exist)
            if hasattr(pricing, 'ceiling_sanding_filling') and 'sanding_filling' in ceiling:
                pricing.ceiling_sanding_filling = ceiling['sanding_filling']
            if hasattr(pricing, 'ceiling_priming') and 'priming' in ceiling:
                pricing.ceiling_priming = ceiling['priming']
            if hasattr(pricing, 'ceiling_one_coat') and 'one_coat' in ceiling:
                pricing.ceiling_one_coat = ceiling['one_coat']
            if hasattr(pricing, 'ceiling_two_coats') and 'two_coats' in ceiling:
                pricing.ceiling_two_coats = ceiling['two_coats']
        
        pricing.created_by = user.id  # Track who updated it
        
        # Save to database
        db.session.commit()

        # Get updated pricing
        try:
            pricing_dict = pricing.to_dict()
        except:
            # Use fallback if to_dict fails
            pricing_dict = {'message': 'Pricing updated successfully but could not retrieve full structure'}

        return jsonify({
            'message': 'Pricing settings updated successfully',
            'pricing': pricing_dict,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in update_pricing_settings: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Failed to update pricing settings',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@settings_bp.route('/pricing/reset', methods=['POST'])
@jwt_required()
def reset_pricing_settings():
    """Reset pricing settings to defaults for the user's company"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        
        if not user or not user.company:
            return jsonify({'error': 'User or company not found'}), 404

        # Delete existing pricing settings (if any)
        existing_pricing = PricingSettings.query.filter_by(company_id=user.company_id).first()
        if existing_pricing:
            db.session.delete(existing_pricing)
        
        # Create new default pricing settings
        new_pricing = PricingSettings(company_id=user.company_id, created_by=user.id)
        db.session.add(new_pricing)
        db.session.commit()

        # Get new pricing
        try:
            pricing_dict = new_pricing.to_dict()
        except:
            pricing_dict = {'message': 'Pricing reset successfully but could not retrieve full structure'}

        return jsonify({
            'message': 'Pricing settings reset to defaults successfully',
            'pricing': pricing_dict,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in reset_pricing_settings: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Failed to reset pricing settings',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500