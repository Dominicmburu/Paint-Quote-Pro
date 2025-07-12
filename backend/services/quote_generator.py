import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging
from weasyprint import HTML, CSS
from jinja2 import Template
import json

class QuoteGenerator:
    """Professional quote PDF generator with comprehensive measurement details"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_enhanced_quote_pdf(self, quote, project, company, output_dir: str) -> str:
        """Generate a comprehensive PDF quote with all measurement details"""
        try:
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate HTML content with full details
            html_content = self._generate_comprehensive_html_content(quote, project, company)
            
            # Generate PDF filename
            pdf_filename = f"comprehensive_quote_{quote.quote_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_path = os.path.join(output_dir, pdf_filename)
            
            # Generate PDF
            HTML(string=html_content).write_pdf(
                pdf_path,
                stylesheets=[CSS(string=self._get_comprehensive_pdf_styles())]
            )
            
            self.logger.info(f"✅ Comprehensive quote PDF generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            self.logger.error(f"❌ Comprehensive quote PDF generation failed: {e}")
            raise
    
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
                
                <!-- Measurement Summary -->
                <section class="measurement-summary">
                    <h2>Measurement Summary</h2>
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
                            <span class="summary-number">{{ (interior_details|length) + (exterior_details|length) }}</span>
                            <span class="summary-label">Interior/Exterior Items</span>
                        </div>
                    </div>
                </section>
                
                <!-- Room-by-Room Detailed Breakdown -->
                {% if rooms_details %}
                <section class="rooms-detailed-section">
                    <h2>Room-by-Room Detailed Breakdown</h2>
                    
                    {% for room in rooms_details %}
                    <div class="room-detailed-section">
                        <h3 class="room-title">{{ room.name }} ({{ room.type|title }})</h3>
                        
                        <div class="room-summary">
                            <div class="room-stat">
                                <span class="stat-label">Wall Area:</span>
                                <span class="stat-value">{{ "%.2f"|format(room.total_wall_area) }}m²</span>
                            </div>
                            <div class="room-stat">
                                <span class="stat-label">Ceiling Area:</span>
                                <span class="stat-value">{{ "%.2f"|format(room.total_ceiling_area) }}m²</span>
                            </div>
                            <div class="room-stat">
                                <span class="stat-label">Room Total:</span>
                                <span class="stat-value">£{{ "%.2f"|format(room.room_total) }}</span>
                            </div>
                        </div>
                        
                        <!-- Wall Details -->
                        {% if room.walls %}
                        <div class="wall-details">
                            <h4 class="subsection-title">Wall Measurements & Treatments</h4>
                            <table class="measurements-table">
                                <thead>
                                    <tr>
                                        <th>Wall</th>
                                        <th>Length</th>
                                        <th>Height</th>
                                        <th>Area</th>
                                        <th>Treatments Selected</th>
                                        <th>Wall Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for wall in room.walls %}
                                    <tr>
                                        <td class="wall-name">{{ wall.name }}</td>
                                        <td class="measurement">{{ "%.2f"|format(wall.length) }}m</td>
                                        <td class="measurement">{{ "%.2f"|format(wall.height) }}m</td>
                                        <td class="measurement">{{ "%.2f"|format(wall.area) }}m²</td>
                                        <td class="treatments">
                                            {% set treatments = [] %}
                                            {% if wall.treatments.sanding_filling %}{% set _ = treatments.append('Sanding & Filling') %}{% endif %}
                                            {% if wall.treatments.priming %}{% set _ = treatments.append('Priming') %}{% endif %}
                                            {% if wall.treatments.one_coat %}{% set _ = treatments.append('1 Coat Paint') %}{% endif %}
                                            {% if wall.treatments.two_coats %}{% set _ = treatments.append('2 Coats Paint') %}{% endif %}
                                            {{ treatments|join(', ') if treatments else 'None' }}
                                        </td>
                                        <td class="total">£{{ "%.2f"|format(wall.wall_total) }}</td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                            </table>
                        </div>
                        {% endif %}
                        
                        <!-- Ceiling Details -->
                        {% if room.ceiling %}
                        <div class="ceiling-details">
                            <h4 class="subsection-title">Ceiling Measurements & Treatments</h4>
                            <table class="measurements-table">
                                <thead>
                                    <tr>
                                        <th>Surface</th>
                                        <th>Length</th>
                                        <th>Width</th>
                                        <th>Area</th>
                                        <th>Treatments Selected</th>
                                        <th>Ceiling Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="wall-name">Ceiling</td>
                                        <td class="measurement">{{ "%.2f"|format(room.ceiling.length) }}m</td>
                                        <td class="measurement">{{ "%.2f"|format(room.ceiling.width) }}m</td>
                                        <td class="measurement">{{ "%.2f"|format(room.ceiling.area) }}m²</td>
                                        <td class="treatments">
                                            {% set treatments = [] %}
                                            {% if room.ceiling.treatments.sanding_filling %}{% set _ = treatments.append('Sanding & Filling') %}{% endif %}
                                            {% if room.ceiling.treatments.priming %}{% set _ = treatments.append('Priming') %}{% endif %}
                                            {% if room.ceiling.treatments.one_coat %}{% set _ = treatments.append('1 Coat Paint') %}{% endif %}
                                            {% if room.ceiling.treatments.two_coats %}{% set _ = treatments.append('2 Coats Paint') %}{% endif %}
                                            {{ treatments|join(', ') if treatments else 'None' }}
                                        </td>
                                        <td class="total">£{{ "%.2f"|format(room.ceiling.ceiling_total) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {% endif %}
                    </div>
                    {% endfor %}
                </section>
                {% endif %}
                
                <!-- Interior Items Detailed -->
                {% if interior_details %}
                <section class="interior-detailed-section">
                    <h2>Interior Items - Detailed Breakdown</h2>
                    <table class="items-detailed-table">
                        <thead>
                            <tr>
                                <th>Item Type</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Condition/Size</th>
                                <th>Location</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in interior_details %}
                            <tr>
                                <td class="item-type">{{ item.type|replace('_', ' ')|title }}</td>
                                <td class="description">{{ item.description }}</td>
                                <td class="quantity">{{ item.quantity }}</td>
                                <td class="condition">
                                    {% if item.condition != 'N/A' %}{{ item.condition }}{% endif %}
                                    {% if item.size != 'N/A' %}{{ item.size }}{% endif %}
                                </td>
                                <td class="location">{{ item.location if item.location else '-' }}</td>
                                <td class="unit-price">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% if item.notes %}
                            <tr class="notes-row">
                                <td colspan="7" class="notes">
                                    <strong>Notes:</strong> {{ item.notes }}
                                </td>
                            </tr>
                            {% endif %}
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="6"><strong>Interior Items Subtotal:</strong></td>
                                <td class="total"><strong>£{{ "%.2f"|format(interior_details|sum(attribute='total')) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                {% endif %}
                
                <!-- Exterior Items Detailed -->
                {% if exterior_details %}
                <section class="exterior-detailed-section">
                    <h2>Exterior Items - Detailed Breakdown</h2>
                    <table class="items-detailed-table">
                        <thead>
                            <tr>
                                <th>Item Type</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Type/Size</th>
                                <th>Location</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in exterior_details %}
                            <tr>
                                <td class="item-type">{{ item.type|replace('_', ' ')|title }}</td>
                                <td class="description">{{ item.description }}</td>
                                <td class="quantity">{{ item.quantity }}</td>
                                <td class="condition">
                                    {% if item.door_type != 'N/A' %}{{ item.door_type }}{% endif %}
                                    {% if item.size != 'N/A' %}{{ item.size }}{% endif %}
                                </td>
                                <td class="location">{{ item.location if item.location else '-' }}</td>
                                <td class="unit-price">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% if item.notes %}
                            <tr class="notes-row">
                                <td colspan="7" class="notes">
                                    <strong>Notes:</strong> {{ item.notes }}
                                </td>
                            </tr>
                            {% endif %}
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="6"><strong>Exterior Items Subtotal:</strong></td>
                                <td class="total"><strong>£{{ "%.2f"|format(exterior_details|sum(attribute='total')) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                {% endif %}
                
                <!-- Special Jobs Detailed -->
                {% if special_jobs_details %}
                <section class="special-jobs-detailed-section">
                    <h2>Special Jobs - Detailed Breakdown</h2>
                    <table class="items-detailed-table">
                        <thead>
                            <tr>
                                <th>Job Name</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Difficulty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for job in special_jobs_details %}
                            <tr>
                                <td class="job-name">{{ job.name }}</td>
                                <td class="description">{{ job.description if job.description else '-' }}</td>
                                <td class="category">{{ job.category }}</td>
                                <td class="quantity">{{ job.quantity }}</td>
                                <td class="unit">{{ job.unit }}</td>
                                <td class="difficulty">{{ job.difficulty }}</td>
                                <td class="unit-price">£{{ "%.2f"|format(job.unit_price) }}</td>
                                <td class="total">£{{ "%.2f"|format(job.total) }}</td>
                            </tr>
                            {% if job.notes %}
                            <tr class="notes-row">
                                <td colspan="8" class="notes">
                                    <strong>Notes:</strong> {{ job.notes }}
                                </td>
                            </tr>
                            {% endif %}
                            {% if job.location %}
                            <tr class="location-row">
                                <td colspan="8" class="location-info">
                                    <strong>Location:</strong> {{ job.location }}
                                </td>
                            </tr>
                            {% endif %}
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="7"><strong>Special Jobs Subtotal:</strong></td>
                                <td class="total"><strong>£{{ "%.2f"|format(special_jobs_details|sum(attribute='total')) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
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
        """Get comprehensive CSS styles for detailed PDF"""
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
            line-height: 1.3;
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
           font-size: 22px;
           font-weight: bold;
           color: #7C3AED;
           margin-bottom: 8px;
       }
       
       .quote-meta p {
           margin-bottom: 3px;
           font-size: 10px;
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
       
       /* Measurement Summary */
       .summary-grid {
           display: grid;
           grid-template-columns: repeat(4, 1fr);
           gap: 15px;
           background-color: #F0F9FF;
           padding: 15px;
           border-radius: 6px;
           border: 1px solid #BAE6FD;
       }
       
       .summary-item {
           text-align: center;
       }
       
       .summary-number {
           display: block;
           font-size: 18px;
           font-weight: bold;
           color: #1E40AF;
           margin-bottom: 3px;
       }
       
       .summary-label {
           font-size: 9px;
           color: #475569;
           font-weight: 500;
       }
       
       /* Room Detailed Sections */
       .room-detailed-section {
           background-color: #F8FAFC;
           border: 1px solid #E2E8F0;
           border-radius: 6px;
           padding: 15px;
           margin-bottom: 15px;
           page-break-inside: avoid;
       }
       
       .room-title {
           font-size: 14px;
           font-weight: bold;
           color: #1E293B;
           margin-bottom: 10px;
           padding-bottom: 5px;
           border-bottom: 2px solid #7C3AED;
       }
       
       .room-summary {
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
       
       .subsection-title {
           font-size: 11px;
           font-weight: bold;
           color: #475569;
           margin: 10px 0 6px 0;
           padding: 4px 8px;
           background-color: #E2E8F0;
           border-radius: 3px;
       }
       
       /* Tables */
       .measurements-table,
       .items-detailed-table {
           width: 100%;
           border-collapse: collapse;
           margin-bottom: 10px;
           font-size: 8px;
       }
       
       .measurements-table th,
       .items-detailed-table th {
           background-color: #7C3AED;
           color: white;
           padding: 6px 4px;
           text-align: left;
           font-weight: bold;
           font-size: 8px;
       }
       
       .measurements-table td,
       .items-detailed-table td {
           padding: 4px;
           border-bottom: 1px solid #E5E7EB;
           font-size: 8px;
           vertical-align: top;
       }
       
       .measurements-table tbody tr:nth-child(even),
       .items-detailed-table tbody tr:nth-child(even) {
           background-color: #F9FAFB;
       }
       
       .wall-name {
           font-weight: 600;
           color: #1E293B;
       }
       
       .measurement {
           text-align: center;
           font-weight: 500;
       }
       
       .treatments {
           font-size: 7px;
           line-height: 1.2;
       }
       
       .total {
           text-align: right;
           font-weight: bold;
           color: #059669;
       }
       
       .item-type {
           font-weight: 600;
           color: #7C3AED;
       }
       
       .description {
           color: #1E293B;
       }
       
       .quantity {
           text-align: center;
           font-weight: 500;
       }
       
       .condition {
           font-size: 7px;
           color: #6B7280;
       }
       
       .location {
           font-size: 7px;
           color: #6B7280;
       }
       
       .unit-price {
           text-align: right;
           font-weight: 500;
       }
       
       .job-name {
           font-weight: 600;
           color: #DC2626;
       }
       
       .category {
           font-size: 7px;
           color: #6B7280;
           text-transform: uppercase;
       }
       
       .difficulty {
           font-size: 7px;
           color: #F59E0B;
           font-weight: 500;
       }
       
       .notes-row td {
           background-color: #FFFBEB !important;
           border-top: 1px solid #FCD34D;
           font-style: italic;
           color: #92400E;
       }
       
       .location-row td {
           background-color: #F0FDF4 !important;
           border-top: 1px solid #BBF7D0;
           color: #166534;
       }
       
       .subtotal-row {
           background-color: #F1F5F9 !important;
           border-top: 2px solid #94A3B8;
       }
       
       .subtotal-row td {
           font-weight: bold;
           padding: 6px 4px;
       }
       
       /* Interior/Exterior Section Styling */
       .interior-detailed-section {
           background-color: #FFF7ED;
           padding: 12px;
           border-radius: 6px;
           border-left: 4px solid #FB923C;
       }
       
       .exterior-detailed-section {
           background-color: #F0F9FF;
           padding: 12px;
           border-radius: 6px;
           border-left: 4px solid #0EA5E9;
       }
       
       .special-jobs-detailed-section {
           background-color: #FDF4FF;
           padding: 12px;
           border-radius: 6px;
           border-left: 4px solid #C084FC;
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
       }
       
       /* Print Optimization */
       @media print {
           .quote-container {
               -webkit-print-color-adjust: exact;
               color-adjust: exact;
           }
           
           .room-detailed-section {
               page-break-inside: avoid;
           }
           
           .measurements-table {
               page-break-inside: avoid;
           }
       }
       
       /* Responsive adjustments for smaller content */
       @page {
           @bottom-center {
               content: "Page " counter(page) " of " counter(pages);
               font-size: 8px;
               color: #6B7280;
           }
       }
       """