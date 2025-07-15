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
    """Enhanced floor plan analyzer with total wall area per room"""
    
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
        """Process floor plan with total wall area approach"""
        self.logger.info(f"🏠 Starting floor plan analysis with total wall area approach: {analysis_id}")
        
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
            
            # Step 2: Enhanced GPT-4 Vision analysis with total wall area
            self.logger.info("🤖 Step 2: GPT-4 Vision analysis for total wall areas...")
            gpt_analysis = self._analyze_with_total_wall_area_gpt4_vision(original_image_link)
            
            # Step 3: Generate structured measurements with total wall area approach
            self.logger.info("📋 Step 3: Generating structured measurements with total wall areas...")
            structured_measurements = self._generate_total_wall_area_structured_measurements(gpt_analysis)

            # Ensure fresh data by adding timestamp
            structured_measurements['analysis_timestamp'] = datetime.utcnow().isoformat()
            structured_measurements['fresh_analysis'] = True
                
            # Step 4: Validate and ensure consistency
            self.logger.info("✅ Step 4: Validating total wall area measurements...")
            validated_measurements = self._validate_and_normalize_total_wall_area_measurements(structured_measurements)
            
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
            
            self.logger.info(f"🎉 Total wall area analysis {analysis_id} completed successfully!")
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
    
    def _analyze_with_total_wall_area_gpt4_vision(self, image_url: str) -> Dict[str, Any]:
        """GPT-4 Vision analysis with total wall area per room - IMPROVED PROMPT"""
        prompt = """
        Analyze this floor plan image and provide TOTAL WALL AREA and CEILING AREA for each room.

        For each room you identify, provide ONLY the following format:

        Room: [Room Name] ([Room Type])
        - walls_surface_m2: [total_wall_area_number]
        - area_m2: [ceiling_floor_area_number]

        EXAMPLE FORMAT:
        Room: Entree (entrance)
        - walls_surface_m2: 17.93
        - area_m2: 7.78

        Room: Eetkamer (dining room)
        - walls_surface_m2: 17.34
        - area_m2: 6.41

        Room: Woonkamer (living room)
        - walls_surface_m2: 51.19
        - area_m2: 48.29

        CALCULATION METHOD:
        1. For walls_surface_m2: Calculate room perimeter × wall height (assume 2.4m height)
        2. For area_m2: Calculate room length × width (ceiling/floor area)

        REQUIREMENTS:
        - Provide ONLY the final room measurements in the exact format shown
        - Do NOT include intermediate calculations or explanations
        - Do NOT repeat room names or create duplicates
        - Do NOT suggest any treatments or work recommendations
        - Each room should appear ONLY ONCE in your response
        - Use clear room names (Entree, Eetkamer, Woonkamer, etc.)

        Analyze the floor plan and provide measurements for each distinct room you can identify.
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
                max_tokens=1000,  # Reduced to encourage concise responses
                temperature=0.1
            )
            
            analysis_text = response.choices[0].message.content
            room_details = self._extract_total_wall_area_room_data(analysis_text)
            
            return {
                "full_analysis": analysis_text,
                "room_details": room_details,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Total wall area GPT-4 Vision analysis failed: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }  

    def _extract_total_wall_area_room_data(self, analysis_text: str) -> List[Dict]:
        """Extract total wall area room data from GPT analysis - FIXED to avoid duplicates"""
        import re
        
        rooms = []
        lines = analysis_text.split('\n')
        
        print(f"🔍 Parsing total wall area analysis text with {len(lines)} lines")
        
        # First, let's find all the properly formatted room data blocks
        room_blocks = []
        current_block = []
        in_room_block = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for the final room format: "Room: Name (type)"
            if line.startswith('Room:') and '(' in line and ')' in line:
                # Save previous block if it exists
                if current_block:
                    room_blocks.append('\n'.join(current_block))
                
                # Start new block
                current_block = [line]
                in_room_block = True
                print(f"📍 Found room block start: {line}")
                
            elif in_room_block and ('walls_surface_m2:' in line or 'area_m2:' in line):
                current_block.append(line)
                print(f"📐 Added measurement: {line}")
                
            elif in_room_block and line.startswith('Room:'):
                # New room started, save previous block
                if current_block:
                    room_blocks.append('\n'.join(current_block))
                
                # Start new block
                current_block = [line]
                print(f"📍 Found new room block: {line}")
        
        # Don't forget the last block
        if current_block:
            room_blocks.append('\n'.join(current_block))
        
        print(f"🎯 Found {len(room_blocks)} room blocks to process")
        
        # Now process each room block
        for i, block in enumerate(room_blocks):
            print(f"\n🔄 Processing room block {i+1}:")
            print(f"Block content: {block}")
            
            room_data = {
                'id': i + 1,
                'name': '',
                'type': 'general',
                'walls_surface_m2': 0,
                'area_m2': 0
            }
            
            # Extract room name and type from the first line
            first_line = block.split('\n')[0]
            room_match = re.match(r'Room:\s*(.+?)\s*\((.+?)\)', first_line, re.IGNORECASE)
            if room_match:
                room_data['name'] = room_match.group(1).strip()
                room_data['type'] = room_match.group(2).strip().lower()
                print(f"✅ Extracted: name='{room_data['name']}', type='{room_data['type']}'")
            
            # Extract measurements from the block
            walls_match = re.search(r'walls_surface_m2:\s*(\d+(?:\.\d+)?)', block, re.IGNORECASE)
            if walls_match:
                room_data['walls_surface_m2'] = float(walls_match.group(1))
                print(f"📐 Walls: {room_data['walls_surface_m2']}m²")
            
            area_match = re.search(r'area_m2:\s*(\d+(?:\.\d+)?)', block, re.IGNORECASE)
            if area_match:
                room_data['area_m2'] = float(area_match.group(1))
                print(f"📐 Ceiling: {room_data['area_m2']}m²")
            
            # Only add rooms that have valid data (name and at least one measurement > 0)
            if room_data['name'] and (room_data['walls_surface_m2'] > 0 or room_data['area_m2'] > 0):
                rooms.append(room_data)
                print(f"✅ Added room: {room_data['name']} - Walls: {room_data['walls_surface_m2']}m², Ceiling: {room_data['area_m2']}m²")
            else:
                print(f"❌ Skipped invalid room data: {room_data}")
        
        # If the block-based approach didn't work, fall back to line-by-line parsing
        if not rooms:
            print("🔄 Block parsing failed, trying alternative approach...")
            
            # Alternative: Look for standalone room entries with measurements
            for line in lines:
                line = line.strip()
                
                # Look for pattern: "### Room: Name (type)" or "Room: Name (type)"
                room_match = re.match(r'#{0,3}\s*Room:\s*(.+?)\s*\((.+?)\)', line, re.IGNORECASE)
                if room_match:
                    room_name = room_match.group(1).strip()
                    room_type = room_match.group(2).strip().lower()
                    
                    print(f"🔍 Found room: {room_name} ({room_type})")
                    
                    # Look for measurements in the next few lines
                    line_index = lines.index(line.strip())
                    walls_area = 0
                    ceiling_area = 0
                    
                    # Check next 10 lines for measurements
                    for j in range(line_index + 1, min(line_index + 11, len(lines))):
                        check_line = lines[j].strip()
                        
                        walls_match = re.search(r'walls_surface_m2:\s*(\d+(?:\.\d+)?)', check_line, re.IGNORECASE)
                        if walls_match:
                            walls_area = float(walls_match.group(1))
                            print(f"📐 Found walls: {walls_area}m²")
                        
                        area_match = re.search(r'area_m2:\s*(\d+(?:\.\d+)?)', check_line, re.IGNORECASE)
                        if area_match:
                            ceiling_area = float(area_match.group(1))
                            print(f"📐 Found ceiling: {ceiling_area}m²")
                        
                        # Stop if we hit another room
                        if 'Room:' in check_line and check_line != line:
                            break
                    
                    # Only add if we have valid measurements
                    if walls_area > 0 or ceiling_area > 0:
                        room_data = {
                            'id': len(rooms) + 1,
                            'name': room_name,
                            'type': room_type,
                            'walls_surface_m2': walls_area,
                            'area_m2': ceiling_area
                        }
                        rooms.append(room_data)
                        print(f"✅ Added room: {room_name} - Walls: {walls_area}m², Ceiling: {ceiling_area}m²")
        
        # Final validation: Remove any duplicates and empty rooms
        validated_rooms = []
        seen_names = set()
        
        for room in rooms:
            # Skip rooms with empty names or no measurements
            if not room['name'] or (room['walls_surface_m2'] == 0 and room['area_m2'] == 0):
                print(f"❌ Skipping invalid room: {room}")
                continue
            
            # Skip duplicate room names
            if room['name'] in seen_names:
                print(f"❌ Skipping duplicate room: {room['name']}")
                continue
            
            seen_names.add(room['name'])
            validated_rooms.append(room)
            print(f"✅ Validated room: {room['name']}")
        
        print(f"🎉 Successfully extracted {len(validated_rooms)} unique valid rooms")
        for room in validated_rooms:
            print(f"  - {room['name']} ({room['type']}): walls={room['walls_surface_m2']}m², ceiling={room['area_m2']}m²")
        
        return validated_rooms

    def _generate_total_wall_area_structured_measurements(self, gpt_analysis: Dict) -> Dict[str, Any]:
        """Generate structured measurements with total wall area approach"""
        structured = {
            'rooms': [],
            'notes': 'Generated from AI analysis with total wall area per room'
        }
        
        if 'room_details' in gpt_analysis:
            for room_data in gpt_analysis['room_details']:
                # Create room structure with total wall area
                room = {
                    'id': room_data['id'],
                    'name': room_data['name'],
                    'type': room_data['type'],
                    'walls_surface_m2': room_data['walls_surface_m2'],
                    'area_m2': room_data['area_m2'],
                    # Treatment selections (initially false, user will select)
                    'wall_treatments': {
                        'sanding_filling': False,
                        'priming': False,
                        'one_coat': False,
                        'two_coats': False
                    },
                    'ceiling_treatments': {
                        'sanding_filling': False,
                        'priming': False,
                        'one_coat': False,
                        'two_coats': False
                    }
                }
                
                structured['rooms'].append(room)
        
        return structured
    
    def _validate_and_normalize_total_wall_area_measurements(self, measurements: Dict) -> Dict:
        """Validate and normalize total wall area measurements"""
        validated = measurements.copy()
        
        for room in validated['rooms']:
            # Ensure all required fields exist
            if 'walls_surface_m2' not in room:
                room['walls_surface_m2'] = 0
            
            if 'area_m2' not in room:
                room['area_m2'] = 0
            
            if 'wall_treatments' not in room:
                room['wall_treatments'] = {
                    'sanding_filling': False,
                    'priming': False,
                    'one_coat': False,
                    'two_coats': False
                }
            
            if 'ceiling_treatments' not in room:
                room['ceiling_treatments'] = {
                    'sanding_filling': False,
                    'priming': False,
                    'one_coat': False,
                    'two_coats': False
                }
            
            # Ensure numeric values are valid
            room['walls_surface_m2'] = max(0, float(room['walls_surface_m2']) if room['walls_surface_m2'] else 0)
            room['area_m2'] = max(0, float(room['area_m2']) if room['area_m2'] else 0)
        
        return validated
    
    def _generate_reports(self, gpt_analysis: Dict, structured_measurements: Dict, results_dir: str) -> Dict[str, str]:
        """Generate detailed reports for total wall area approach"""
        reports = {}
        
        # Generate summary report
        total_rooms = len(structured_measurements.get('rooms', []))
        total_wall_area = sum(
            room['walls_surface_m2']
            for room in structured_measurements.get('rooms', [])
        )
        total_ceiling_area = sum(
            room['area_m2']
            for room in structured_measurements.get('rooms', [])
        )
        
        summary_report = {
            "analysis_summary": {
                "timestamp": datetime.utcnow().isoformat(),
                "analysis_method": "GPT-4 Vision with Total Wall Area",
                "rooms_detected": total_rooms,
                "total_wall_area_m2": round(total_wall_area, 2),
                "total_ceiling_area_m2": round(total_ceiling_area, 2),
                "total_paintable_area_m2": round(total_wall_area + total_ceiling_area, 2)
            },
            "room_breakdown": [
                {
                    "name": room['name'],
                    "type": room['type'],
                    "walls_surface_m2": room['walls_surface_m2'],
                    "ceiling_area_m2": room['area_m2']
                }
                for room in structured_measurements.get('rooms', [])
            ],
            "notes": "Total wall area analysis - treatments to be selected by user"
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
        




        