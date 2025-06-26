import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging
from weasyprint import HTML, CSS
from jinja2 import Template
import json

class QuoteGenerator:
    """Professional quote PDF generator with enhanced room-based formatting"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_quote_pdf(self, quote, project, company, output_dir: str) -> str:
        """Generate a professional PDF quote with room-based organization"""
        try:
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate HTML content
            html_content = self._generate_html_content(quote, project, company)
            
            # Generate PDF filename
            pdf_filename = f"quote_{quote.quote_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_path = os.path.join(output_dir, pdf_filename)
            
            # Generate PDF
            HTML(string=html_content).write_pdf(
                pdf_path,
                stylesheets=[CSS(string=self._get_pdf_styles())]
            )
            
            self.logger.info(f"✅ Quote PDF generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            self.logger.error(f"❌ Quote PDF generation failed: {e}")
            raise
    
    def _organize_line_items_by_room(self, line_items):
        """Organize line items by room for better PDF structure"""
        rooms = {}
        interior_items = []
        exterior_items = []
        general_items = []
        
        for item in line_items:
            description = item.get('description', '')
            
            # Check if item belongs to a specific room
            if ' - ' in description:
                parts = description.split(' - ')
                if len(parts) >= 2:
                    room_name = parts[0].strip()
                    work_description = ' - '.join(parts[1:]).strip()
                    
                    if room_name not in rooms:
                        rooms[room_name] = {
                            'walls': [],
                            'ceiling': [],
                            'other': []
                        }
                    
                    # Categorize work type
                    work_lower = work_description.lower()
                    if any(keyword in work_lower for keyword in ['wall', 'sanding', 'priming', 'painting']):
                        if 'ceiling' not in work_lower:
                            rooms[room_name]['walls'].append(item)
                        else:
                            rooms[room_name]['ceiling'].append(item)
                    else:
                        rooms[room_name]['other'].append(item)
                    continue
            
            # Categorize non-room specific items
            desc_lower = description.lower()
            if any(keyword in desc_lower for keyword in ['window', 'door', 'radiator', 'skirting']):
                if any(keyword in desc_lower for keyword in ['exterior', 'outside', 'external']):
                    exterior_items.append(item)
                else:
                    interior_items.append(item)
            elif any(keyword in desc_lower for keyword in ['cleanup', 'preparation', 'setup', 'materials']):
                general_items.append(item)
            else:
                general_items.append(item)
        
        return {
            'rooms': rooms,
            'interior_items': interior_items,
            'exterior_items': exterior_items,
            'general_items': general_items
        }
    
    def _generate_html_content(self, quote, project, company) -> str:
        """Generate HTML content for the quote with room-based organization"""
        
        # Organize line items by room
        organized_items = self._organize_line_items_by_room(quote.line_items)
        
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quote {{ quote.quote_number }}</title>
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
                        <h1 class="quote-title">PAINT QUOTE</h1>
                        <div class="quote-meta">
                            <p><strong>Quote #:</strong> {{ quote.quote_number }}</p>
                            <p><strong>Date:</strong> {{ quote.created_at.strftime('%B %d, %Y') }}</p>
                            <p><strong>Valid Until:</strong> {{ quote.valid_until.strftime('%B %d, %Y') }}</p>
                        </div>
                    </div>
                </header>
                
                <!-- Client Information -->
                <section class="client-section">
                    <h2>Client Information</h2>
                    <div class="client-info">
                        <p><strong>Project:</strong> {{ project.name }}</p>
                        {% if project.client_name %}<p><strong>Client:</strong> {{ project.client_name }}</p>{% endif %}
                        {% if project.client_email %}<p><strong>Email:</strong> {{ project.client_email }}</p>{% endif %}
                        {% if project.client_phone %}<p><strong>Phone:</strong> {{ project.client_phone }}</p>{% endif %}
                        {% if project.client_address %}<p><strong>Address:</strong> {{ project.client_address }}</p>{% endif %}
                        <p><strong>Property Type:</strong> {{ project.property_type|title }}</p>
                    </div>
                </section>
                
                <!-- Quote Description -->
                {% if quote.description %}
                <section class="description-section">
                    <h2>Project Description</h2>
                    <p class="description">{{ quote.description }}</p>
                </section>
                {% endif %}
                
                <!-- Room-by-Room Breakdown -->
                {% if organized_items.rooms %}
                <section class="rooms-section">
                    <h2>Room-by-Room Breakdown</h2>
                    
                    {% for room_name, room_items in organized_items.rooms.items() %}
                    <div class="room-section">
                        <h3 class="room-title">{{ room_name }}</h3>
                        
                        <!-- Wall Work -->
                        {% if room_items.walls %}
                        <div class="work-category">
                            <h4 class="category-title">Wall Work</h4>
                            <table class="room-items-table">
                                <thead>
                                    <tr>
                                        <th class="desc-col">Description</th>
                                        <th class="qty-col">Area (m²)</th>
                                        <th class="price-col">Rate</th>
                                        <th class="total-col">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for item in room_items.walls %}
                                    <tr>
                                        <td class="desc-col">{{ item.description.split(' - ', 1)[1] if ' - ' in item.description else item.description }}</td>
                                        <td class="qty-col">{{ "%.2f"|format(item.quantity) }}</td>
                                        <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}/m²</td>
                                        <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                                <tfoot>
                                    <tr class="subtotal-row">
                                        <td colspan="3"><strong>Wall Work Subtotal:</strong></td>
                                        <td class="total-col"><strong>£{{ "%.2f"|format(room_items.walls|sum(attribute='total')) }}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {% endif %}
                        
                        <!-- Ceiling Work -->
                        {% if room_items.ceiling %}
                        <div class="work-category">
                            <h4 class="category-title">Ceiling Work</h4>
                            <table class="room-items-table">
                                <thead>
                                    <tr>
                                        <th class="desc-col">Description</th>
                                        <th class="qty-col">Area (m²)</th>
                                        <th class="price-col">Rate</th>
                                        <th class="total-col">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for item in room_items.ceiling %}
                                    <tr>
                                        <td class="desc-col">{{ item.description.split(' - ', 1)[1] if ' - ' in item.description else item.description }}</td>
                                        <td class="qty-col">{{ "%.2f"|format(item.quantity) }}</td>
                                        <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}/m²</td>
                                        <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                                <tfoot>
                                    <tr class="subtotal-row">
                                        <td colspan="3"><strong>Ceiling Work Subtotal:</strong></td>
                                        <td class="total-col"><strong>£{{ "%.2f"|format(room_items.ceiling|sum(attribute='total')) }}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {% endif %}
                        
                        <!-- Other Surfaces -->
                        {% if room_items.other %}
                        <div class="work-category">
                            <h4 class="category-title">Other Surfaces</h4>
                            <table class="room-items-table">
                                <thead>
                                    <tr>
                                        <th class="desc-col">Description</th>
                                        <th class="qty-col">Quantity</th>
                                        <th class="price-col">Rate</th>
                                        <th class="total-col">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for item in room_items.other %}
                                    <tr>
                                        <td class="desc-col">{{ item.description.split(' - ', 1)[1] if ' - ' in item.description else item.description }}</td>
                                        <td class="qty-col">{{ "%.2f"|format(item.quantity) }} {{ item.unit or '' }}</td>
                                        <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}</td>
                                        <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                                <tfoot>
                                    <tr class="subtotal-row">
                                        <td colspan="3"><strong>Other Surfaces Subtotal:</strong></td>
                                        <td class="total-col"><strong>£{{ "%.2f"|format(room_items.other|sum(attribute='total')) }}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {% endif %}
                        
                        <!-- Room Total -->
                        <div class="room-total">
                            <p><strong>{{ room_name }} Total: £{{ "%.2f"|format((room_items.walls|sum(attribute='total')) + (room_items.ceiling|sum(attribute='total')) + (room_items.other|sum(attribute='total'))) }}</strong></p>
                        </div>
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
                
                <!-- Interior Items -->
                {% if organized_items.interior_items %}
                <section class="interior-section">
                    <h2>Interior Items</h2>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="desc-col">Description</th>
                                <th class="qty-col">Quantity</th>
                                <th class="unit-col">Unit</th>
                                <th class="price-col">Unit Price</th>
                                <th class="total-col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in organized_items.interior_items %}
                            <tr>
                                <td class="desc-col">{{ item.description }}</td>
                                <td class="qty-col">{{ "%.0f"|format(item.quantity) }}</td>
                                <td class="unit-col">{{ item.unit or 'piece' }}</td>
                                <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="4"><strong>Interior Items Subtotal:</strong></td>
                                <td class="total-col"><strong>£{{ "%.2f"|format(organized_items.interior_items|sum(attribute='total')) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                {% endif %}
                
                <!-- Exterior Items -->
                {% if organized_items.exterior_items %}
                <section class="exterior-section">
                    <h2>Exterior Items</h2>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="desc-col">Description</th>
                                <th class="qty-col">Quantity</th>
                                <th class="unit-col">Unit</th>
                                <th class="price-col">Unit Price</th>
                                <th class="total-col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in organized_items.exterior_items %}
                            <tr>
                                <td class="desc-col">{{ item.description }}</td>
                                <td class="qty-col">{{ "%.0f"|format(item.quantity) }}</td>
                                <td class="unit-col">{{ item.unit or 'piece' }}</td>
                                <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="4"><strong>Exterior Items Subtotal:</strong></td>
                                <td class="total-col"><strong>£{{ "%.2f"|format(organized_items.exterior_items|sum(attribute='total')) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                {% endif %}
                
                <!-- General Items -->
                {% if organized_items.general_items %}
                <section class="general-section">
                    <h2>Additional Services</h2>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="desc-col">Description</th>
                                <th class="qty-col">Quantity</th>
                                <th class="unit-col">Unit</th>
                                <th class="price-col">Unit Price</th>
                                <th class="total-col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in organized_items.general_items %}
                            <tr>
                                <td class="desc-col">{{ item.description }}</td>
                                <td class="qty-col">{{ "%.2f"|format(item.quantity) }}</td>
                                <td class="unit-col">{{ item.unit or 'job' }}</td>
                                <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="4"><strong>Additional Services Subtotal:</strong></td>
                                <td class="total-col"><strong>£{{ "%.2f"|format(organized_items.general_items|sum(attribute='total')) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                {% endif %}
                
                <!-- Totals -->
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
                
                <!-- Surface Area Summary (if available) -->
                {% if project.floor_plan_analysis and project.floor_plan_analysis.surface_areas %}
                <section class="surface-area-section">
                    <h2>Surface Area Analysis</h2>
                    <div class="surface-grid">
                        {% set totals = project.floor_plan_analysis.surface_areas.totals %}
                        <div class="surface-item">
                            <span class="surface-label">Total Floor Area:</span>
                            <span class="surface-value">{{ "%.2f"|format(totals.total_floor_area_m2) }} m²</span>
                        </div>
                        <div class="surface-item">
                            <span class="surface-label">Total Wall Area:</span>
                            <span class="surface-value">{{ "%.2f"|format(totals.total_wall_area_m2) }} m²</span>
                        </div>
                        <div class="surface-item">
                            <span class="surface-label">Total Ceiling Area:</span>
                            <span class="surface-value">{{ "%.2f"|format(totals.total_ceiling_area_m2) }} m²</span>
                        </div>
                        <div class="surface-item">
                            <span class="surface-label">Number of Rooms:</span>
                            <span class="surface-value">{{ totals.total_rooms }}</span>
                        </div>
                    </div>
                </section>
                {% endif %}
                
                <!-- Paint Specifications -->
                <section class="specifications-section">
                    <h2>Paint Specifications</h2>
                    <div class="specs-content">
                        <p><strong>Preferred Brand:</strong> {{ company.preferred_paint_brand or 'Premium Quality Paint' }}</p>
                        <p><strong>Coverage:</strong> All surfaces will receive appropriate primer and finish coats</p>
                        <p><strong>Preparation:</strong> All surfaces will be properly cleaned, filled, and prepared</p>
                        <p><strong>Quality:</strong> All work carried out to professional standards</p>
                        <p><strong>Interior Work:</strong> Moisture-resistant paints in bathrooms and kitchens</p>
                        <p><strong>Exterior Work:</strong> Weather-resistant coatings for maximum durability</p>
                    </div>
                </section>
                
                <!-- Terms and Conditions -->
                <section class="terms-section">
                    <h2>Terms & Conditions</h2>
                    <div class="terms-content">
                        {% if company.quote_terms_conditions %}
                        <p>{{ company.quote_terms_conditions }}</p>
                        {% else %}
                        <ul>
                            <li>Quote valid for 30 days from date of issue</li>
                            <li>50% deposit required before commencement of work</li>
                            <li>Final payment due upon completion</li>
                            <li>All materials and labor included unless otherwise specified</li>
                            <li>Customer to provide access and remove/cover furniture</li>
                            <li>Any variations to be agreed in writing</li>
                            <li>Work carried out during normal business hours (8am-6pm)</li>
                            <li>All waste materials will be disposed of responsibly</li>
                        </ul>
                        {% endif %}
                    </div>
                </section>
                
                <!-- Footer -->
                <footer class="quote-footer">
                    {% if company.quote_footer_text %}
                    <p class="footer-text">{{ company.quote_footer_text }}</p>
                    {% else %}
                    <p class="footer-text">Thank you for considering our services. We look forward to transforming your space!</p>
                    {% endif %}
                    
                    <div class="footer-contact">
                        <p>For questions about this quote, please contact us:</p>
                        <p>{{ company.phone or company.email }}</p>
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
            organized_items=organized_items,
            datetime=datetime
        )
    
    def _get_pdf_styles(self) -> str:
        """Get enhanced CSS styles for the PDF with room-based formatting"""
        return """
        @page {
            size: A4;
            margin: 1cm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
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
            padding: 20px 0;
            border-bottom: 3px solid #7C3AED;
            margin-bottom: 30px;
        }
        
        .company-info {
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        
        .company-logo {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #7C3AED;
            margin-bottom: 5px;
        }
        
        .company-address {
            font-size: 10px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .company-contact {
            font-size: 9px;
            color: #666;
        }
        
        .company-contact span {
            display: block;
            margin-bottom: 2px;
        }
        
        .quote-info {
            text-align: right;
        }
        
        .quote-title {
            font-size: 28px;
            font-weight: bold;
            color: #7C3AED;
            margin-bottom: 10px;
        }
        
        .quote-meta p {
            margin-bottom: 5px;
            font-size: 11px;
        }
        
        /* Section Styles */
        section {
            margin-bottom: 25px;
        }
        
        section h2 {
            font-size: 16px;
            font-weight: bold;
            color: #7C3AED;
            border-bottom: 1px solid #E0E7FF;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        
        /* Client Section */
        .client-info p {
            margin-bottom: 5px;
        }
        
        /* Description Section */
        .description {
            background-color: #FFFBEB;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #F59E0B;
        }
        
        /* Room-by-Room Styles */
        .room-section {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .room-title {
            font-size: 18px;
            font-weight: bold;
            color: #1E293B;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #7C3AED;
        }
        
        .work-category {
            margin-bottom: 15px;
        }
        
        .category-title {
            font-size: 14px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 8px;
            padding: 5px 10px;
            background-color: #E2E8F0;
            border-radius: 4px;
        }
        
        .room-total {
            background-color: #EEF2FF;
            padding: 10px;
            border-radius: 5px;
            text-align: right;
            margin-top: 15px;
            border-left: 4px solid #7C3AED;
        }
        
        /* Table Styles */
        .items-table, .room-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .items-table th, .room-items-table th {
            background-color: #7C3AED;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }
        
        .items-table td, .room-items-table td {
            padding: 6px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 10px;
        }
        
        .items-table tbody tr:nth-child(even), 
        .room-items-table tbody tr:nth-child(even) {
            background-color: #F9FAFB;
        }
        
        .subtotal-row {
            background-color: #F1F5F9 !important;
            border-top: 2px solid #94A3B8;
        }
        
        .desc-col { width: 45%; }
        .qty-col { width: 15%; text-align: center; }
        .unit-col { width: 10%; text-align: center; }
        .price-col { width: 15%; text-align: right; }
        .total-col { width: 15%; text-align: right; font-weight: bold; }
        
        /* Section-specific backgrounds */
        .interior-section {
            background-color: #FFF7ED;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #FB923C;
        }
        
        .exterior-section {
            background-color: #F0F9FF;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0EA5E9;
        }
        
        .general-section {
            background-color: #F0FDF4;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #22C55E;
        }
        
        /* Totals Section */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-container {
            background-color: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #D1D5DB;
            min-width: 300px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .total-row {
            border-top: 2px solid #7C3AED;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 14px;
        }
        
        .totals-label {
            color: #374151;
        }
        
        .totals-value {
            color: #111827;
            font-weight: 500;
        }
        
        /* Surface Area Section */
        .surface-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            background-color: #F0F9FF;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #BAE6FD;
        }
        
        .surface-item {
            display: flex;
            justify-content: space-between;
        }
        
        .surface-label {
            color: #0F172A;
            font-weight: 500;
        }
        
        .surface-value {
            color: #1E40AF;
            font-weight: bold;
        }
        
        /* Specifications Section */
        .specs-content p {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
        }
        
        .specs-content p:before {
            content: "•";
            color: #10B981;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        /* Terms Section */
        .terms-content ul {
            padding-left: 20px;
        }
        
        .terms-content li {
            margin-bottom: 8px;
        }
        
        /* Footer */
        .quote-footer {
            border-top: 2px solid #E5E7EB;
            padding-top: 20px;
            margin-top: 40px;
            text-align: center;
            color: #6B7280;
        }
        
        .footer-text {
            font-size: 12px;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .footer-contact {
            margin-bottom: 15px;
        }
        
        .footer-contact p {
            margin-bottom: 5px;
        }
        
        .vat-number {
            font-size: 9px;
            color: #9CA3AF;
        }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .mb-10 { margin-bottom: 10px; }
        .mb-20 { margin-bottom: 20px; }
        
        /* Print Optimization */
        @media print {
            .quote-container {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .room-section {
                page-break-inside: avoid;
            }
        }
        """
    
    