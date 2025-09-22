# services/quote_generator.py - Updated with Company-Specific Logo Support
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging
from weasyprint import HTML, CSS
from jinja2 import Template
import requests
from io import BytesIO

class QuoteGenerator:
    """Enhanced quote PDF generator with company-specific logo support"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def _download_company_logo(self, company):
        """Download and cache the company's specific logo image"""
        try:
            # Check if company has a logo URL
            if not company or not company.logo_url:
                self.logger.info("No company logo URL found, proceeding without logo")
                return None
            
            logo_url = company.logo_url.strip()
            if not logo_url:
                self.logger.info("Empty logo URL, proceeding without logo")
                return None
            
            self.logger.info(f"Downloading company logo from: {logo_url}")
            
            # Download the logo with proper headers and timeout
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(logo_url, timeout=15, headers=headers)
            response.raise_for_status()
            
            # Validate content type
            content_type = response.headers.get('content-type', '').lower()
            if not any(img_type in content_type for img_type in ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']):
                self.logger.warning(f"Invalid content type for logo: {content_type}")
                return None
            
            self.logger.info(f"Successfully downloaded company logo ({len(response.content)} bytes)")
            return response.content
            
        except requests.exceptions.RequestException as e:
            self.logger.warning(f"Failed to download company logo from {company.logo_url if company else 'None'}: {e}")
            return None
        except Exception as e:
            self.logger.warning(f"Unexpected error downloading company logo: {e}")
            return None
    
    def generate_enhanced_quote_pdf(self, quote, project, company, output_dir: str) -> str:
        """Generate a professional PDF quote with company-specific logo"""
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            html_content = self._generate_professional_html_content(quote, project, company)
            pdf_filename = f"quote_{quote.quote_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_path = os.path.join(output_dir, pdf_filename)
            
            HTML(string=html_content).write_pdf(
                pdf_path,
                stylesheets=[CSS(string=self._get_professional_pdf_styles())]
            )
            
            self.logger.info(f"✅ Professional quote PDF generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            self.logger.error(f"❌ Professional quote PDF generation failed: {e}")
            raise
    
    def generate_signed_quote_pdf(self, quote, signature, project, company, output_dir: str) -> str:
        """Generate a signed version of the quote PDF with signature"""
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            # Create signed filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_filename = f"signed_quote_{quote.quote_number}_{timestamp}.pdf"
            pdf_path = os.path.join(output_dir, pdf_filename)
            
            # Generate HTML content with signature info
            html_content = self._generate_signed_html_content(quote, signature, project, company)
            
            HTML(string=html_content).write_pdf(
                pdf_path,
                stylesheets=[CSS(string=self._get_professional_pdf_styles())]
            )
            
            self.logger.info(f"✅ Signed quote PDF generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            self.logger.error(f"❌ Signed quote PDF generation failed: {e}")
            raise

    def _generate_signed_html_content(self, quote, signature, project, company) -> str:
        """Generate HTML content for signed quote with signature details"""
        # Get the base content
        base_content = self._generate_professional_html_content(quote, project, company)
        
        # Add signature section to the content
        signature_section = f"""
        <div class="signature-confirmation">
            <h2 style="color: #28a745; text-align: center; font-size: 16px; margin: 20px 0;">
                ✅ DIGITALLY SIGNED QUOTE
            </h2>
            <div class="signature-details" style="background-color: #e8f5e8; border: 2px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #155724; margin-top: 0;">Signature Details:</h3>
                <table style="width: 100%; font-size: 10px;">
                    <tr>
                        <td><strong>Signed by:</strong></td>
                        <td>{signature.client_name}</td>
                    </tr>
                    <tr>
                        <td><strong>Email:</strong></td>
                        <td>{signature.client_email}</td>
                    </tr>
                    <tr>
                        <td><strong>Signed on:</strong></td>
                        <td>{signature.signed_at.strftime('%B %d, %Y at %I:%M %p')}</td>
                    </tr>
                    <tr>
                        <td><strong>IP Address:</strong></td>
                        <td>{signature.ip_address or 'Not recorded'}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td style="color: #28a745; font-weight: bold;">ACCEPTED</td>
                    </tr>
                </table>
            </div>
        </div>
        """
        
        # Insert signature section after the header
        signed_content = base_content.replace(
            '<div class="contact-section">',
            signature_section + '<div class="contact-section">'
        )
        
        return signed_content

    # Alias for backwards compatibility
    def generate_quote_pdf(self, quote, project, company, output_dir: str) -> str:
        """Alias for generate_enhanced_quote_pdf"""
        return self.generate_enhanced_quote_pdf(quote, project, company, output_dir)
    
    def _generate_professional_html_content(self, quote, project, company) -> str:
        """Generate HTML content with company-specific logo and complete interior/exterior details"""
        
        # Get client info safely
        try:
            if hasattr(project, 'get_client_info'):
                client_info = project.get_client_info()
            else:
                client_info = {
                    'company_name': project.client_name,
                    'contact_name': project.client_name,
                    'email': project.client_email,
                    'phone': project.client_phone,
                    'address': project.client_address,
                }
        except Exception as e:
            self.logger.warning(f"Error getting client info: {e}")
            client_info = {
                'company_name': getattr(project, 'client_name', 'Client Name'),
                'contact_name': getattr(project, 'client_name', 'Contact Name'),
                'email': getattr(project, 'client_email', ''),
                'phone': getattr(project, 'client_phone', ''),
                'address': getattr(project, 'client_address', ''),
            }
        
        # Process measurement details and organize room work
        measurement_details = quote.measurement_details or {}
        rooms_data = measurement_details.get('rooms', [])
        interior_items = measurement_details.get('interior_items', {})
        exterior_items = measurement_details.get('exterior_items', {})
        special_jobs = measurement_details.get('special_jobs', [])
        
        # Organize line items by room for proper display
        rooms_work = {}
        other_work = []
        
        for item in quote.line_items or []:
            if item.get('category') == 'room_work' and item.get('room'):
                room_name = item['room']
                if room_name not in rooms_work:
                    rooms_work[room_name] = {
                        'wall_items': [],
                        'ceiling_items': [],
                        'room_data': None,
                        'wall_area': 0,
                        'ceiling_area': 0
                    }
                
                if item.get('surface') == 'walls':
                    rooms_work[room_name]['wall_items'].append(item)
                    rooms_work[room_name]['wall_area'] = max(
                        rooms_work[room_name]['wall_area'], 
                        item.get('quantity', 0)
                    )
                elif item.get('surface') == 'ceiling':
                    rooms_work[room_name]['ceiling_items'].append(item)
                    rooms_work[room_name]['ceiling_area'] = max(
                        rooms_work[room_name]['ceiling_area'], 
                        item.get('quantity', 0)
                    )
            else:
                other_work.append(item)
        
        # Add room data from measurement_details
        for room_data in rooms_data:
            room_name = room_data.get('name')
            if room_name in rooms_work:
                rooms_work[room_name]['room_data'] = room_data
                # Update areas from measurement data if available
                rooms_work[room_name]['wall_area'] = max(
                    rooms_work[room_name]['wall_area'],
                    float(room_data.get('total_wall_area', 0) or room_data.get('walls_surface_m2', 0))
                )
                rooms_work[room_name]['ceiling_area'] = max(
                    rooms_work[room_name]['ceiling_area'],
                    float(room_data.get('total_ceiling_area', 0) or room_data.get('area_m2', 0))
                )
        
        # Calculate VAT rate for display
        vat_rate = 20  # Default 20%
        if hasattr(company, 'vat_rate'):
            vat_rate = (company.vat_rate or 0.20) * 100
        elif quote.subtotal > 0:
            vat_rate = (quote.vat_amount / quote.subtotal) * 100
        
        # Download company-specific logo
        logo_data = self._download_company_logo(company)
        logo_base64 = ""
        if logo_data:
            import base64
            logo_base64 = base64.b64encode(logo_data).decode()
            self.logger.info(f"Company logo encoded for PDF (size: {len(logo_base64)} chars)")
        
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quotation: {{ quote.quote_number }}</title>
        </head>
        <body>
            <div class="quote-container">
                <!-- Header Section with Company Logo -->
                <div class="header-section">
                    <div class="header-content">
                        <div class="logo-section">
                            {% if logo_base64 %}
                            <img src="data:image/png;base64,{{ logo_base64 }}" alt="{{ company.name }} Logo" class="company-logo">
                            {% else %}
                            <div class="company-name-fallback">
                                <h2>{{ company.name }}</h2>
                            </div>
                            {% endif %}
                        </div>
                        <div class="quote-info">
                            <h1 class="quote-title">Quotation: {{ quote.quote_number }}</h1>
                            <div class="quote-dates">
                                <p>Quotation Date: {{ quote.created_at.strftime('%d/%m/%Y') if quote.created_at else datetime.now().strftime('%d/%m/%Y') }}</p>
                                <p>Valid Until: {{ quote.valid_until.strftime('%d/%m/%Y') if quote.valid_until else (datetime.now() + timedelta(days=30)).strftime('%d/%m/%Y') }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Client and Company Information -->
                <div class="contact-section">
                    <div class="client-info">
                        <h2>{{ client_info.company_name or client_info.contact_name or 'Client Name' }}</h2>
                        <p>{{ client_info.address or project.property_address or 'Client Address' }}</p>
                        <p>{{ project.property_address or 'Property Address' }}</p>
                        {% if client_info.email %}
                        <p>Email: {{ client_info.email }}</p>
                        {% endif %}
                        {% if client_info.phone %}
                        <p>Phone: {{ client_info.phone }}</p>
                        {% endif %}
                    </div>
                    
                    <div class="company-info">
                        <h2>{{ company.name or 'Company' }}</h2>
                        {% if company.address %}
                        <p>{{ company.address }}</p>
                        {% endif %}
                        {% if company.vat_number %}
                        <p>VAT No: {{ company.vat_number }}</p>
                        {% endif %}
                        {% if company.phone %}
                        <p>Phone: {{ company.phone }}</p>
                        {% endif %}
                        {% if company.email %}
                        <p>Email: {{ company.email }}</p>
                        {% endif %}
                        {% if company.website %}
                        <p>Website: {{ company.website }}</p>
                        {% endif %}
                    </div>
                </div>

                <!-- Project Description Section -->
                <div class="description-section">
                    <h2>Project Description</h2>
                    
                    {%- if rooms_work %}
                    <!-- Room-by-room breakdown -->
                    {%- for room_name, room_work in rooms_work.items() %}
                    <div class="room-description">
                        <h3>- {{ room_name }} ({{ room_work.wall_area|round(0) }}m² walls{% if room_work.ceiling_area > 0 %}, {{ room_work.ceiling_area|round(0) }}m² ceiling{% endif %}):</h3>
                        <ul class="work-list">
                            {%- for item in room_work.wall_items %}
                            <li>{{ item.treatment|replace('_', ' ')|title }}: {{ item.quantity|round(1) }}m² wall area</li>
                            {%- endfor %}
                            {%- for item in room_work.ceiling_items %}
                            <li>{{ item.treatment|replace('_', ' ')|title }}: {{ item.quantity|round(1) }}m² ceiling area</li>
                            {%- endfor %}
                        </ul>
                    </div>
                    {%- endfor %}
                    {%- endif %}
                    
                    <!-- Interior Work Section with Selective Details -->
                    {%- if interior_items %}
                    <div class="work-item">
                        <h3>- Interior Work:</h3>
                        <ul class="work-list">
                            {%- for item_type, items in interior_items.items() %}
                                {%- if items %}
                                    {%- for item in items %}
                                    <li><strong>{{ item_type|replace('_', ' ')|title }}:</strong> {{ item.description or (item_type|replace('_', ' ')|title) }} (Qty: {{ item.quantity }})</li>
                                    {%- if item.condition_name %}
                                    <li class="item-details">• Condition: {{ item.condition_name }}</li>
                                    {%- endif %}
                                    <li class="item-details">• Unit Price: €{{ "%.2f"|format(item.unit_price or 0) }}</li>
                                    {%- if item.steps and item.steps|length > 0 %}
                                    <li class="preparation-steps">
                                        <strong>Preparation Steps:</strong>
                                        <ol class="steps-list">
                                            {%- for step in item.steps %}
                                            <li>{{ step }}</li>
                                            {%- endfor %}
                                        </ol>
                                    </li>
                                    {%- endif %}
                                    {%- if item.notes %}
                                    <li class="item-details">• Notes: {{ item.notes }}</li>
                                    {%- endif %}
                                    {%- endfor %}
                                {%- endif %}
                            {%- endfor %}
                        </ul>
                    </div>
                    {%- endif %}
                    
                    <!-- Exterior Work Section with Selective Details -->
                    {%- if exterior_items %}
                    <div class="work-item">
                        <h3>- Exterior Work:</h3>
                        <ul class="work-list">
                            {%- for item_type, items in exterior_items.items() %}
                                {%- if items %}
                                    {%- for item in items %}
                                    <li><strong>{{ item_type|replace('_', ' ')|title }}:</strong> {{ item.description or (item_type|replace('_', ' ')|title) }} (Qty: {{ item.quantity }})</li>
                                    {%- if item.condition_name %}
                                    <li class="item-details">• Condition: {{ item.condition_name }}</li>
                                    {%- endif %}
                                    <li class="item-details">• Unit Price: €{{ "%.2f"|format(item.unit_price or 0) }}</li>
                                    {%- if item.steps and item.steps|length > 0 %}
                                    <li class="preparation-steps">
                                        <strong>Preparation Steps:</strong>
                                        <ol class="steps-list">
                                            {%- for step in item.steps %}
                                            <li>{{ step }}</li>
                                            {%- endfor %}
                                        </ol>
                                    </li>
                                    {%- endif %}
                                    {%- if item.notes %}
                                    <li class="item-details">• Notes: {{ item.notes }}</li>
                                    {%- endif %}
                                    {%- if item.weatherproof %}
                                    <li class="item-details">• Weather resistant coating applied</li>
                                    {%- endif %}
                                    {%- endfor %}
                                {%- endif %}
                            {%- endfor %}
                        </ul>
                    </div>
                    {%- endif %}
                    
                    <!-- Special Jobs Section with Detailed Process Steps -->
                    {%- if special_jobs and special_jobs|length > 0 %}
                    <div class="work-item">
                        <h3>- Special Jobs & Conditions:</h3>
                        <ul class="work-list">
                            {%- for job in special_jobs %}
                            <li><strong>{{ job.name }}:</strong> {{ job.description or job.name }} (Qty: {{ job.quantity }} {{ job.unit or 'job(s)' }})</li>
                            <li class="item-details">• Unit Price: €{{ "%.2f"|format(job.unit_price or 0) }}</li>
                            <li class="item-details">• Total Cost: €{{ "%.2f"|format(job.total_cost or 0) }}</li>
                            {%- if job.location %}
                            <li class="item-details">• Location: {{ job.location }}</li>
                            {%- endif %}
                            {%- if job.difficulty and job.difficulty != 'Standard' %}
                            <li class="item-details">• Difficulty: {{ job.difficulty }}</li>
                            {%- endif %}
                            {%- if job.estimated_hours and job.estimated_hours > 0 %}
                            <li class="item-details">• Estimated Hours: {{ job.estimated_hours }}</li>
                            {%- endif %}
                            {%- if job.materials_included %}
                            <li class="item-details">• Materials included in price</li>
                            {%- endif %}
                            {%- if job.steps and job.steps|length > 0 %}
                            <li class="preparation-steps">
                                <strong>Process Steps for {{ job.name }}:</strong>
                                <ol class="steps-list">
                                    {%- for step in job.steps %}
                                    <li>{{ step }}</li>
                                    {%- endfor %}
                                </ol>
                            </li>
                            {%- endif %}
                            {%- if job.notes %}
                            <li class="item-details">• Notes: {{ job.notes }}</li>
                            {%- endif %}
                            {%- endfor %}
                        </ul>
                    </div>
                    {%- endif %}
                </div>

                <!-- Summary Table -->
                <div class="summary-section">
                    <h2>Summary Table</h2>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Quantity</th>
                                <th>Description</th>
                                <th>Amount (excl. VAT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for item in quote.line_items %}
                            <tr>
                                <td>{{ item.quantity|round(0) }}</td>
                                <td>{{ item.description }}</td>
                                <td>€{{ "%.2f"|format(item.total) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                        <tfoot>
                            <tr class="subtotal-row">
                                <td colspan="2"><strong>Total excl. VAT</strong></td>
                                <td><strong>€{{ "%.2f"|format(quote.subtotal) }}</strong></td>
                            </tr>
                            <tr class="vat-row">
                                <td colspan="2"><strong>VAT ({{ "%.0f"|format(vat_rate) }}%)</strong></td>
                                <td><strong>€{{ "%.2f"|format(quote.vat_amount) }}</strong></td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="2"><strong>Total incl. VAT</strong></td>
                                <td><strong>€{{ "%.2f"|format(quote.total_amount) }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Terms and Conditions -->
                <div class="terms-section">
                    {% if company.quote_terms_conditions %}
                    <p class="terms-text">{{ company.quote_terms_conditions }}</p>
                    {% else %}
                    <p class="terms-text">The price includes all materials, labor, travel costs, and leaving the site clean.</p>
                    {% endif %}
                    <p class="terms-text">This quotation is valid until {{ quote.valid_until.strftime('%d/%m/%Y') if quote.valid_until else (datetime.now() + timedelta(days=30)).strftime('%d/%m/%Y') }}. Please return a signed copy if you wish to proceed.</p>
                </div>
                
                <!-- Company Footer Text -->
                {% if company.quote_footer_text %}
                <div class="footer-section">
                    <p class="footer-text">{{ company.quote_footer_text }}</p>
                </div>
                {% endif %}
                
                <!-- Digital Signature Section -->
                <div class="signature-section">
                    <div class="signature-box">
                        <p><strong>Client Acceptance:</strong></p>
                        <p>By signing below, I accept the terms and conditions of this quotation.</p>
                        <div class="signature-line">
                            <div class="signature-field">
                                <p>Digital Signature: _____________________</p>
                                <p>Date: _____________________</p>
                            </div>
                        </div>                        
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(
            quote=quote,
            project=project,
            company=company,
            client_info=client_info,
            rooms_work=rooms_work,
            other_work=other_work,
            interior_items=interior_items,
            exterior_items=exterior_items,
            special_jobs=special_jobs,
            vat_rate=vat_rate,
            logo_base64=logo_base64,
            datetime=datetime,
            timedelta=timedelta
        )
    
    def _get_professional_pdf_styles(self) -> str:
        """Professional CSS styles with logo support and detailed formatting"""
        return """
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .quote-container {
            max-width: 100%;
        }
        
        /* Header Section with Logo */
        .header-section {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section {
            flex: 0 0 150px;
        }
        
        .company-logo {
            max-width: 150px;
            max-height: 80px;
            height: auto;
            width: auto;
        }
        
        .company-name-fallback {
            max-width: 150px;
        }
        
        .company-name-fallback h2 {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin: 0;
            text-align: left;
        }
        
        .quote-info {
            text-align: right;
            flex: 1;
        }
        
        .quote-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        
        .quote-dates p {
            margin: 2px 0;
            font-size: 11px;
        }
        
        /* Contact Section */
        .contact-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .client-info, .company-info {
            width: 45%;
        }
        
        .client-info h2, .company-info h2 {
            font-size: 13px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .client-info p, .company-info p {
            margin: 2px 0;
            font-size: 10px;
            line-height: 1.3;
        }
        
        /* Description Section */
        .description-section {
            margin-bottom: 30px;
        }
        
        .description-section h2 {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            background-color: #e8e8e8;
            padding: 8px 12px;
            margin: 0 0 15px 0;
            border-radius: 3px;
        }
        
        .room-description, .work-item {
            margin-bottom: 20px;
        }
        
        .room-description h3, .work-item h3 {
            font-size: 11px;
            font-weight: bold;
            margin: 0 0 8px 0;
            color: #333;
        }
        
        .work-list {
            margin: 5px 0 10px 20px;
            padding: 0;
        }
        
        .work-list li {
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 4px;
        }
        
        .item-details {
            font-size: 9px !important;
            color: #666 !important;
            margin-left: 15px !important;
            margin-bottom: 2px !important;
        }
        
        .preparation-steps {
            margin-top: 8px !important;
            margin-bottom: 12px !important;
        }
        
        .preparation-steps strong {
            font-size: 9px;
            color: #444;
        }
        
        .steps-list {
            margin: 4px 0 0 20px;
            padding: 0;
        }
        
        .steps-list li {
            font-size: 8px !important;
            line-height: 1.3 !important;
            margin-bottom: 2px !important;
            color: #555;
        }
        
        /* Summary Section */
        .summary-section {
            margin-bottom: 30px;
        }
        
        .summary-section h2 {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            background-color: #e8e8e8;
            padding: 8px 12px;
            margin: 0 0 15px 0;
            border-radius: 3px;
        }
        
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        
        .summary-table th {
            background-color: #f5f5f5;
            padding: 8px 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ccc;
        }
        
        .summary-table td {
            padding: 6px 10px;
            border: 1px solid #ccc;
            vertical-align: top;
        }
        
        .summary-table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .summary-table tfoot tr {
            background-color: #f0f0f0;
        }
        
        .summary-table tfoot td {
            font-weight: bold;
            padding: 8px 10px;
        }
        
        .total-row {
            background-color: #e0e0e0 !important;
        }
        
        .total-row td {
            font-size: 11px;
            font-weight: bold;
        }
        
        /* Terms Section */
        .terms-section {
            margin-bottom: 30px;
        }
        
        .terms-text {
            font-size: 10px;
            line-height: 1.4;
            margin: 5px 0;
        }
        
        /* Footer Section */
        .footer-section {
            margin-bottom: 20px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        .footer-text {
            font-size: 10px;
            line-height: 1.4;
            margin: 5px 0;
            font-style: italic;
            color: #666;
        }
        
        /* Digital Signature Section */
        .signature-section {
            margin-top: 40px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        
        .signature-box {
            border: 2px solid #333;
            padding: 15px;
            border-radius: 5px;
        }
        
        .signature-box p {
            margin: 5px 0;
            font-size: 10px;
        }
        
        .signature-line {
            margin: 15px 0;
        }
        
        .signature-field p {
            margin: 10px 0;
            font-size: 10px;
        }
        
        .digital-signature-info {
            margin-top: 15px;
            background-color: #f0f8ff;
            padding: 10px;
            border-radius: 3px;
        }
        
        .digital-signature-info p {
            margin: 3px 0;
            font-size: 9px;
        }
        
        /* Signature Confirmation */
        .signature-confirmation {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .signature-details {
            font-size: 10px;
        }
        
        .signature-details table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .signature-details td {
            padding: 4px 8px;
            border-bottom: 1px solid #d0d0d0;
        }
        
        /* Print Optimization */
        @media print {
            .quote-container {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .signature-section {
                page-break-inside: avoid;
            }
            
            .work-item {
                page-break-inside: avoid;
            }
            
            .preparation-steps {
                page-break-inside: avoid;
            }
            
            .signature-confirmation {
                page-break-inside: avoid;
            }
        }
        """