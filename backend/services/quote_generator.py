import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging
from weasyprint import HTML, CSS
from jinja2 import Template
import json

class QuoteGenerator:
    """Professional quote PDF generator with Total Wall Area approach and comprehensive measurement details"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_enhanced_quote_pdf(self, quote, project, company, output_dir: str) -> str:
        """Generate a comprehensive PDF quote with Total Wall Area approach"""
        try:
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Detect approach type and generate appropriate content
            measurement_details = quote.measurement_details or {}
            
            # Check if this is a Total Wall Area approach quote
            is_total_wall_area = self._is_total_wall_area_quote(quote, measurement_details)
            
            if is_total_wall_area:
                html_content = self._generate_total_wall_area_html_content(quote, project, company)
                pdf_filename = f"total_wall_area_quote_{quote.quote_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                self.logger.info(f"🏠 Generating Total Wall Area approach PDF")
            else:
                html_content = self._generate_comprehensive_html_content(quote, project, company)
                pdf_filename = f"comprehensive_quote_{quote.quote_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                self.logger.info(f"📐 Generating comprehensive detailed measurement PDF")
            
            pdf_path = os.path.join(output_dir, pdf_filename)
            
            # Generate PDF with appropriate styles
            HTML(string=html_content).write_pdf(
                pdf_path,
                stylesheets=[CSS(string=self._get_comprehensive_pdf_styles())]
            )
            
            self.logger.info(f"✅ Quote PDF generated successfully: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            self.logger.error(f"❌ Quote PDF generation failed: {e}")
            raise
    
    def _is_total_wall_area_quote(self, quote, measurement_details):
        """Detect if this is a Total Wall Area approach quote"""
        # Check line items for Total Wall Area patterns
        line_items = quote.line_items or []
        
        # Look for room-based items with surface categories
        room_work_items = [item for item in line_items if item.get('category') == 'room_work']
        
        # Check if rooms have total_wall_area in measurement details
        rooms_data = measurement_details.get('rooms', [])
        has_total_wall_area = any(room.get('total_wall_area') or room.get('walls_surface_m2') for room in rooms_data)
        
        return len(room_work_items) > 0 and has_total_wall_area
    
    def _generate_total_wall_area_html_content(self, quote, project, company) -> str:
        """Generate HTML content optimized for Total Wall Area approach"""
        
        # Get measurement details
        measurement_details = quote.measurement_details or {}
        rooms_details = measurement_details.get('rooms', [])
        
        # Organize line items for Total Wall Area approach
        organized_items = self._organize_line_items_total_wall_area(quote.line_items or [], measurement_details)
        
        # Calculate summary statistics
        total_wall_area = sum(float(room.get('total_wall_area', 0) or room.get('walls_surface_m2', 0)) for room in rooms_details)
        total_ceiling_area = sum(float(room.get('total_ceiling_area', 0) or room.get('area_m2', 0)) for room in rooms_details)
        total_rooms = len(rooms_details)
        
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Total Wall Area Quote {{ quote.quote_number }}</title>
        </head>
        <body>
            <div class="quote-container">
                <!-- Header -->
                <header class="quote-header">
                    <div class="company-info">
                        {% if company.logo_url %}
                        <img src="{{ company.logo_url }}" alt="{{ company.name }}" class="company-logo">
                        {% endif %}
                        <div class="company-details">
                            <h1 class="company-name">{{ company.name }}</h1>
                            {% if company.address %}
                            <p class="company-address">{{ company.address }}</p>
                            {% endif %}
                            <div class="company-contact">
                                {% if company.phone %}<span>📞 {{ company.phone }}</span>{% endif %}
                                {% if company.email %}<span>✉️ {{ company.email }}</span>{% endif %}
                                {% if company.website %}<span>🌐 {{ company.website }}</span>{% endif %}
                            </div>
                        </div>
                    </div>
                    
                    <div class="quote-info">
                        <h1 class="quote-title">TOTAL WALL AREA PAINT QUOTE</h1>
                        <div class="quote-meta">
                            <p><strong>Quote #:</strong> {{ quote.quote_number }}</p>
                            <p><strong>Date:</strong> {{ quote.created_at.strftime('%B %d, %Y') }}</p>
                            <p><strong>Valid Until:</strong> {{ quote.valid_until.strftime('%B %d, %Y') }}</p>
                            <p><strong>Approach:</strong> Total Wall Area Method</p>
                        </div>
                    </div>
                </header>
                
                <!-- Project Information -->
                <section class="project-section">
                    <h2>Project Information</h2>
                    <div class="project-grid">
                        <div class="project-details">
                            <h3>Project Details</h3>
                            <div class="detail-item">
                                <span class="label">Project Name:</span>
                                <span class="value">{{ project.name }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Project Type:</span>
                                <span class="value">{{ project.project_type|title }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Property Type:</span>
                                <span class="value">{{ project.property_type|title }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Property Address:</span>
                                <span class="value">{{ project.property_address }}</span>
                            </div>
                            {% if project.description %}
                            <div class="detail-item">
                                <span class="label">Description:</span>
                                <span class="value">{{ project.description }}</span>
                            </div>
                            {% endif %}
                        </div>
                        
                        <div class="client-details">
                            <h3>Client Information</h3>
                            {% if quote.client_company_name %}
                            <div class="detail-item">
                                <span class="label">Company:</span>
                                <span class="value">{{ quote.client_company_name }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_contact_name %}
                            <div class="detail-item">
                                <span class="label">Contact:</span>
                                <span class="value">{{ quote.client_contact_name }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_email %}
                            <div class="detail-item">
                                <span class="label">Email:</span>
                                <span class="value">{{ quote.client_email }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_phone %}
                            <div class="detail-item">
                                <span class="label">Phone:</span>
                                <span class="value">{{ quote.client_phone }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_address %}
                            <div class="detail-item">
                                <span class="label">Address:</span>
                                <span class="value">{{ quote.client_address }}</span>
                            </div>
                            {% endif %}
                        </div>
                    </div>
                </section>
                
                <!-- Total Wall Area Summary -->
                <section class="measurement-summary">
                    <h2>Total Wall Area Summary</h2>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-number">{{ total_rooms }}</span>
                            <span class="summary-label">Total Rooms</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-number">{{ "%.1f"|format(total_wall_area) }}m²</span>
                            <span class="summary-label">Total Wall Area</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-number">{{ "%.1f"|format(total_ceiling_area) }}m²</span>
                            <span class="summary-label">Total Ceiling Area</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-number">{{ organized_items.interior|length + organized_items.exterior|length }}</span>
                            <span class="summary-label">Additional Items</span>
                        </div>
                    </div>
                    
                    <div class="approach-explanation">
                        <h4>💡 Total Wall Area Approach</h4>
                        <p>This quote uses the <strong>Total Wall Area method</strong> where we calculate the complete wall surface area for each room and apply treatments across the entire area. This provides simplified, accurate pricing based on total surface areas rather than individual wall measurements.</p>
                    </div>
                </section>
                
                <!-- Room-by-Room Breakdown -->
                {% if organized_items.rooms %}
                <section class="rooms-section">
                    <h2>Room-by-Room Breakdown</h2>
                    
                    {% for room_name, room_data in organized_items.rooms.items() %}
                    <div class="room-section">
                        <h3 class="room-title">{{ room_name }}</h3>
                        
                        <!-- Room area information -->
                        {% if room_data.room_info %}
                        <div class="room-info">
                            <div class="room-stat">
                                <span class="stat-label">Total Wall Area:</span>
                                <span class="stat-value">{{ "%.2f"|format(room_data.room_info.total_wall_area or room_data.room_info.walls_surface_m2 or 0) }}m²</span>
                            </div>
                            <div class="room-stat">
                                <span class="stat-label">Ceiling Area:</span>
                                <span class="stat-value">{{ "%.2f"|format(room_data.room_info.total_ceiling_area or room_data.room_info.area_m2 or 0) }}m²</span>
                            </div>
                            <div class="room-stat">
                                <span class="stat-label">Room Total:</span>
                                <span class="stat-value total-cost">£{{ "%.2f"|format(room_data.room_total) }}</span>
                            </div>
                        </div>
                        {% endif %}
                        
                        <!-- Wall treatments -->
                        {% if room_data.wall_items %}
                        <div class="treatments-section">
                            <h4 class="treatment-title">Wall Treatments</h4>
                            <div class="treatment-rows">
                                {% for item in room_data.wall_items %}
                                <div class="treatment-row">
                                    <div class="treatment-info">
                                        <span class="treatment-name">{{ item.treatment|replace('_', ' ')|title }}</span>
                                        <span class="treatment-details">{{ "%.2f"|format(item.quantity) }}m² × £{{ "%.2f"|format(item.unit_price) }}/m²</span>
                                    </div>
                                    <span class="treatment-cost">£{{ "%.2f"|format(item.total) }}</span>
                                </div>
                                {% endfor %}
                                <div class="subtotal-row">
                                    <span class="subtotal-label">Wall Work Subtotal:</span>
                                    <span class="subtotal-value">£{{ "%.2f"|format(room_data.wall_total) }}</span>
                                </div>
                            </div>
                        </div>
                        {% endif %}
                        
                        <!-- Ceiling treatments -->
                        {% if room_data.ceiling_items %}
                        <div class="treatments-section">
                            <h4 class="treatment-title">Ceiling Treatments</h4>
                            <div class="treatment-rows">
                                {% for item in room_data.ceiling_items %}
                                <div class="treatment-row">
                                    <div class="treatment-info">
                                        <span class="treatment-name">{{ item.treatment|replace('_', ' ')|title }}</span>
                                        <span class="treatment-details">{{ "%.2f"|format(item.quantity) }}m² × £{{ "%.2f"|format(item.unit_price) }}/m²</span>
                                    </div>
                                    <span class="treatment-cost">£{{ "%.2f"|format(item.total) }}</span>
                                </div>
                                {% endfor %}
                                <div class="subtotal-row">
                                    <span class="subtotal-label">Ceiling Work Subtotal:</span>
                                    <span class="subtotal-value">£{{ "%.2f"|format(room_data.ceiling_total) }}</span>
                                </div>
                            </div>
                        </div>
                        {% endif %}
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
                
                <!-- Interior Items -->
                {% if organized_items.interior %}
                <section class="interior-section">
                    <h2>Interior Work Items</h2>
                    <div class="items-rows">
                        {% for item in organized_items.interior %}
                        <div class="item-row">
                            <div class="item-info">
                                <span class="item-name">{{ item.description|replace('Interior - ', '') }}</span>
                                <span class="item-details">{{ item.quantity }} {{ item.unit }} × £{{ "%.2f"|format(item.unit_price) }} each</span>
                                {% if item.specifications and item.specifications.notes %}
                                <span class="item-notes">{{ item.specifications.notes }}</span>
                                {% endif %}
                            </div>
                            <span class="item-cost">£{{ "%.2f"|format(item.total) }}</span>
                        </div>
                        {% endfor %}
                        <div class="section-total">
                            <span class="section-total-label">Interior Work Total:</span>
                            <span class="section-total-value">£{{ "%.2f"|format(organized_items.interior|sum(attribute='total')) }}</span>
                        </div>
                    </div>
                </section>
                {% endif %}
                
                <!-- Exterior Items -->
                {% if organized_items.exterior %}
                <section class="exterior-section">
                    <h2>Exterior Work Items</h2>
                    <div class="items-rows">
                        {% for item in organized_items.exterior %}
                        <div class="item-row">
                            <div class="item-info">
                                <span class="item-name">{{ item.description|replace('Exterior - ', '') }}</span>
                                <span class="item-details">{{ item.quantity }} {{ item.unit }} × £{{ "%.2f"|format(item.unit_price) }} each</span>
                                {% if item.specifications and item.specifications.notes %}
                                <span class="item-notes">{{ item.specifications.notes }}</span>
                                {% endif %}
                            </div>
                            <span class="item-cost">£{{ "%.2f"|format(item.total) }}</span>
                        </div>
                        {% endfor %}
                        <div class="section-total">
                            <span class="section-total-label">Exterior Work Total:</span>
                            <span class="section-total-value">£{{ "%.2f"|format(organized_items.exterior|sum(attribute='total')) }}</span>
                        </div>
                    </div>
                </section>
                {% endif %}
                
                <!-- Special Jobs -->
                {% if organized_items.special %}
                <section class="special-section">
                    <h2>Special Jobs</h2>
                    <div class="special-jobs">
                        {% for item in organized_items.special %}
                        <div class="special-job">
                            <div class="special-job-header">
                                <h4 class="special-job-name">{{ item.description|replace('Special Job - ', '') }}</h4>
                                <span class="special-job-cost">£{{ "%.2f"|format(item.total) }}</span>
                            </div>
                            <div class="special-job-details">
                                <span class="special-job-quantity">{{ item.quantity }} {{ item.unit }} × £{{ "%.2f"|format(item.unit_price) }} per {{ item.unit }}</span>
                                {% if item.specifications %}
                                <div class="special-job-specs">
                                    {% if item.specifications.category %}
                                    <span><strong>Category:</strong> {{ item.specifications.category }}</span>
                                    {% endif %}
                                    {% if item.specifications.difficulty %}
                                    <span><strong>Difficulty:</strong> {{ item.specifications.difficulty }}</span>
                                    {% endif %}
                                    {% if item.specifications.location %}
                                    <span><strong>Location:</strong> {{ item.specifications.location }}</span>
                                    {% endif %}
                                    {% if item.specifications.notes %}
                                    <span><strong>Notes:</strong> {{ item.specifications.notes }}</span>
                                    {% endif %}
                                </div>
                                {% endif %}
                                
                                <!-- Process steps -->
                                {% if item.specifications and item.specifications.steps %}
                                <div class="process-steps">
                                    <h5>Process Steps:</h5>
                                    <ol>
                                        {% for step in item.specifications.steps %}
                                        <li>{{ step }}</li>
                                        {% endfor %}
                                    </ol>
                                </div>
                                {% endif %}
                            </div>
                        </div>
                        {% endfor %}
                        <div class="section-total">
                            <span class="section-total-label">Special Jobs Total:</span>
                            <span class="section-total-value">£{{ "%.2f"|format(organized_items.special|sum(attribute='total')) }}</span>
                        </div>
                    </div>
                </section>
                {% endif %}
                
                <!-- General Services -->
                {% if organized_items.general %}
                <section class="general-section">
                    <h2>General Services</h2>
                    <div class="items-rows">
                        {% for item in organized_items.general %}
                        <div class="item-row">
                            <div class="item-info">
                                <span class="item-name">{{ item.description }}</span>
                                <span class="item-details">{{ item.quantity }} {{ item.unit }}</span>
                            </div>
                            <span class="item-cost">£{{ "%.2f"|format(item.total) }}</span>
                        </div>
                        {% endfor %}
                    </div>
                </section>
                {% endif %}
                
                <!-- Quote Totals -->
                <section class="totals-section">
                    <div class="totals-container">
                        <div class="totals-row">
                            <span class="totals-label">Subtotal:</span>
                            <span class="totals-value">£{{ "%.2f"|format(quote.subtotal) }}</span>
                        </div>
                        <div class="totals-row">
                            <span class="totals-label">VAT ({{ "%.0f"|format((company.vat_rate or 0.20) * 100) }}%):</span>
                            <span class="totals-value">£{{ "%.2f"|format(quote.vat_amount) }}</span>
                        </div>
                        <div class="totals-row total-row">
                            <span class="totals-label"><strong>Total Amount:</strong></span>
                            <span class="totals-value"><strong>£{{ "%.2f"|format(quote.total_amount) }}</strong></span>
                        </div>
                    </div>
                </section>
                
                <!-- Quote Description -->
                {% if quote.description %}
                <section class="description-section">
                    <h2>Project Description</h2>
                    <p class="description">{{ quote.description }}</p>
                </section>
                {% endif %}
                
                <!-- Terms and Conditions -->
                <section class="terms-section">
                    <h2>Terms & Conditions</h2>
                    <div class="terms-content">
                        <ul>
                            <li>Quote valid for 30 days from date of issue</li>
                            <li>50% deposit required before commencement of work</li>
                            <li>Final payment due upon completion</li>
                            <li>All materials and labor included unless otherwise specified</li>
                            <li>Customer to provide access and remove/cover furniture</li>
                            <li>Any variations to be agreed in writing</li>
                            <li>Work carried out during normal business hours (8am-6pm)</li>
                            <li>All waste materials will be disposed of responsibly</li>
                            <li>All work comes with a 12-month guarantee</li>
                            <li>Weather conditions may affect exterior work scheduling</li>
                            <li>Total Wall Area method provides simplified, accurate area-based pricing</li>
                        </ul>
                    </div>
                </section>
                
                <!-- Footer -->
                <footer class="quote-footer">
                    <p class="footer-text">Thank you for choosing our Total Wall Area approach for accurate, simplified painting quotes!</p>
                    
                    <div class="footer-contact">
                        <p>For questions about this quote, please contact us:</p>
                        <p><strong>{{ company.phone or company.email }}</strong></p>
                    </div>
                    
                    {% if company.vat_number %}
                    <p class="vat-number">VAT Registration Number: {{ company.vat_number }}</p>
                    {% endif %}
                    
                    <div class="footer-method">
                        <p class="method-note">🏠 <strong>Total Wall Area Method:</strong> This quote calculates costs based on total wall surface areas and ceiling areas per room, providing transparent and simplified pricing for your painting project.</p>
                    </div>
                </footer>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(
            quote=quote,
            project=project,
            company=company,
            organized_items=organized_items,
            total_wall_area=total_wall_area,
            total_ceiling_area=total_ceiling_area,
            total_rooms=total_rooms,
            datetime=datetime
        )
    
    def _organize_line_items_total_wall_area(self, line_items, measurement_details):
        """Organize line items for Total Wall Area approach display"""
        organized = {
            'rooms': {},
            'interior': [],
            'exterior': [],
            'special': [],
            'general': []
        }
        
        # Get room data for reference
        rooms_data = {room['name']: room for room in measurement_details.get('rooms', [])}
        
        for item in line_items:
            category = item.get('category', 'general')
            
            if category == 'room_work':
                room_name = item.get('room', 'Unknown Room')
                if room_name not in organized['rooms']:
                    organized['rooms'][room_name] = {
                        'room_info': rooms_data.get(room_name),
                        'wall_items': [],
                        'ceiling_items': [],
                        'wall_total': 0,
                        'ceiling_total': 0,
                        'room_total': 0
                    }
                
                if item.get('surface') == 'walls':
                    organized['rooms'][room_name]['wall_items'].append(item)
                    organized['rooms'][room_name]['wall_total'] += item.get('total', 0)
                elif item.get('surface') == 'ceiling':
                    organized['rooms'][room_name]['ceiling_items'].append(item)
                    organized['rooms'][room_name]['ceiling_total'] += item.get('total', 0)
                
                organized['rooms'][room_name]['room_total'] += item.get('total', 0)
            else:
                organized[category].append(item)
        
        return organized
    
    def _generate_comprehensive_html_content(self, quote, project, company) -> str:
        """Generate comprehensive HTML content with all measurement details"""
        
        # Get measurement details
        measurement_details = quote.measurement_details or {}
        rooms_details = measurement_details.get('rooms', [])
        interior_details = measurement_details.get('interior_items', [])
        exterior_details = measurement_details.get('exterior_items', [])
        special_jobs_details = measurement_details.get('special_jobs', [])
        
        # Calculate summary statistics
        total_wall_area = sum(room.get('total_wall_area', 0) for room in rooms_details)
        total_ceiling_area = sum(room.get('total_ceiling_area', 0) for room in rooms_details)
        total_rooms = len(rooms_details)
        
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Comprehensive Quote {{ quote.quote_number }}</title>
        </head>
        <body>
            <div class="quote-container">
                <!-- Header -->
                <header class="quote-header">
                    <div class="company-info">
                        {% if company.logo_url %}
                        <img src="{{ company.logo_url }}" alt="{{ company.name }}" class="company-logo">
                        {% endif %}
                        <div class="company-details">
                            <h1 class="company-name">{{ company.name }}</h1>
                            {% if company.address %}
                            <p class="company-address">{{ company.address }}</p>
                            {% endif %}
                            <div class="company-contact">
                                {% if company.phone %}<span>📞 {{ company.phone }}</span>{% endif %}
                                {% if company.email %}<span>✉️ {{ company.email }}</span>{% endif %}
                                {% if company.website %}<span>🌐 {{ company.website }}</span>{% endif %}
                            </div>
                        </div>
                    </div>
                    
                    <div class="quote-info">
                        <h1 class="quote-title">COMPREHENSIVE PAINT QUOTE</h1>
                        <div class="quote-meta">
                            <p><strong>Quote #:</strong> {{ quote.quote_number }}</p>
                            <p><strong>Date:</strong> {{ quote.created_at.strftime('%B %d, %Y') }}</p>
                            <p><strong>Valid Until:</strong> {{ quote.valid_until.strftime('%B %d, %Y') }}</p>
                        </div>
                    </div>
                </header>
                
                <!-- Project Information -->
                <section class="project-section">
                    <h2>Project Information</h2>
                    <div class="project-grid">
                        <div class="project-details">
                            <h3>Project Details</h3>
                            <div class="detail-item">
                                <span class="label">Project Name:</span>
                                <span class="value">{{ project.name }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Project Type:</span>
                                <span class="value">{{ project.project_type|title }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Property Type:</span>
                                <span class="value">{{ project.property_type|title }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Property Address:</span>
                                <span class="value">{{ project.property_address }}</span>
                            </div>
                            {% if project.description %}
                            <div class="detail-item">
                                <span class="label">Description:</span>
                                <span class="value">{{ project.description }}</span>
                            </div>
                            {% endif %}
                        </div>
                        
                        <div class="client-details">
                            <h3>Client Information</h3>
                            {% if quote.client_company_name %}
                            <div class="detail-item">
                                <span class="label">Company:</span>
                                <span class="value">{{ quote.client_company_name }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_contact_name %}
                            <div class="detail-item">
                                <span class="label">Contact:</span>
                                <span class="value">{{ quote.client_contact_name }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_email %}
                            <div class="detail-item">
                                <span class="label">Email:</span>
                                <span class="value">{{ quote.client_email }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_phone %}
                            <div class="detail-item">
                                <span class="label">Phone:</span>
                                <span class="value">{{ quote.client_phone }}</span>
                            </div>
                            {% endif %}
                            {% if quote.client_address %}
                            <div class="detail-item">
                                <span class="label">Address:</span>
                                <span class="value">{{ quote.client_address }}</span>
                            </div>
                            {% endif %}
                        </div>
                    </div>
                </section>
                
                <!-- Line Items Table -->
                <section class="line-items-section">
                    <h2>Quote Line Items</h2>
                    <table class="line-items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in quote.line_items %}
                            <tr>
                                <td class="description">{{ item.description }}</td>
                                <td class="quantity">{{ item.quantity }}</td>
                                <td class="unit">{{ item.unit }}</td>
                                <td class="unit-price">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </section>
                
                <!-- Quote Totals -->
                <section class="totals-section">
                    <div class="totals-container">
                        <div class="totals-row">
                            <span class="totals-label">Subtotal:</span>
                            <span class="totals-value">£{{ "%.2f"|format(quote.subtotal) }}</span>
                        </div>
                        <div class="totals-row">
                            <span class="totals-label">VAT ({{ "%.0f"|format((company.vat_rate or 0.20) * 100) }}%):</span>
                            <span class="totals-value">£{{ "%.2f"|format(quote.vat_amount) }}</span>
                        </div>
                        <div class="totals-row total-row">
                            <span class="totals-label"><strong>Total Amount:</strong></span>
                            <span class="totals-value"><strong>£{{ "%.2f"|format(quote.total_amount) }}</strong></span>
                        </div>
                    </div>
                </section>
                
                <!-- Quote Description -->
                {% if quote.description %}
                <section class="description-section">
                    <h2>Project Description</h2>
                    <p class="description">{{ quote.description }}</p>
                </section>
                {% endif %}
                
                <!-- Terms and Conditions -->
                <section class="terms-section">
                    <h2>Terms & Conditions</h2>
                    <div class="terms-content">
                        <ul>
                            <li>Quote valid for 30 days from date of issue</li>
                            <li>50% deposit required before commencement of work</li>
                            <li>Final payment due upon completion</li>
                            <li>All materials and labor included unless otherwise specified</li>
                            <li>Customer to provide access and remove/cover furniture</li>
                            <li>Any variations to be agreed in writing</li>
                            <li>Work carried out during normal business hours (8am-6pm)</li>
                            <li>All waste materials will be disposed of responsibly</li>
                            <li>All work comes with a 12-month guarantee</li>
                            <li>Weather conditions may affect exterior work scheduling</li>
                        </ul>
                    </div>
                </section>
                
                <!-- Footer -->
                <footer class="quote-footer">
                    <p class="footer-text">Thank you for considering our services. We look forward to transforming your space with professional quality painting!</p>
                    
                    <div class="footer-contact">
                        <p>For questions about this quote, please contact us:</p>
                        <p><strong>{{ company.phone or company.email }}</strong></p>
                    </div>
                    
                    {% if company.vat_number %}
                    <p class="vat-number">VAT Registration Number: {{ company.vat_number }}</p>
                    {% endif %}
                </footer>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(
            quote=quote,
            project=project,
            company=company,
            rooms_details=rooms_details,
            interior_details=interior_details,
            exterior_details=exterior_details,
            special_jobs_details=special_jobs_details,
            total_wall_area=total_wall_area,
            total_ceiling_area=total_ceiling_area,
            total_rooms=total_rooms,
            datetime=datetime
        )
    
    def _get_comprehensive_pdf_styles(self) -> str:
        """Get comprehensive CSS styles for both Total Wall Area and detailed PDFs"""
        return """
        @page {
            size: A4;
            margin: 0.8cm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
        }
        
        .quote-container {
            max-width: 100%;
        }
        
        /* Header Styles */
        .quote-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px 0;
            border-bottom: 3px solid #7C3AED;
            margin-bottom: 20px;
        }
        
        .company-info {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        
        .company-logo {
            max-width: 60px;
            max-height: 60px;
            object-fit: contain;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #7C3AED;
            margin-bottom: 3px;
        }
        
        .company-address {
            font-size: 9px;
            color: #666;
            margin-bottom: 3px;
        }
        
        .company-contact {
            font-size: 8px;
            color: #666;
        }
        
        .company-contact span {
            display: block;
            margin-bottom: 1px;
        }
        
        .quote-info {
            text-align: right;
        }
        
        .quote-title {
            font-size: 18px;
            font-weight: bold;
            color: #7C3AED;
            margin-bottom: 8px;
        }
        
        .quote-meta p {
            margin-bottom: 3px;
            font-size: 9px;
        }
        
        /* Section Styles */
        section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        section h2 {
            font-size: 14px;
            font-weight: bold;
            color: #7C3AED;
            border-bottom: 1px solid #E0E7FF;
            padding-bottom: 3px;
            margin-bottom: 10px;
        }
        
        /* Project Information */
        .project-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .project-details h3,
        .client-details h3 {
            font-size: 12px;
            font-weight: bold;
            color: #1E293B;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 1px solid #E2E8F0;
        }
        
        .detail-item {
            display: flex;
            margin-bottom: 4px;
            font-size: 9px;
        }
        
        .detail-item .label {
            min-width: 100px;
            font-weight: 600;
            color: #475569;
        }
        
        .detail-item .value {
            color: #1E293B;
        }
        
        /* Total Wall Area Summary */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            background-color: #F0F9FF;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #BAE6FD;
            margin-bottom: 15px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-number {
            display: block;
            font-size: 16px;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 3px;
        }
        
        .summary-label {
            font-size: 8px;
            color: #475569;
            font-weight: 500;
        }
        
        .approach-explanation {
            background-color: #EEF2FF;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #7C3AED;
        }
        
        .approach-explanation h4 {
            font-size: 11px;
            font-weight: bold;
            color: #7C3AED;
            margin-bottom: 6px;
        }
        
        .approach-explanation p {
            font-size: 9px;
            color: #475569;
            line-height: 1.4;
        }
        
        /* Room Sections */
        .room-section {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .room-title {
            font-size: 13px;
            font-weight: bold;
            color: #1E293B;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #7C3AED;
        }
        
        .room-info {
            display: flex;
            gap: 20px;
            margin-bottom: 12px;
            background-color: #EEF2FF;
            padding: 8px 12px;
            border-radius: 4px;
        }
        
        .room-stat {
            display: flex;
            gap: 5px;
            font-size: 9px;
        }
        
        .stat-label {
            font-weight: 600;
            color: #475569;
        }
        
        .stat-value {
            font-weight: bold;
            color: #7C3AED;
        }
        
        .stat-value.total-cost {
            color: #059669;
            font-size: 10px;
        }
        
        /* Treatment Sections */
        .treatments-section {
            margin-bottom: 12px;
        }
        
        .treatment-title {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 8px;
            padding: 4px 8px;
            background-color: #E2E8F0;
            border-radius: 3px;
        }
        
        .treatment-rows {
            space-y: 4px;
        }
        
        .treatment-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid #E5E7EB;
            margin-bottom: 3px;
        }
        
        .treatment-info {
            flex: 1;
        }
        
        .treatment-name {
            display: block;
            font-weight: 600;
            color: #1E293B;
            font-size: 9px;
        }
        
        .treatment-details {
            display: block;
            font-size: 8px;
            color: #6B7280;
        }
        
        .treatment-cost {
            font-weight: bold;
            color: #059669;
            font-size: 9px;
        }
        
        .subtotal-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background-color: #F1F5F9;
            border-radius: 4px;
            border-top: 2px solid #94A3B8;
            margin-top: 6px;
        }
        
        .subtotal-label {
            font-weight: bold;
            color: #475569;
            font-size: 9px;
        }
        
        .subtotal-value {
            font-weight: bold;
            color: #059669;
            font-size: 10px;
        }
        
        /* Items Sections */
        .items-rows {
            space-y: 3px;
        }
        
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: #F9FAFB;
            border-radius: 4px;
            border: 1px solid #E5E7EB;
            margin-bottom: 4px;
        }
        
        .item-info {
            flex: 1;
        }
        
        .item-name {
            display: block;
            font-weight: 600;
            color: #1E293B;
            font-size: 10px;
        }
        
        .item-details {
            display: block;
            font-size: 8px;
            color: #6B7280;
        }
        
        .item-notes {
            display: block;
            font-size: 7px;
            color: #9CA3AF;
            font-style: italic;
        }
        
        .item-cost {
            font-weight: bold;
            color: #059669;
            font-size: 10px;
        }
        
        /* Special Jobs */
        .special-job {
            background-color: #FDF4FF;
            border: 1px solid #E879F9;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        }
        
        .special-job-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .special-job-name {
            font-size: 11px;
            font-weight: bold;
            color: #A21CAF;
        }
        
        .special-job-cost {
            font-size: 12px;
            font-weight: bold;
            color: #059669;
        }
        
        .special-job-quantity {
            font-size: 9px;
            color: #6B7280;
            margin-bottom: 6px;
        }
        
        .special-job-specs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .special-job-specs span {
            font-size: 8px;
            color: #475569;
        }
        
        .process-steps {
            margin-top: 8px;
        }
        
        .process-steps h5 {
            font-size: 9px;
            font-weight: bold;
            color: #A21CAF;
            margin-bottom: 4px;
        }
        
        .process-steps ol {
            padding-left: 12px;
        }
        
        .process-steps li {
            font-size: 8px;
            color: #475569;
            margin-bottom: 2px;
        }
        
        /* Section Totals */
        .section-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: #F1F5F9;
            border-radius: 4px;
            border: 2px solid #94A3B8;
            margin-top: 8px;
        }
        
        .section-total-label {
            font-weight: bold;
            color: #475569;
            font-size: 10px;
        }
        
        .section-total-value {
            font-weight: bold;
            color: #059669;
            font-size: 12px;
        }
        
        /* Line Items Table */
        .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
        }
        
        .line-items-table th {
            background-color: #7C3AED;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
        }
        
        .line-items-table td {
            padding: 6px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 9px;
        }
        
        .line-items-table tbody tr:nth-child(even) {
            background-color: #F9FAFB;
        }
        
        .line-items-table .description {
            font-weight: 500;
            color: #1E293B;
        }
        
        .line-items-table .quantity,
        .line-items-table .unit-price {
            text-align: center;
        }
        
        .line-items-table .total {
            text-align: right;
            font-weight: bold;
            color: #059669;
        }
        
        /* Totals Section */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
        }
        
        .totals-container {
            background-color: #F3F4F6;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #D1D5DB;
            min-width: 250px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            padding: 3px 0;
            font-size: 10px;
        }
        
        .total-row {
            border-top: 2px solid #7C3AED;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 12px;
        }
        
        .totals-label {
            color: #374151;
        }
        
        .totals-value {
            color: #111827;
            font-weight: 600;
        }
        
        /* Description Section */
        .description-section {
            background-color: #FFFBEB;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #F59E0B;
        }
        
        .description {
            font-size: 10px;
            line-height: 1.4;
            color: #92400E;
        }
        
        /* Terms Section */
        .terms-content ul {
            padding-left: 15px;
            margin: 0;
        }
        
        .terms-content li {
            margin-bottom: 4px;
            font-size: 9px;
            line-height: 1.3;
        }
        
        /* Footer */
        .quote-footer {
            border-top: 2px solid #E5E7EB;
            padding-top: 15px;
            margin-top: 30px;
            text-align: center;
            color: #6B7280;
        }
        
        .footer-text {
            font-size: 10px;
            margin-bottom: 10px;
            font-style: italic;
            color: #7C3AED;
        }
        
        .footer-contact {
            margin-bottom: 10px;
        }
        
        .footer-contact p {
            margin-bottom: 3px;
            font-size: 9px;
        }
        
        .vat-number {
            font-size: 8px;
            color: #9CA3AF;
            margin-bottom: 10px;
        }
        
        .footer-method {
            background-color: #EEF2FF;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #C7D2FE;
        }
        
        .method-note {
            font-size: 8px;
            color: #6366F1;
            line-height: 1.3;
        }
        
        /* Print Optimization */
        @media print {
            .quote-container {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .room-section {
                page-break-inside: avoid;
            }
            
            .line-items-table {
                page-break-inside: avoid;
            }
        }
        """