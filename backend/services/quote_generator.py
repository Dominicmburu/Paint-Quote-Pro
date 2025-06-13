import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging
from weasyprint import HTML, CSS
from jinja2 import Template
import json

class QuoteGenerator:
    """Professional quote PDF generator with customizable templates"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_quote_pdf(self, quote, project, company, output_dir: str) -> str:
        """Generate a professional PDF quote"""
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
    
    def _generate_html_content(self, quote, project, company) -> str:
        """Generate HTML content for the quote"""
        
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
                        <p><strong>Project Type:</strong> {{ project.project_type|title }}</p>
                    </div>
                </section>
                
                <!-- Quote Description -->
                {% if quote.description %}
                <section class="description-section">
                    <h2>Project Description</h2>
                    <p class="description">{{ quote.description }}</p>
                </section>
                {% endif %}
                
                <!-- Line Items -->
                <section class="items-section">
                    <h2>Quote Details</h2>
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
                            {% for item in quote.line_items %}
                            <tr>
                                <td class="desc-col">{{ item.description }}</td>
                                <td class="qty-col">{{ "%.2f"|format(item.quantity) }}</td>
                                <td class="unit-col">{{ item.unit or '' }}</td>
                                <td class="price-col">£{{ "%.2f"|format(item.unit_price) }}</td>
                                <td class="total-col">£{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </section>
                
                <!-- Totals -->
                <section class="totals-section">
                    <div class="totals-container">
                        <div class="totals-row">
                            <span class="totals-label">Subtotal:</span>
                            <span class="totals-value">£{{ "%.2f"|format(quote.subtotal) }}</span>
                        </div>
                        <div class="totals-row">
                            <span class="totals-label">VAT ({{ "%.0f"|format(company.vat_rate * 100) }}%):</span>
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
                        </ul>
                        {% endif %}
                    </div>
                </section>
                
                <!-- Footer -->
                <footer class="quote-footer">
                    {% if company.quote_footer_text %}
                    <p class="footer-text">{{ company.quote_footer_text }}</p>
                    {% else %}
                    <p class="footer-text">Thank you for considering our services. We look forward to working with you!</p>
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
            datetime=datetime
        )
    
    def _get_pdf_styles(self) -> str:
        """Get CSS styles for the PDF"""
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
        
        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background-color: #7C3AED;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }
        
        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 10px;
        }
        
        .items-table tbody tr:nth-child(even) {
            background-color: #F9FAFB;
        }
        
        .desc-col { width: 45%; }
        .qty-col { width: 12%; text-align: center; }
        .unit-col { width: 10%; text-align: center; }
        .price-col { width: 15%; text-align: right; }
        .total-col { width: 18%; text-align: right; font-weight: bold; }
        
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
        }
        """