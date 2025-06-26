import os
import json
import shutil
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
import time
import math
import colorsys
import requests
import cv2
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from gradio_client import Client, handle_file

class FloorPlanAnalyzer:
    """Enhanced floor plan analyzer with comprehensive interior/exterior detection"""
    
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        self.client = OpenAI(api_key=openai_api_key)
        self.logger = logging.getLogger(__name__)
        
        # Business constants
        self.WALL_HEIGHT = 2.4  # meters
        self.CEILING_HEIGHT = 2.4  # meters
        
        # Image processing constants
        self.ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
        self.MAX_FILE_SIZE = 32 * 1024 * 1024  # 32MB
        
        # Interior/Exterior classification keywords
        self.INTERIOR_KEYWORDS = {
            'rooms': ['bedroom', 'bathroom', 'kitchen', 'living room', 'dining room', 'office', 
                     'study', 'closet', 'pantry', 'laundry', 'utility', 'hallway', 'corridor',
                     'foyer', 'entrance hall', 'family room', 'den', 'library', 'master bedroom'],
            'features': ['radiator', 'fireplace', 'built-in', 'cabinet', 'countertop', 'island',
                        'staircase', 'banister', 'ceiling fan', 'light fixture'],
            'surfaces': ['interior wall', 'ceiling', 'interior door', 'interior window', 
                        'skirting board', 'baseboard', 'crown molding', 'trim', 'wainscoting']
        }
        
        self.EXTERIOR_KEYWORDS = {
            'features': ['exterior wall', 'facade', 'siding', 'brick', 'stone', 'stucco',
                        'garage door', 'front door', 'patio door', 'sliding door',
                        'balcony', 'deck', 'porch', 'veranda', 'terrace'],
            'surfaces': ['exterior door', 'exterior window', 'shutter', 'trim', 'fascia',
                        'soffit', 'gutter', 'downspout', 'railing', 'post', 'column',
                        'dormer', 'chimney', 'roof edge', 'window frame', 'door frame'],
            'areas': ['exterior', 'outside', 'outdoor', 'external', 'perimeter']
        }
    
    def process_floor_plan(self, image_path: str, results_dir: str, analysis_id: str) -> Dict[str, Any]:
        """Complete floor plan processing with enhanced interior/exterior analysis"""
        self.logger.info(f"🏠 Starting enhanced floor plan analysis: {analysis_id}")
        
        try:
            # Validate input
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Input image not found: {image_path}")
            
            # Create results directory
            os.makedirs(results_dir, exist_ok=True)
            
            # Step 1: Upload image for analysis
            self.logger.info("📤 Step 1: Preparing image for analysis...")
            original_image_link = self._upload_image_with_fallbacks(image_path)
            self.logger.info(f"✅ Image prepared: {original_image_link}")
            
            # Step 2: Enhanced GPT-4 Vision analysis with interior/exterior focus
            self.logger.info("🤖 Step 2: Enhanced GPT-4 Vision analysis...")
            gpt_analysis = self._analyze_with_enhanced_gpt4_vision(original_image_link)
            
            # Step 3: Gradio API detection (if available)
            self.logger.info("🔍 Step 3: Advanced AI detection...")
            detection_results = self._detect_with_gradio_api(image_path)
            
            # Step 4: Process measurements and generate room structure
            self.logger.info("📐 Step 4: Processing measurements...")
            measurements = self._process_enhanced_measurements(detection_results, gpt_analysis, results_dir)
            
            # Step 5: Calculate comprehensive surface areas with room classification
            self.logger.info("📊 Step 5: Calculating surface areas with room classification...")
            surface_areas = self._calculate_comprehensive_surface_areas_with_classification(
                detection_results, measurements, gpt_analysis
            )
            
            # Step 6: Identify and categorize interior/exterior work
            self.logger.info("🏗️ Step 6: Identifying interior and exterior work...")
            work_classification = self._classify_interior_exterior_work(
                gpt_analysis, surface_areas, measurements
            )
            
            # Step 7: Generate structured measurements for frontend
            self.logger.info("📋 Step 7: Generating structured measurements...")
            structured_measurements = self._generate_structured_measurements(
                surface_areas, work_classification, gpt_analysis
            )
            
            # Step 8: Generate reports and visualizations
            self.logger.info("📋 Step 8: Generating reports...")
            reports = self._generate_enhanced_reports(
                gpt_analysis, detection_results, measurements, surface_areas, 
                work_classification, structured_measurements, results_dir
            )
            
            # Compile final results
            results = {
                "status": "success",
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat(),
                "gpt_analysis": gpt_analysis,
                "detection_results": detection_results,
                "measurements": measurements,
                "surface_areas": surface_areas,
                "work_classification": work_classification,
                "structured_measurements": structured_measurements,
                "reports": reports,
                "original_image_link": original_image_link
            }
            
            # Save complete results
            results_file = os.path.join(results_dir, "complete_analysis.json")
            with open(results_file, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=4, ensure_ascii=False)
            
            self.logger.info(f"🎉 Enhanced analysis {analysis_id} completed successfully!")
            return results
            
        except Exception as e:
            error_msg = f"Error processing floor plan: {str(e)}\n{traceback.format_exc()}"
            self.logger.error(f"❌ Analysis failed: {error_msg}")
            return {
                "status": "error",
                "message": error_msg,
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _analyze_with_enhanced_gpt4_vision(self, image_url: str) -> Dict[str, Any]:
        """Enhanced GPT-4 Vision analysis with focus on interior/exterior identification"""
        prompt = """
        Analyze this floor plan image and provide detailed information with focus on interior and exterior elements:
        
        1. ROOM IDENTIFICATION:
           - List all rooms with their names and approximate sizes
           - Identify room types (bedroom, bathroom, kitchen, living room, etc.)
           - Note any special features in each room
        
        2. INTERIOR ELEMENTS:
           - Interior walls that need painting
           - Ceilings in each room
           - Interior doors and windows
           - Built-in features (cabinets, radiators, etc.)
           - Interior trim, moldings, baseboards
           - Any architectural details
        
        3. EXTERIOR ELEMENTS (if visible):
           - Exterior walls
           - Exterior doors and windows
           - Balconies, patios, or outdoor spaces
           - Exterior trim or architectural features
        
        4. MEASUREMENTS AND DIMENSIONS:
           - Any visible measurements or scale indicators
           - Approximate room dimensions if determinable
           - Wall lengths and heights if shown
        
        5. STRUCTURAL FEATURES:
           - Load-bearing walls
           - Openings (doors, windows, archways)
           - Stairs, if present
           - Any unique architectural elements
        
        6. WORK SCOPE ASSESSMENT:
           - Estimate surface areas that would need painting
           - Distinguish between interior and exterior work
           - Identify any challenging areas or special requirements
        
        Please provide detailed, structured information that would help a painter create an accurate quote.
        Focus on distinguishing between interior painting work (inside rooms) and exterior painting work (outside surfaces).
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }],
                max_tokens=3000,
                temperature=0.0
            )
            
            analysis_text = response.choices[0].message.content
            
            # Extract structured information
            room_details = self._extract_enhanced_room_details(analysis_text)
            interior_features = self._extract_interior_features(analysis_text)
            exterior_features = self._extract_exterior_features(analysis_text)
            measurements = self._extract_measurements(analysis_text)
            
            return {
                "full_analysis": analysis_text,
                "room_details": room_details,
                "interior_features": interior_features,
                "exterior_features": exterior_features,
                "measurements": measurements,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Enhanced GPT-4 Vision analysis failed: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _extract_enhanced_room_details(self, analysis_text: str) -> List[Dict]:
        """Extract detailed room information from analysis"""
        rooms = []
        lines = analysis_text.lower().split('\n')
        
        # Common room types to look for
        room_types = [
            'bedroom', 'bathroom', 'kitchen', 'living room', 'dining room',
            'office', 'study', 'closet', 'pantry', 'laundry', 'utility',
            'hallway', 'corridor', 'foyer', 'entrance', 'family room'
        ]
        
        current_room = None
        for line in lines:
            line = line.strip()
            
            # Look for room mentions
            for room_type in room_types:
                if room_type in line and ('room' in line or room_type in ['bathroom', 'kitchen', 'office']):
                    if current_room:
                        rooms.append(current_room)
                    
                    current_room = {
                        'name': self._clean_room_name(line, room_type),
                        'type': room_type,
                        'features': [],
                        'estimated_size': self._extract_size_from_line(line)
                    }
                    break
            
            # Add features to current room
            if current_room and any(keyword in line for keyword in ['window', 'door', 'built-in', 'cabinet', 'fixture']):
                current_room['features'].append(line.strip())
        
        if current_room:
            rooms.append(current_room)
        
        return rooms
    
    def _extract_interior_features(self, analysis_text: str) -> Dict[str, List]:
        """Extract interior features that need painting work"""
        features = {
            'walls': [],
            'ceilings': [],
            'doors': [],
            'windows': [],
            'trim': [],
            'built_ins': [],
            'other': []
        }
        
        lines = analysis_text.lower().split('\n')
        
        for line in lines:
            line = line.strip()
            
            if any(keyword in line for keyword in ['interior wall', 'wall', 'partition']):
                if 'exterior' not in line:
                    features['walls'].append(line)
            elif 'ceiling' in line:
                features['ceilings'].append(line)
            elif 'interior door' in line or ('door' in line and 'exterior' not in line):
                features['doors'].append(line)
            elif 'interior window' in line or ('window' in line and 'exterior' not in line):
                features['windows'].append(line)
            elif any(keyword in line for keyword in ['trim', 'molding', 'baseboard', 'skirting']):
                features['trim'].append(line)
            elif any(keyword in line for keyword in ['cabinet', 'built-in', 'radiator', 'fixture']):
                features['built_ins'].append(line)
            elif any(keyword in line for keyword in self.INTERIOR_KEYWORDS['surfaces']):
                features['other'].append(line)
        
        return features
    
    def _extract_exterior_features(self, analysis_text: str) -> Dict[str, List]:
        """Extract exterior features that need painting work"""
        features = {
            'walls': [],
            'doors': [],
            'windows': [],
            'trim': [],
            'siding': [],
            'other': []
        }
        
        lines = analysis_text.lower().split('\n')
        
        for line in lines:
            line = line.strip()
            
            if any(keyword in line for keyword in ['exterior wall', 'facade', 'siding']):
                features['walls'].append(line)
            elif 'exterior door' in line or ('door' in line and 'exterior' in line):
                features['doors'].append(line)
            elif 'exterior window' in line or ('window' in line and 'exterior' in line):
                features['windows'].append(line)
            elif any(keyword in line for keyword in ['fascia', 'soffit', 'gutter', 'trim']):
                features['trim'].append(line)
            elif any(keyword in line for keyword in ['siding', 'brick', 'stone', 'stucco']):
                features['siding'].append(line)
            elif any(keyword in line for keyword in self.EXTERIOR_KEYWORDS['surfaces']):
                features['other'].append(line)
        
        return features
    
    def _classify_interior_exterior_work(self, gpt_analysis: Dict, surface_areas: Dict, measurements: Dict) -> Dict[str, Any]:
        """Classify work items as interior or exterior based on analysis"""
        classification = {
            'interior_work': {
                'rooms': {},
                'common_areas': [],
                'estimated_items': {}
            },
            'exterior_work': {
                'walls': [],
                'doors_windows': [],
                'trim_features': [],
                'estimated_items': {}
            }
        }
        
        # Process rooms for interior work
        if 'room_details' in gpt_analysis:
            for room in gpt_analysis['room_details']:
                room_name = room['name']
                room_type = room['type']
                
                # Get surface area data for this room if available
                room_surface_data = None
                if 'rooms' in surface_areas:
                    for room_key, room_data in surface_areas['rooms'].items():
                        if room_name.lower() in room_key.lower() or room_key.lower() in room_name.lower():
                            room_surface_data = room_data
                            break
                
                classification['interior_work']['rooms'][room_name] = {
                    'type': room_type,
                    'surface_data': room_surface_data,
                    'features': room.get('features', []),
                    'estimated_work': self._estimate_room_work(room, room_surface_data)
                }
        
        # Estimate interior items based on room count and analysis
        total_rooms = len(classification['interior_work']['rooms'])
        if total_rooms > 0:
            # Estimate common interior items
            classification['interior_work']['estimated_items'] = {
                'interior_doors': max(total_rooms - 1, 0),  # Assume one door per room except one
                'interior_windows': total_rooms * 2,  # Assume 2 windows per room on average
                'radiators': max(total_rooms - 1, 0),  # Exclude bathroom typically
                'skirting_boards_meters': self._estimate_skirting_length(surface_areas),
            }
        
        # Process exterior features
        if 'exterior_features' in gpt_analysis:
            ext_features = gpt_analysis['exterior_features']
            
            for wall_item in ext_features.get('walls', []):
                classification['exterior_work']['walls'].append({
                    'description': wall_item,
                    'estimated_area': self._estimate_exterior_wall_area(wall_item)
                })
            
            for door_window in ext_features.get('doors', []) + ext_features.get('windows', []):
                classification['exterior_work']['doors_windows'].append({
                    'description': door_window,
                    'type': 'door' if 'door' in door_window else 'window'
                })
            
            for trim_item in ext_features.get('trim', []):
                classification['exterior_work']['trim_features'].append({
                    'description': trim_item,
                    'estimated_length': self._estimate_trim_length(trim_item)
                })
        
        # Estimate exterior items based on building type
        if surface_areas.get('totals', {}).get('total_floor_area_m2', 0) > 0:
            floor_area = surface_areas['totals']['total_floor_area_m2']
            perimeter = math.sqrt(floor_area) * 4  # Rough square approximation
            
            classification['exterior_work']['estimated_items'] = {
                'exterior_doors': 2,  # Front and back door typically
                'exterior_windows': max(int(floor_area / 10), 4),  # Rough estimate
                'fascia_boards_meters': perimeter,
                'soffit_area_m2': perimeter * 0.5,  # Rough estimate
            }
        
        return classification
    
    def _generate_structured_measurements(self, surface_areas: Dict, work_classification: Dict, gpt_analysis: Dict) -> Dict[str, Any]:
        """Generate structured measurements for frontend consumption"""
        structured = {
            'rooms': [],
            'interior_items': {
                'doors': [],
                'fixed_windows': [],
                'turn_windows': [],
                'radiators': [],
                'skirting_boards': [],
                'stairs': [],
                'other_items': []
            },
            'exterior_items': {
                'doors': [],
                'fixed_windows': [],
                'turn_windows': [],
                'dormer_windows': [],
                'fascia_boards': [],
                'rain_pipe': [],
                'other_items': []
            },
            'notes': 'Generated from AI analysis'
        }
        
        # Process rooms
        if 'rooms' in surface_areas:
            for room_key, room_data in surface_areas['rooms'].items():
                room_name = room_key.replace('Room ', '').strip()
                
                # Create room structure
                room = {
                    'id': hash(room_name) % 10000,  # Simple ID generation
                    'name': room_name,
                    'walls': [],
                    'ceiling': None,
                    'other_surfaces': None,
                    'additional_items': []
                }
                
                # Add main wall if we have area data
                wall_area = room_data.get('wall_area_m2', 0)
                if wall_area > 0:
                    # Estimate dimensions
                    floor_area = room_data.get('floor_area_m2', 0)
                    if floor_area > 0:
                        # Rough square room approximation
                        side_length = math.sqrt(floor_area)
                        wall_height = 2.4
                        
                        room['walls'].append({
                            'id': hash(f"{room_name}_wall") % 10000,
                            'name': 'Main Wall Area',
                            'length': side_length * 4,  # Perimeter
                            'height': wall_height,
                            'area': wall_area,
                            'sanding_level': 'light',
                            'priming_coats': 'one_coat',
                            'painting_coats': 'two_coat'
                        })
                
                # Add ceiling if we have area data
                ceiling_area = room_data.get('ceiling_area_m2', 0)
                if ceiling_area > 0:
                    side_length = math.sqrt(ceiling_area)
                    room['ceiling'] = {
                        'width': side_length,
                        'length': side_length,
                        'area': ceiling_area,
                        'preparation_level': 'light',
                        'painting_coats': 'one_coat'
                    }
                
                structured['rooms'].append(room)
        
        # Process interior items from classification
        if 'interior_work' in work_classification:
            estimated_items = work_classification['interior_work'].get('estimated_items', {})
            
            # Add doors
            door_count = estimated_items.get('interior_doors', 0)
            for i in range(door_count):
                structured['interior_items']['doors'].append({
                    'id': 1000 + i,
                    'quantity': 1,
                    'description': f'Interior Door {i+1}',
                    'cost': 0
                })
            
            # Add windows (split between fixed and turn)
            window_count = estimated_items.get('interior_windows', 0)
            fixed_count = int(window_count * 0.6)  # 60% fixed
            turn_count = window_count - fixed_count
            
            for i in range(fixed_count):
                structured['interior_items']['fixed_windows'].append({
                    'id': 2000 + i,
                    'quantity': 1,
                    'description': f'Fixed Window {i+1}',
                    'cost': 0
                })
            
            for i in range(turn_count):
                structured['interior_items']['turn_windows'].append({
                    'id': 3000 + i,
                    'quantity': 1,
                    'description': f'Turn Window {i+1}',
                    'cost': 0
                })
            
            # Add radiators
            radiator_count = estimated_items.get('radiators', 0)
            for i in range(radiator_count):
                structured['interior_items']['radiators'].append({
                    'id': 4000 + i,
                    'quantity': 1,
                    'description': f'Radiator {i+1}',
                    'cost': 0
                })
        
        # Process exterior items from classification
        if 'exterior_work' in work_classification:
            estimated_items = work_classification['exterior_work'].get('estimated_items', {})
            
            # Add exterior doors
            ext_door_count = estimated_items.get('exterior_doors', 0)
            for i in range(ext_door_count):
                structured['exterior_items']['doors'].append({
                    'id': 5000 + i,
                    'quantity': 1,
                    'description': f'Exterior Door {i+1}',
                    'cost': 0
                })
            
            # Add exterior windows
            ext_window_count = estimated_items.get('exterior_windows', 0)
            for i in range(int(ext_window_count * 0.7)):  # 70% fixed
                structured['exterior_items']['fixed_windows'].append({
                    'id': 6000 + i,
                    'quantity': 1,
                    'description': f'Exterior Fixed Window {i+1}',
                    'cost': 0
                })
            
            for i in range(int(ext_window_count * 0.3)):  # 30% turn
                structured['exterior_items']['turn_windows'].append({
                    'id': 7000 + i,
                    'quantity': 1,
                    'description': f'Exterior Turn Window {i+1}',
                    'cost': 0
                })
        
        return structured
    
    def _upload_image_with_fallbacks(self, image_path: str) -> str:
        """Upload image with multiple fallback methods"""
        if not os.path.isfile(image_path):
            raise FileNotFoundError(f"File not found: '{image_path}'.")
        
        try:
            import base64
            import mimetypes
            
            with open(image_path, "rb") as img_file:
                img_data = img_file.read()
                img_b64 = base64.b64encode(img_data).decode('utf-8')
                
                mime_type, _ = mimetypes.guess_type(image_path)
                if not mime_type:
                    mime_type = "image/png"
                
                data_url = f"data:{mime_type};base64,{img_b64}"
                self.logger.info(f"✅ Data URL created (length: {len(data_url)} chars)")
                return data_url
                
        except Exception as e:
            self.logger.error(f"❌ Image upload failed: {e}")
            raise RuntimeError(f"Image upload failed: {e}")
    
    def _detect_with_gradio_api(self, image_path: str) -> Dict[str, Any]:
        """Detect elements using Gradio API (if available)"""
        try:
            detection_client = Client("RasterScan/Automated-Floor-Plan-Digitalization")
            image_input = handle_file(image_path)
            detection_result = detection_client.predict(file=image_input, api_name="/run")
            
            if len(detection_result) > 1 and detection_result[1]:
                return detection_result[1]
            else:
                return {"walls": [], "doors": [], "windows": [], "rooms": []}
                
        except Exception as e:
            self.logger.warning(f"Gradio API detection failed: {e}")
            return {"walls": [], "doors": [], "windows": [], "rooms": []}
    
    # Helper methods from the original implementation
    def _clean_room_name(self, line: str, room_type: str) -> str:
        """Clean and format room name"""
        # Simple extraction - you can enhance this
        if room_type in line:
            parts = line.split(room_type)
            if len(parts) > 1:
                prefix = parts[0].strip()
                if prefix and len(prefix) < 20:
                    return f"{prefix} {room_type}".title()
        return room_type.title()
    
    def _extract_size_from_line(self, line: str) -> Optional[str]:
        """Extract size information from a line of text"""
        import re
        # Look for measurements like "3.5m x 4.2m" or "15 square meters"
        size_patterns = [
            r'(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*m',
            r'(\d+\.?\d*)\s*square\s*meters?',
            r'(\d+\.?\d*)\s*m²'
        ]
        
        for pattern in size_patterns:
            match = re.search(pattern, line.lower())
            if match:
                return match.group(0)
        return None
    
    def _estimate_room_work(self, room: Dict, surface_data: Optional[Dict]) -> Dict:
        """Estimate work required for a room"""
        work = {
            'wall_painting': True,
            'ceiling_painting': True,
            'special_requirements': []
        }
        
        room_type = room.get('type', '').lower()
        
        # Add special requirements based on room type
        if room_type in ['bathroom', 'kitchen']:
            work['special_requirements'].append('Moisture-resistant paint required')
        
        if room_type in ['living room', 'dining room']:
            work['special_requirements'].append('High-quality finish for main living areas')
        
        if 'ceiling fan' in str(room.get('features', [])):
            work['special_requirements'].append('Work around ceiling fan')
        
        return work
    
    def _estimate_skirting_length(self, surface_areas: Dict) -> float:
        """Estimate total skirting board length"""
        total_perimeter = 0
        if 'rooms' in surface_areas:
            for room_data in surface_areas['rooms'].values():
                floor_area = room_data.get('floor_area_m2', 0)
                if floor_area > 0:
                    # Rough perimeter calculation for square room
                    perimeter = 4 * math.sqrt(floor_area)
                    total_perimeter += perimeter
        return total_perimeter
    
    def _estimate_exterior_wall_area(self, wall_description: str) -> float:
        """Estimate exterior wall area from description"""
        # This is a rough estimation - in practice you'd need more sophisticated analysis
        if 'large' in wall_description.lower():
            return 25.0
        elif 'small' in wall_description.lower():
            return 10.0
        else:
            return 15.0
    
    def _estimate_trim_length(self, trim_description: str) -> float:
        """Estimate trim length from description"""
        if 'fascia' in trim_description.lower():
            return 20.0  # Rough estimate for fascia boards
        elif 'soffit' in trim_description.lower():
            return 15.0
        else:
            return 10.0
    
    def _process_enhanced_measurements(self, detection_results: Dict, gpt_analysis: Dict, results_dir: str) -> Dict[str, Any]:
        """Process and calculate measurements from detection results and GPT analysis"""
        walls = detection_results.get("walls", [])
        doors = detection_results.get("doors", [])
        windows = detection_results.get("windows", [])
        rooms = detection_results.get("rooms", [])
        
        # Calculate wall lengths
        wall_lengths = {}
        for i, wall in enumerate(walls, 1):
            pos = wall.get("position", [])
            if len(pos) >= 2:
                length = self._calculate_wall_length(pos)
                wall_lengths[f"wall_{i}"] = length
        
        # Associate openings with walls
        openings_by_wall = self._associate_openings_to_walls(doors + windows, walls)
        
        # Calculate effective wall lengths (minus openings)
        effective_wall_lengths = {}
        for wall_id, total_length in wall_lengths.items():
            wall_num = int(wall_id.split('_')[1])
            opening_length = openings_by_wall.get(wall_num, 0.0)
            effective_wall_lengths[wall_id] = max(0.0, total_length - opening_length)
        
        # Add GPT-derived measurements
        gpt_measurements = gpt_analysis.get('measurements', {})
        
        # Generate visualizations
        self._generate_measurement_visualizations(
            walls, rooms, wall_lengths, results_dir
        )
        
        return {
            "wall_lengths": wall_lengths,
            "effective_wall_lengths": effective_wall_lengths,
            "openings_by_wall": openings_by_wall,
            "gpt_measurements": gpt_measurements,
            "total_walls": len(walls),
            "total_doors": len(doors),
            "total_windows": len(windows),
            "total_rooms": len(rooms),
            "room_count_from_gpt": len(gpt_analysis.get('room_details', []))
        }
    
    def _calculate_comprehensive_surface_areas_with_classification(self, detection_results: Dict, measurements: Dict, gpt_analysis: Dict) -> Dict[str, Any]:
        """Calculate comprehensive surface areas with room classification"""
        rooms = detection_results.get("rooms", [])
        walls = detection_results.get("walls", [])
        
        # Determine scale factor (you might want to make this configurable)
        scale_factor = 0.02  # meters per pixel (default)
        
        room_surface_data = {}
        
        # Use GPT analysis for better room naming and classification
        gpt_rooms = gpt_analysis.get('room_details', [])
        
        for idx, room_data in enumerate(rooms, 1):
            # Try to match with GPT analysis for better naming
            room_name = f"Room {idx}"
            room_type = "general"
            
            if idx <= len(gpt_rooms):
                gpt_room = gpt_rooms[idx - 1]
                room_name = gpt_room.get('name', room_name)
                room_type = gpt_room.get('type', room_type)
            
            # Extract room polygon
            if isinstance(room_data, list):
                room_points = [(pt.get("x", 0), pt.get("y", 0)) for pt in room_data]
            else:
                room_points = []
            
            if len(room_points) >= 3:
                # Calculate floor area
                floor_area_px = self._polygon_area(room_points)
                floor_area_m2 = floor_area_px * (scale_factor ** 2)
                
                # Calculate perimeter
                perimeter_px = self._calculate_polygon_perimeter(room_points)
                perimeter_m = perimeter_px * scale_factor
                
                # Calculate wall and ceiling areas
                wall_area_m2 = perimeter_m * self.WALL_HEIGHT
                ceiling_area_m2 = floor_area_m2
                
                # Adjust areas based on room type
                if room_type in ['bathroom', 'kitchen']:
                    # Typically have tiled areas that reduce paintable surface
                    wall_area_m2 *= 0.7  # 30% reduction for tiles
                
                room_surface_data[room_name] = {
                    "floor_area_m2": round(floor_area_m2, 2),
                    "ceiling_area_m2": round(ceiling_area_m2, 2),
                    "wall_area_m2": round(wall_area_m2, 2),
                    "perimeter_m": round(perimeter_m, 2),
                    "room_type": room_type,
                    "room_polygon": room_points,
                    "special_considerations": self._get_room_considerations(room_type)
                }
        
        # If no rooms detected from image analysis, use GPT analysis
        if not room_surface_data and gpt_rooms:
            for idx, gpt_room in enumerate(gpt_rooms, 1):
                room_name = gpt_room.get('name', f"Room {idx}")
                room_type = gpt_room.get('type', 'general')
                
                # Estimate dimensions from GPT analysis
                estimated_area = self._estimate_area_from_description(gpt_room)
                
                if estimated_area > 0:
                    perimeter_m = 4 * math.sqrt(estimated_area)  # Square approximation
                    wall_area_m2 = perimeter_m * self.WALL_HEIGHT
                    
                    room_surface_data[room_name] = {
                        "floor_area_m2": round(estimated_area, 2),
                        "ceiling_area_m2": round(estimated_area, 2),
                        "wall_area_m2": round(wall_area_m2, 2),
                        "perimeter_m": round(perimeter_m, 2),
                        "room_type": room_type,
                        "estimated": True,
                        "special_considerations": self._get_room_considerations(room_type)
                    }
        
        # Calculate totals
        total_floor_area = sum(room["floor_area_m2"] for room in room_surface_data.values())
        total_ceiling_area = sum(room["ceiling_area_m2"] for room in room_surface_data.values())
        total_wall_area = sum(room["wall_area_m2"] for room in room_surface_data.values())
        
        return {
            "rooms": room_surface_data,
            "totals": {
                "total_floor_area_m2": round(total_floor_area, 2),
                "total_ceiling_area_m2": round(total_ceiling_area, 2),
                "total_wall_area_m2": round(total_wall_area, 2),
                "total_rooms": len(room_surface_data)
            },
            "scale_factor": scale_factor,
            "constants": {
                "wall_height_m": self.WALL_HEIGHT,
                "ceiling_height_m": self.CEILING_HEIGHT
            },
            "analysis_source": "hybrid_gpt_detection"
        }
    
    def _get_room_considerations(self, room_type: str) -> List[str]:
        """Get special considerations for different room types"""
        considerations = []
        
        if room_type in ['bathroom', 'kitchen']:
            considerations.extend([
                'Moisture-resistant paint required',
                'May have tiled areas reducing paintable surface',
                'Extra ventilation needed during painting'
            ])
        
        if room_type in ['living room', 'dining room']:
            considerations.extend([
                'High-quality finish required for main living areas',
                'Consider primer for color changes',
                'Minimal disruption scheduling important'
            ])
        
        if room_type == 'bedroom':
            considerations.extend([
                'Low-VOC paint preferred for sleeping areas',
                'Consider scheduling during daytime'
            ])
        
        if room_type in ['office', 'study']:
            considerations.extend([
                'Durable finish for high-use areas',
                'Consider neutral colors for productivity'
            ])
        
        return considerations
    
    def _estimate_area_from_description(self, room_info: Dict) -> float:
        """Estimate room area from GPT description"""
        estimated_size = room_info.get('estimated_size', '')
        
        if estimated_size:
            # Try to extract numerical values
            import re
            numbers = re.findall(r'(\d+\.?\d*)', estimated_size)
            if len(numbers) >= 2:
                # Assume length x width
                return float(numbers[0]) * float(numbers[1])
            elif len(numbers) == 1:
                # Assume square area
                side = float(numbers[0])
                return side * side
        
        # Default estimates based on room type
        room_type = room_info.get('type', '').lower()
        default_areas = {
            'bedroom': 12.0,
            'bathroom': 6.0,
            'kitchen': 10.0,
            'living room': 20.0,
            'dining room': 15.0,
            'office': 10.0,
            'closet': 3.0,
            'hallway': 8.0,
            'utility': 5.0
        }
        
        return default_areas.get(room_type, 10.0)  # Default 10 sq meters
    
    def _generate_enhanced_reports(self, gpt_analysis: Dict, detection_results: Dict, measurements: Dict, 
                                 surface_areas: Dict, work_classification: Dict, structured_measurements: Dict, results_dir: str) -> Dict[str, str]:
        """Generate comprehensive reports and save to files"""
        reports = {}
        
        # Generate enhanced summary report
        summary_report = self._generate_enhanced_summary_report(
            gpt_analysis, detection_results, measurements, surface_areas, work_classification
        )
        
        summary_file = os.path.join(results_dir, "enhanced_summary_report.json")
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary_report, f, indent=4, ensure_ascii=False)
        
        reports["summary_report"] = summary_file
        
        # Generate work classification report
        classification_file = os.path.join(results_dir, "work_classification.json")
        with open(classification_file, "w", encoding="utf-8") as f:
            json.dump(work_classification, f, indent=4, ensure_ascii=False)
        
        reports["work_classification"] = classification_file
        
        # Generate structured measurements for frontend
        measurements_file = os.path.join(results_dir, "structured_measurements.json")
        with open(measurements_file, "w", encoding="utf-8") as f:
            json.dump(structured_measurements, f, indent=4, ensure_ascii=False)
        
        reports["structured_measurements"] = measurements_file
        
        # Generate detailed surface areas report
        surface_areas_file = os.path.join(results_dir, "detailed_surface_areas.json")
        with open(surface_areas_file, "w", encoding="utf-8") as f:
            json.dump({
                "surface_areas": surface_areas,
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_method": "Enhanced GPT-4 Vision + Gradio API"
            }, f, indent=4, ensure_ascii=False)
        
        reports["surface_areas_report"] = surface_areas_file
        
        return reports
    
    def _generate_enhanced_summary_report(self, gpt_analysis: Dict, detection_results: Dict, 
                                        measurements: Dict, surface_areas: Dict, work_classification: Dict) -> Dict:
        """Generate a comprehensive enhanced summary report"""
        return {
            "analysis_summary": {
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_method": "Enhanced GPT-4 Vision + Gradio API",
                "rooms_detected": surface_areas["totals"]["total_rooms"],
                "walls_detected": measurements.get("total_walls", 0),
                "doors_detected": measurements.get("total_doors", 0),
                "windows_detected": measurements.get("total_windows", 0),
                "gpt_rooms_identified": measurements.get("room_count_from_gpt", 0)
            },
            "surface_area_summary": surface_areas["totals"],
            "room_breakdown": surface_areas["rooms"],
            "work_classification": {
                "interior_rooms": len(work_classification.get("interior_work", {}).get("rooms", {})),
                "exterior_features": len(work_classification.get("exterior_work", {}).get("walls", [])),
                "estimated_interior_items": work_classification.get("interior_work", {}).get("estimated_items", {}),
                "estimated_exterior_items": work_classification.get("exterior_work", {}).get("estimated_items", {})
            },
            "gpt_insights": {
                "room_details_found": len(gpt_analysis.get("room_details", [])),
                "interior_features_identified": len(gpt_analysis.get("interior_features", {}).get("walls", [])),
                "exterior_features_identified": len(gpt_analysis.get("exterior_features", {}).get("walls", [])),
                "analysis_notes": gpt_analysis.get("full_analysis", "")[:500] + "..." if len(gpt_analysis.get("full_analysis", "")) > 500 else gpt_analysis.get("full_analysis", "")
            },
            "technical_details": {
                "scale_factor": surface_areas["scale_factor"],
                "wall_height_m": surface_areas["constants"]["wall_height_m"],
                "ceiling_height_m": surface_areas["constants"]["ceiling_height_m"],
                "analysis_source": surface_areas.get("analysis_source", "unknown")
            },
            "recommendations": self._generate_work_recommendations(work_classification, surface_areas)
        }
    
    def _generate_work_recommendations(self, work_classification: Dict, surface_areas: Dict) -> List[str]:
        """Generate work recommendations based on analysis"""
        recommendations = []
        
        total_area = surface_areas.get("totals", {}).get("total_wall_area_m2", 0)
        
        if total_area > 100:
            recommendations.append("Large project - consider scheduling over multiple days")
        
        if total_area < 20:
            recommendations.append("Small project - suitable for single day completion")
        
        # Room-specific recommendations
        rooms = surface_areas.get("rooms", {})
        for room_name, room_data in rooms.items():
            room_type = room_data.get("room_type", "")
            considerations = room_data.get("special_considerations", [])
            
            if considerations:
                recommendations.append(f"{room_name}: {'; '.join(considerations)}")
        
        # Interior/exterior work recommendations
        interior_work = work_classification.get("interior_work", {})
        exterior_work = work_classification.get("exterior_work", {})
        
        if interior_work.get("rooms"):
            recommendations.append("Interior work identified - ensure proper ventilation and dust protection")
        
        if exterior_work.get("walls") or exterior_work.get("estimated_items"):
            recommendations.append("Exterior work identified - check weather conditions and use weather-resistant paints")
        
        return recommendations
    
    # Include remaining helper methods from original implementation
    def _calculate_wall_length(self, wall_position) -> float:
        """Calculate the length of a wall given its position coordinates"""
        if len(wall_position) < 2:
            return 0.0
        (x1, y1), (x2, y2) = wall_position[0], wall_position[1]
        return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    def _polygon_area(self, points) -> float:
        """Calculate the area of a polygon using the shoelace formula"""
        if len(points) < 3:
            return 0.0
        area = 0.0
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            area += points[i][0] * points[j][1] - points[j][0] * points[i][1]
        return abs(area) / 2.0
    
    def _calculate_polygon_perimeter(self, points) -> float:
        """Calculate the perimeter of a polygon"""
        if len(points) < 2:
            return 0.0
        perimeter = 0.0
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            dx = points[j][0] - points[i][0]
            dy = points[j][1] - points[i][1]
            perimeter += math.sqrt(dx * dx + dy * dy)
        return perimeter
    
    def _extract_measurements(self, text: str) -> dict:
        """Extract measurements from GPT analysis text"""
        import re
        # Pattern to find measurements like "3.5m", "2.4 meters", etc.
        pattern = r'(\d+(?:\.\d+)?)\s*(?:m|meters?|metre?s?)'
        matches = re.findall(pattern, text)
        
        measurements = {}
        for i, match in enumerate(matches):
            measurements[f"measurement_{i+1}"] = {
                "value": float(match),
                "unit": "meters",
                "description": f"Extracted measurement {i+1}"
            }
        
        return measurements
    
    def _associate_openings_to_walls(self, openings: list, walls: list, distance_threshold: float = 10) -> dict:
        """Associate door and window openings to walls"""
        openings_sum = {}
        
        for opening in openings:
            bbox_points = opening.get("bbox", [])
            if not bbox_points:
                continue
            
            # Calculate opening center
            xs = [p[0] for p in bbox_points]
            ys = [p[1] for p in bbox_points]
            cx, cy = sum(xs)/len(xs), sum(ys)/len(ys)
            
            # Find closest wall
            best_wall = None
            best_distance = float('inf')
            best_length = 0.0
            
            for i, wall in enumerate(walls, start=1):
                pos = wall.get("position", [])
                if len(pos) < 2:
                    continue
                
                p1, p2 = pos[0], pos[1]
                dist = self._point_to_segment_distance((cx, cy), p1, p2)
                
                if dist < best_distance and dist <= distance_threshold:
                    best_distance = dist
                    best_wall = i
                    # Calculate opening length along wall
                    best_length = self._get_bbox_length_along_wall(bbox_points, p1, p2)
            
            if best_wall is not None:
                openings_sum[best_wall] = openings_sum.get(best_wall, 0.0) + best_length
        
        return openings_sum
    
    def _point_to_segment_distance(self, point, seg_start, seg_end) -> float:
        """Calculate distance from point to line segment"""
        x0, y0 = point
        x1, y1 = seg_start
        x2, y2 = seg_end
        dx = x2 - x1
        dy = y2 - y1
        if dx == 0 and dy == 0:
            return math.sqrt((x0 - x1)**2 + (y0 - y1)**2)
        t = ((x0 - x1)*dx + (y0 - y1)*dy) / (dx*dx + dy*dy)
        t = max(0, min(1, t))
        nearest_x = x1 + t * dx
        nearest_y = y1 + t * dy
        return math.sqrt((x0 - nearest_x)**2 + (y0 - nearest_y)**2)
    
    def _get_bbox_length_along_wall(self, bbox_points, p1, p2) -> float:
        """Calculate length of bounding box along wall direction"""
        wx = p2[0] - p1[0]
        wy = p2[1] - p1[1]
        wall_len = math.sqrt(wx**2 + wy**2)
        if wall_len == 0:
            return 0.0
        ux, uy = wx / wall_len, wy / wall_len
        projections = []
        for (px, py) in bbox_points:
            dx, dy = px - p1[0], py - p1[1]
            projections.append(dx * ux + dy * uy)
        return max(projections) - min(projections) if projections else 0.0
    
    def _generate_measurement_visualizations(self, walls, rooms, wall_lengths, results_dir):
        """Generate visualization diagrams"""
        try:
            # Generate simple wall diagram
            self._draw_wall_diagram(walls, wall_lengths, results_dir)
            
            # Generate room layout diagram
            self._draw_room_diagram(rooms, results_dir)
            
        except Exception as e:
            self.logger.warning(f"Failed to generate visualizations: {e}")
    
    def _draw_wall_diagram(self, walls, wall_lengths, results_dir):
        """Draw a simple wall diagram"""
        try:
            from PIL import Image, ImageDraw
            
            all_x, all_y = [], []
            for wall in walls:
                pos = wall.get("position", [])
                if len(pos) >= 2:
                    x1, y1 = pos[0]
                    x2, y2 = pos[1]
                    all_x.extend([x1, x2])
                    all_y.extend([y1, y2])
            
            if not all_x or not all_y:
                return
            
            min_x, max_x = min(all_x), max(all_x)
            min_y, max_y = min(all_y), max(all_y)
            W = int(max_x - min_x + 200)
            H = int(max_y - min_y + 200)
            offset_x = -min_x + 100
            offset_y = -min_y + 100
            
            im = Image.new("RGB", (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(im)
            
            # Draw walls
            for i, wall in enumerate(walls, start=1):
                pos = wall.get("position", [])
                if len(pos) >= 2:
                    (x1, y1), (x2, y2) = pos[0], pos[1]
                    sx1, sy1 = x1 + offset_x, y1 + offset_y
                    sx2, sy2 = x2 + offset_x, y2 + offset_y
                    draw.line([(sx1, sy1), (sx2, sy2)], fill="black", width=3)
                    
                    # Add wall label
                    mx, my = (sx1 + sx2) / 2, (sy1 + sy2) / 2
                    draw.text((mx, my), f"W{i}", fill="red", anchor="mm")
            
            wall_diagram_path = os.path.join(results_dir, "enhanced_wall_diagram.png")
            im.save(wall_diagram_path)
            
        except Exception as e:
            self.logger.warning(f"Failed to draw wall diagram: {e}")
    
    def _draw_room_diagram(self, rooms, results_dir):
        """Draw a simple room layout diagram"""
        try:
            from PIL import Image, ImageDraw
            
            if not rooms:
                return
            
            # Find bounds
            all_x, all_y = [], []
            for room in rooms:
                if isinstance(room, list):
                    for point in room:
                        x = point.get("x", 0)
                        y = point.get("y", 0)
                        all_x.append(x)
                        all_y.append(y)
            
            if not all_x or not all_y:
                return
            
            min_x, max_x = min(all_x), max(all_x)
            min_y, max_y = min(all_y), max(all_y)
            W = int(max_x - min_x + 200)
            H = int(max_y - min_y + 200)
            offset_x = -min_x + 100
            offset_y = -min_y + 100
            
            im = Image.new("RGB", (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(im)
            
            # Draw rooms
            colors = self._generate_colors(len(rooms))
            for i, room in enumerate(rooms):
                if isinstance(room, list) and len(room) >= 3:
                    points = [(point.get("x", 0) + offset_x, point.get("y", 0) + offset_y) for point in room]
                    color = colors.get(i + 1, (100, 100, 100))
                    draw.polygon(points, outline=color, width=2)
                    
                    # Add room label
                    center_x = sum(p[0] for p in points) / len(points)
                    center_y = sum(p[1] for p in points) / len(points)
                    draw.text((center_x, center_y), f"Room {i+1}", fill="black", anchor="mm")
            
            room_diagram_path = os.path.join(results_dir, "enhanced_room_diagram.png")
            im.save(room_diagram_path)
            
        except Exception as e:
            self.logger.warning(f"Failed to draw room diagram: {e}")
    
    def _generate_colors(self, count):
        """Generate distinct colors for visualization"""
        if count < 1:
            return {}
        colors = {}
        for i in range(1, count + 1):
            hue = i / count
            r, g, b = colorsys.hls_to_rgb(hue, 0.5, 0.9)
            colors[i] = (int(r * 255), int(g * 255), int(b * 255))
        return colors