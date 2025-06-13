import os
from flask import current_app, render_template_string
from flask_mail import Mail, Message
import logging

logger = logging.getLogger(__name__)

def send_welcome_email(email: str, first_name: str, company_name: str):
    """Send welcome email to new user"""
    try:
        mail = Mail(current_app)
        
        subject = f"Welcome to Paint Quote Pro, {first_name}!"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #7C3AED; color: white; padding: 20px; text-align: center;">
                <h1>Welcome to Paint Quote Pro!</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Hi {first_name},</h2>
                
                <p>Welcome to Paint Quote Pro! We're excited to have {company_name} join our community of professional painters.</p>
                
                <p>Your account is now set up and you can start creating professional paint quotes right away.</p>
                
                <h3>What's next?</h3>
                <ul>
                    <li>Upload your first floor plan</li>
                    <li>Let our AI analyze the surface areas</li>
                    <li>Generate your first professional quote</li>
                    <li>Customize your company settings and branding</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
                       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Get Started
                    </a>
                </div>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>The Paint Quote Pro Team</p>
            </div>
            
            <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
                <p>Paint Quote Pro - Professional Painting Quote Software</p>
                <p>© 2024 Paint Quote Pro. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[email],
            html=html_body
        )
        
        mail.send(msg)
        logger.info(f"Welcome email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
        raise

def send_password_reset_email(email: str, first_name: str, reset_token: str):
    """Send password reset email"""
    try:
        mail = Mail(current_app)
        
        subject = "Reset your Paint Quote Pro password"
        reset_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}&email={email}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #7C3AED; color: white; padding: 20px; text-align: center;">
                <h1>Password Reset</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Hi {first_name},</h2>
                
                <p>You requested to reset your password for Paint Quote Pro.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
                
                <p>This link will expire in 24 hours for security reasons.</p>
                
                <p>Best regards,<br>The Paint Quote Pro Team</p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[email],
            html=html_body
        )
        
        mail.send(msg)
        logger.info(f"Password reset email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise

def send_quote_email(client_email: str, quote, project, company):
    """Send quote to client"""
    try:
        mail = Mail(current_app)
        
        subject = f"Paint Quote #{quote.quote_number} from {company.name}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #7C3AED; color: white; padding: 20px; text-align: center;">
                <h1>Paint Quote</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Quote for {project.name}</h2>
                
                <p>Dear {project.client_name or 'Valued Customer'},</p>
                
                <p>Thank you for your interest in our painting services. Please find attached your detailed quote.</p>
                
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Quote Summary</h3>
                    <p><strong>Quote Number:</strong> {quote.quote_number}</p>
                    <p><strong>Project:</strong> {project.name}</p>
                    <p><strong>Total Amount:</strong> £{quote.total_amount:.2f}</p>
                    <p><strong>Valid Until:</strong> {quote.valid_until.strftime('%B %d, %Y')}</p>
                </div>
                
                <p>This quote includes all materials and labor as specified in the attached document.</p>
                
                <p>If you have any questions or would like to discuss this quote, please don't hesitate to contact us.</p>
                
                <p>We look forward to working with you!</p>
                
                <p>Best regards,<br>{company.name}<br>
                {company.phone or ''}<br>
                {company.email or ''}</p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[client_email],
            html=html_body
        )
        
        # Attach PDF if it exists
        if quote.pdf_path and os.path.exists(quote.pdf_path):
            with open(quote.pdf_path, 'rb') as f:
                msg.attach(
                    filename=f"quote_{quote.quote_number}.pdf",
                    content_type="application/pdf",
                    data=f.read()
                )
        
        mail.send(msg)
        logger.info(f"Quote email sent to {client_email}")
        
    except Exception as e:
        logger.error(f"Failed to send quote email: {e}")
        raise