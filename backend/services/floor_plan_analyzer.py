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
    """Enhanced floor plan analyzer with detailed room measurements"""
    
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
        
        # Room types for identification
        self.ROOM_TYPES = [
            'bedroom', 'bathroom', 'kitchen', 'living room', 'dining room',
            'office', 'study', 'closet', 'pantry', 'laundry', 'utility',
            'hallway', 'corridor', 'foyer', 'entrance', 'family room'
        ]
    
    def process_floor_plan(self, image_path: str, results_dir: str, analysis_id: str) -> Dict[str, Any]:
        """Process floor plan with enhanced room measurements"""
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
            
             # Step 2: Enhanced GPT-4 Vision analysis with detailed measurements
            self.logger.info("🤖 Step 2: Enhanced GPT-4 Vision analysis (FRESH)...")
            gpt_analysis = self._analyze_with_detailed_gpt4_vision(original_image_link)
            
            # Step 3: Generate structured measurements with detailed room data
            self.logger.info("📋 Step 3: Generating FRESH structured measurements...")
            structured_measurements = self._generate_detailed_structured_measurements(gpt_analysis)

            # Ensure fresh data by adding timestamp
            structured_measurements['analysis_timestamp'] = datetime.utcnow().isoformat()
            structured_measurements['fresh_analysis'] = True
                
            # Step 4: Validate and ensure consistency
            self.logger.info("✅ Step 4: Validating measurements...")
            validated_measurements = self._validate_and_normalize_measurements(structured_measurements)
            
            # Step 5: Generate reports
            self.logger.info("📋 Step 5: Generating reports...")
            reports = self._generate_reports(gpt_analysis, validated_measurements, results_dir)
            
            # Compile final results
            results = {
                "status": "success",
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat(),
                "gpt_analysis": gpt_analysis,
                "structured_measurements": validated_measurements,
                "reports": reports,
                "original_image_link": original_image_link
            }
            
            # Save complete results
            results_file = os.path.join(results_dir, "analysis_results.json")
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
    
    def _analyze_with_detailed_gpt4_vision(self, image_url: str) -> Dict[str, Any]:
        """Enhanced GPT-4 Vision analysis with detailed room measurements ONLY"""
        prompt = """
        Analyze this floor plan image and provide DETAILED MEASUREMENTS for each room. Focus ONLY on physical measurements - do NOT suggest any treatments or work recommendations.

        For each room, I need ONLY:

        1. ROOM IDENTIFICATION:
           - Room name and type (bedroom, bathroom, kitchen, etc.)
           - Approximate dimensions (length x width in meters)

        2. DETAILED WALL MEASUREMENTS:
           - Individual wall segments with their lengths and heights
           - Total wall area for each room (excluding doors/windows)
           - Wall height (assume 2.4m if not specified)

        3. CEILING MEASUREMENTS:
           - Ceiling dimensions (length x width in meters)
           - Total ceiling area

        4. ROOM CALCULATIONS:
           - Floor area (length x width)
           - Perimeter calculation
           - Any architectural features to note

        Please provide measurements in this exact format for each room:

        Room 1: [Room Name] ([Room Type])
        - Dimensions: [length]m x [width]m
        - Floor Area: [area] m²
        - Wall Height: 2.4m
        - Total Wall Area: [wall_area] m²
        - Ceiling Area: [ceiling_area] m²
        - Wall Segments:
          * North Wall: [length]m x 2.4m = [area] m²
          * South Wall: [length]m x 2.4m = [area] m²
          * East Wall: [length]m x 2.4m = [area] m²
          * West Wall: [length]m x 2.4m = [area] m²

        IMPORTANT: 
        - Provide ONLY measurements and dimensions
        - Do NOT suggest any treatments, coatings, or work recommendations
        - Do NOT mention sanding, priming, painting, or any surface treatments
        - Focus purely on physical measurements and room identification

        Be as precise as possible with measurements. If you can't determine exact dimensions, provide reasonable estimates based on typical room proportions.
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
                max_tokens=2000,
                temperature=0.1  # Lower temperature for more consistent results
            )
            
            analysis_text = response.choices[0].message.content
            room_details = self._extract_detailed_room_data(analysis_text)
            
            return {
                "full_analysis": analysis_text,
                "room_details": room_details,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Enhanced GPT-4 Vision analysis failed: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _extract_detailed_room_data(self, analysis_text: str) -> List[Dict]:
        """Extract detailed room data from GPT analysis"""
        import re
        
        rooms = []
        lines = analysis_text.split('\n')
        current_room = None
        
        for line in lines:
            line = line.strip()
            
            # Match room header: "Room 1: Living Room (living room)"
            room_match = re.match(r'Room\s+\d+:\s*(.+?)\s*\((.+?)\)', line)
            if room_match:
                if current_room:
                    rooms.append(current_room)
                
                room_name = room_match.group(1).strip()
                room_type = room_match.group(2).strip()
                
                current_room = {
                    'id': len(rooms) + 1,
                    'name': room_name,
                    'type': room_type,
                    'dimensions': {'length': 0, 'width': 0},
                    'floor_area': 0,
                    'wall_height': 2.4,
                    'total_wall_area': 0,
                    'ceiling_area': 0,
                    'walls': []
                }
                continue
            
            if current_room:
                # Extract dimensions
                dim_match = re.search(r'Dimensions:\s*(\d+\.?\d*)m?\s*x\s*(\d+\.?\d*)m?', line)
                if dim_match:
                    current_room['dimensions']['length'] = float(dim_match.group(1))
                    current_room['dimensions']['width'] = float(dim_match.group(2))
                    current_room['floor_area'] = current_room['dimensions']['length'] * current_room['dimensions']['width']
                    current_room['ceiling_area'] = current_room['floor_area']
                
                # Extract total wall area
                wall_area_match = re.search(r'Total Wall Area:\s*(\d+\.?\d*)\s*m²?', line)
                if wall_area_match:
                    current_room['total_wall_area'] = float(wall_area_match.group(1))
                
                # Extract individual walls
                wall_match = re.search(r'\*\s*(\w+)\s*Wall:\s*(\d+\.?\d*)m?\s*x\s*(\d+\.?\d*)m?\s*=\s*(\d+\.?\d*)\s*m²?', line)
                if wall_match:
                    wall_name = wall_match.group(1)
                    wall_length = float(wall_match.group(2))
                    wall_height = float(wall_match.group(3))
                    wall_area = float(wall_match.group(4))
                    
                    # AI provides measurements only - no treatment recommendations
                    current_room['walls'].append({
                        'id': len(current_room['walls']) + 1,
                        'name': f"{wall_name} Wall",
                        'length': wall_length,
                        'height': wall_height,
                        'area': wall_area
                        # No treatment fields - user will input these manually
                    })
        
        # Add the last room
        if current_room:
            rooms.append(current_room)
        
        # Validate and fill missing data
        for room in rooms:
            # If no individual walls but have total wall area, create a summary wall
            if not room['walls'] and room['total_wall_area'] > 0:
                room['walls'].append({
                    'id': 1,
                    'name': 'Total Wall Area',
                    'length': 0,
                    'height': room['wall_height'],
                    'area': room['total_wall_area']
                    # No treatment fields - user will select these
                })
            
            # Calculate perimeter if we have dimensions
            if room['dimensions']['length'] > 0 and room['dimensions']['width'] > 0:
                perimeter = 2 * (room['dimensions']['length'] + room['dimensions']['width'])
                
                # If we don't have total wall area, estimate it
                if room['total_wall_area'] == 0:
                    room['total_wall_area'] = perimeter * room['wall_height']
                
                # If we have a summary wall, calculate its equivalent length
                if room['walls'] and room['walls'][0]['length'] == 0:
                    room['walls'][0]['length'] = room['total_wall_area'] / room['wall_height']
        
        return rooms
    
    def _generate_detailed_structured_measurements(self, gpt_analysis: Dict) -> Dict[str, Any]:
        """Generate detailed structured measurements compatible with frontend"""
        structured = {
            'rooms': [],
            'notes': 'Generated from enhanced AI analysis with detailed room measurements'
        }
        
        if 'room_details' in gpt_analysis:
            for room_data in gpt_analysis['room_details']:
                # Create room structure compatible with RoomMeasurements component
                room = {
                    'id': room_data['id'],
                    'name': room_data['name'],
                    'type': room_data['type'],
                    'walls': [],
                    'ceiling': {
                        'length': room_data['dimensions']['length'],
                        'width': room_data['dimensions']['width'],
                        'area': room_data['ceiling_area']
                        # No treatment fields - user will select these manually
                    },
                    'other_surfaces': None
                }
                
                # Add walls with proper structure
                for wall_data in room_data['walls']:
                    wall = {
                        'id': wall_data['id'],
                        'name': wall_data['name'],
                        'length': wall_data['length'],
                        'height': wall_data['height'],
                        'area': wall_data['area']
                        # No treatment fields - user will select these manually
                    }
                    room['walls'].append(wall)
                
                structured['rooms'].append(room)
        
        return structured
    
    def _validate_and_normalize_measurements(self, measurements: Dict) -> Dict:
        """Validate and normalize measurements for consistency"""
        validated = measurements.copy()
        
        for room in validated['rooms']:
            # Ensure all required fields exist
            if 'walls' not in room:
                room['walls'] = []
            
            if 'ceiling' not in room or not room['ceiling']:
                room['ceiling'] = {
                    'length': 0,
                    'width': 0,
                    'area': 0
                }
            
            # Validate wall measurements
            for wall in room['walls']:
                # Ensure area consistency
                if wall['length'] > 0 and wall['height'] > 0:
                    calculated_area = wall['length'] * wall['height']
                    # Allow 5% tolerance for rounding
                    if abs(wall['area'] - calculated_area) > calculated_area * 0.05:
                        wall['area'] = calculated_area
            
            # Validate ceiling measurements
            ceiling = room['ceiling']
            if ceiling['length'] > 0 and ceiling['width'] > 0:
                calculated_area = ceiling['length'] * ceiling['width']
                if abs(ceiling['area'] - calculated_area) > calculated_area * 0.05:
                    ceiling['area'] = calculated_area
        
        return validated
    
    def _generate_reports(self, gpt_analysis: Dict, structured_measurements: Dict, results_dir: str) -> Dict[str, str]:
        """Generate detailed reports"""
        reports = {}
        
        # Generate summary report
        total_rooms = len(structured_measurements.get('rooms', []))
        total_wall_area = sum(
            sum(wall['area'] for wall in room['walls'])
            for room in structured_measurements.get('rooms', [])
        )
        total_ceiling_area = sum(
            room['ceiling']['area']
            for room in structured_measurements.get('rooms', [])
            if room.get('ceiling')
        )
        
        summary_report = {
            "analysis_summary": {
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_method": "Enhanced GPT-4 Vision",
                "rooms_detected": total_rooms,
                "total_wall_area_m2": round(total_wall_area, 2),
                "total_ceiling_area_m2": round(total_ceiling_area, 2),
                "total_paintable_area_m2": round(total_wall_area + total_ceiling_area, 2)
            },
            "room_breakdown": [
                {
                    "name": room['name'],
                    "type": room['type'],
                    "wall_count": len(room['walls']),
                    "total_wall_area": sum(wall['area'] for wall in room['walls']),
                    "ceiling_area": room['ceiling']['area'] if room.get('ceiling') else 0,
                    "dimensions": f"{room['ceiling']['length']}m x {room['ceiling']['width']}m" if room.get('ceiling') else "N/A"
                }
                for room in structured_measurements.get('rooms', [])
            ],
            "notes": "Enhanced analysis with detailed wall and ceiling measurements - treatments to be selected by user"
        }
        
        summary_file = os.path.join(results_dir, "summary_report.json")
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary_report, f, indent=4, ensure_ascii=False)
        
        reports["summary_report"] = summary_file
        
        # Generate structured measurements report
        measurements_file = os.path.join(results_dir, "structured_measurements.json")
        with open(measurements_file, "w", encoding="utf-8") as f:
            json.dump(structured_measurements, f, indent=4, ensure_ascii=False)
        
        reports["structured_measurements"] = measurements_file
        
        return reports
    
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