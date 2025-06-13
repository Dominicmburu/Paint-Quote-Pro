import os
import json
import shutil
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
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
    """Enhanced floor plan analyzer service with comprehensive surface area calculations"""
    
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
    
    def process_floor_plan(self, image_path: str, results_dir: str, analysis_id: str) -> Dict[str, Any]:
        """
        Complete floor plan processing with enhanced error handling and surface area calculations
        """
        self.logger.info(f"🏠 Starting floor plan analysis: {analysis_id}")
        
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
            
            # Step 2: GPT-4 Vision analysis
            self.logger.info("🤖 Step 2: GPT-4 Vision analysis...")
            gpt_analysis = self._analyze_with_gpt4_vision(original_image_link)
            
            # Step 3: Gradio API detection (if available)
            self.logger.info("🔍 Step 3: Advanced AI detection...")
            detection_results = self._detect_with_gradio_api(image_path)
            
            # Step 4: Process measurements and generate visualizations
            self.logger.info("📐 Step 4: Processing measurements...")
            measurements = self._process_measurements(detection_results, results_dir)
            
            # Step 5: Calculate comprehensive surface areas
            self.logger.info("📊 Step 5: Calculating surface areas...")
            surface_areas = self._calculate_comprehensive_surface_areas(
                detection_results, measurements
            )
            
            # Step 6: Generate reports and visualizations
            self.logger.info("📋 Step 6: Generating reports...")
            reports = self._generate_reports(
                gpt_analysis, detection_results, measurements, surface_areas, results_dir
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
                "reports": reports,
                "original_image_link": original_image_link
            }
            
            # Save complete results
            results_file = os.path.join(results_dir, "complete_analysis.json")
            with open(results_file, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=4, ensure_ascii=False)
            
            self.logger.info(f"🎉 Analysis {analysis_id} completed successfully!")
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
    
    def _upload_image_with_fallbacks(self, image_path: str) -> str:
        """Upload image with multiple fallback methods"""
        if not os.path.isfile(image_path):
            raise FileNotFoundError(f"File not found: '{image_path}'.")
        
        # For demo purposes, we'll create a data URL
        # In production, you'd use cloud storage services
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
    
    def _analyze_with_gpt4_vision(self, image_url: str) -> Dict[str, Any]:
        """Analyze floor plan with GPT-4 Vision"""
        prompt = """
        Analyze this floor plan image and provide detailed information:
        
        1. List all room names you can identify
        2. Identify any measurements or dimensions shown
        3. Describe the overall layout and structure
        4. Note any doors, windows, or openings
        5. Estimate room sizes if measurements are visible
        
        Provide the response in a structured format with clear sections.
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
                temperature=0.0
            )
            
            analysis_text = response.choices[0].message.content
            
            # Extract structured information
            room_names = self._extract_room_names(analysis_text)
            measurements = self._extract_measurements(analysis_text)
            
            return {
                "full_analysis": analysis_text,
                "room_names": room_names,
                "measurements": measurements,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"GPT-4 Vision analysis failed: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
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
    
    def _process_measurements(self, detection_results: Dict, results_dir: str) -> Dict[str, Any]:
        """Process and calculate measurements from detection results"""
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
        
        # Generate visualizations
        self._generate_measurement_visualizations(
            walls, rooms, wall_lengths, results_dir
        )
        
        return {
            "wall_lengths": wall_lengths,
            "effective_wall_lengths": effective_wall_lengths,
            "openings_by_wall": openings_by_wall,
            "total_walls": len(walls),
            "total_doors": len(doors),
            "total_windows": len(windows),
            "total_rooms": len(rooms)
        }
    
    def _calculate_comprehensive_surface_areas(self, detection_results: Dict, measurements: Dict) -> Dict[str, Any]:
        """Calculate comprehensive surface areas for all rooms"""
        rooms = detection_results.get("rooms", [])
        walls = detection_results.get("walls", [])
        
        # Determine scale factor (you might want to make this configurable)
        scale_factor = 0.02  # meters per pixel (default)
        
        room_surface_data = {}
        
        for idx, room_data in enumerate(rooms, 1):
            room_name = f"Room {idx}"
            
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
                
                room_surface_data[room_name] = {
                    "floor_area_m2": round(floor_area_m2, 2),
                    "ceiling_area_m2": round(ceiling_area_m2, 2),
                    "wall_area_m2": round(wall_area_m2, 2),
                    "perimeter_m": round(perimeter_m, 2),
                    "room_polygon": room_points
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
            }
        }
    
    def _generate_reports(self, gpt_analysis: Dict, detection_results: Dict, measurements: Dict, surface_areas: Dict, results_dir: str) -> Dict[str, str]:
        """Generate comprehensive reports and save to files"""
        reports = {}
        
        # Generate summary report
        summary_report = self._generate_summary_report(
            gpt_analysis, detection_results, measurements, surface_areas
        )
        
        summary_file = os.path.join(results_dir, "summary_report.json")
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary_report, f, indent=4, ensure_ascii=False)
        
        reports["summary_report"] = summary_file
        
        # Generate detailed measurements report
        measurements_file = os.path.join(results_dir, "detailed_measurements.json")
        with open(measurements_file, "w", encoding="utf-8") as f:
            json.dump({
                "measurements": measurements,
                "surface_areas": surface_areas,
                "timestamp": datetime.utcnow().isoformat()
            }, f, indent=4, ensure_ascii=False)
        
        reports["measurements_report"] = measurements_file
        
        return reports
    
    # Helper methods
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
    
    def _extract_room_names(self, text: str) -> list:
        """Extract room names from GPT analysis text"""
        # Simple extraction - you can make this more sophisticated
        import re
        room_patterns = [
            r'(?i)(bedroom|living room|kitchen|bathroom|office|study|dining room)',
            r'(?i)(lounge|hall|corridor|entrance|garage|utility)',
            r'(?i)(toilet|wc|shower|bath|ensuite|master)',
            r'(?i)(pantry|laundry|storage|closet|wardrobe)'
        ]
        
        rooms = []
        for pattern in room_patterns:
            matches = re.findall(pattern, text)
            rooms.extend(matches)
        
        return list(set(rooms))  # Remove duplicates
    
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
            
            wall_diagram_path = os.path.join(results_dir, "wall_diagram.png")
            im.save(wall_diagram_path)
            
        except Exception as e:
            self.logger.warning(f"Failed to draw wall diagram: {e}")
    
    def _draw_room_diagram(self, rooms, results_dir):
        """Draw a simple room layout diagram"""
        try:
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
            
            room_diagram_path = os.path.join(results_dir, "room_diagram.png")
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
    
    def _generate_summary_report(self, gpt_analysis, detection_results, measurements, surface_areas):
        """Generate a comprehensive summary report"""
        return {
            "analysis_summary": {
                "timestamp": datetime.utcnow().isoformat(),
                "rooms_detected": surface_areas["totals"]["total_rooms"],
                "walls_detected": measurements.get("total_walls", 0),
                "doors_detected": measurements.get("total_doors", 0),
                "windows_detected": measurements.get("total_windows", 0)
            },
            "surface_area_summary": surface_areas["totals"],
            "room_breakdown": surface_areas["rooms"],
            "gpt_insights": {
                "room_names_identified": gpt_analysis.get("room_names", []),
                "measurements_found": gpt_analysis.get("measurements", {}),
                "analysis_notes": gpt_analysis.get("full_analysis", "")[:500] + "..." if len(gpt_analysis.get("full_analysis", "")) > 500 else gpt_analysis.get("full_analysis", "")
            },
            "technical_details": {
                "scale_factor": surface_areas["scale_factor"],
                "wall_height_m": surface_areas["constants"]["wall_height_m"],
                "ceiling_height_m": surface_areas["constants"]["ceiling_height_m"]
            }
        }