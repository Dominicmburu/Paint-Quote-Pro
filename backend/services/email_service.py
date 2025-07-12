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
                    <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/dashboard" 
                       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Get Started
                    </a>
                </div>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>The Paint Quote Pro Team</p>
            </div>
            
            <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
                <p>Paint Quote Pro - Professional Painting Quote Software</p>
                <p>© 2025 Paint Quote Pro. All rights reserved.</p>
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

def send_payment_success_email(email: str, first_name: str, company_name: str, plan_name: str, billing_cycle: str, amount: float):
    """Send payment success confirmation email"""
    try:
        mail = Mail(current_app)
        
        subject = f"Payment Successful - Welcome to {plan_name.title()}!"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
                <h1>🎉 Payment Successful!</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Hi {first_name},</h2>
                
                <p>Great news! Your payment has been processed successfully and your {plan_name.title()} subscription is now active.</p>
                
                <div style="background-color: #ECFDF5; border: 1px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #059669; margin-top: 0;">Subscription Details</h3>
                    <p><strong>Company:</strong> {company_name}</p>
                    <p><strong>Plan:</strong> {plan_name.title()}</p>
                    <p><strong>Amount:</strong> £{amount:.2f}</p>
                    <p><strong>Billing:</strong> {billing_cycle.title()}</p>
                </div>
                
                <h3>What's next?</h3>
                <ul>
                    <li>Access your dashboard and start creating projects</li>
                    <li>Upload floor plans for AI analysis</li>
                    <li>Generate professional quotes instantly</li>
                    <li>Customize your company branding</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
                       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
                
                <p>Your receipt and billing details are available in your account settings.</p>
                
                <p>Thank you for choosing Paint Quote Pro!</p>
                
                <p>Best regards,<br>The Paint Quote Pro Team</p>
            </div>
            
            <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
                <p>Paint Quote Pro - Professional Painting Quote Software</p>
                <p>Need help? Contact us at support@paintquotepro.com</p>
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
        logger.info(f"Payment success email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send payment success email: {e}")
        raise


def send_payment_failed_email(email: str, first_name: str, company_name: str, plan_name: str, attempt_count: int):
    """Send payment failure notification email"""
    try:
        mail = Mail(current_app)
        
        subject = "Payment Issue - Let's Get You Back on Track"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #EF4444; color: white; padding: 20px; text-align: center;">
                <h1>Payment Issue</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Hi {first_name},</h2>
                
                <p>We encountered an issue processing your payment for the {plan_name.title()} plan.</p>
                
                <div style="background-color: #FEF2F2; border: 1px solid #EF4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #DC2626; margin-top: 0;">What happened?</h3>
                    <p>Payment attempt #{attempt_count} was unsuccessful. This can happen for various reasons:</p>
                    <ul>
                        <li>Insufficient funds</li>
                        <li>Card expired or declined</li>
                        <li>Bank security restrictions</li>
                        <li>Incorrect billing information</li>
                    </ul>
                </div>
                
                <h3>What can you do?</h3>
                <ul>
                    <li>Check your card details and try again</li>
                    <li>Contact your bank to authorize the payment</li>
                    <li>Update your payment method</li>
                    <li>Contact our support team for assistance</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/subscription/billing" 
                       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Update Payment Method
                    </a>
                </div>
                
                {"<p><strong>Important:</strong> If we can't process your payment after 4 attempts, your subscription will be cancelled automatically.</p>" if attempt_count >= 3 else ""}
                
                <p>Don't worry - your data is safe and we're here to help resolve this quickly.</p>
                
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
        logger.info(f"Payment failed email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send payment failed email: {e}")
        raise


def send_subscription_cancelled_email(email: str, first_name: str, company_name: str, cancellation_reason: str):
    """Send subscription cancellation confirmation email"""
    try:
        mail = Mail(current_app)
        
        subject = "Subscription Cancelled - We'll Miss You"
        
        reason_text = {
            'payment_failed': 'due to failed payment attempts',
            'user_cancelled': 'as requested',
            'expired': 'due to expiration'
        }.get(cancellation_reason, 'as requested')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #F59E0B; color: white; padding: 20px; text-align: center;">
                <h1>Subscription Cancelled</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Hi {first_name},</h2>
                
                <p>Your Paint Quote Pro subscription has been cancelled {reason_text}.</p>
                
                <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #D97706; margin-top: 0;">What this means:</h3>
                    <ul>
                        <li>Your data is preserved for 90 days</li>
                        <li>You can reactivate anytime during this period</li>
                        <li>All projects and quotes remain accessible (read-only)</li>
                        <li>You won't be charged further</li>
                    </ul>
                </div>
                
                <h3>Miss us already?</h3>
                <p>You can reactivate your subscription at any time and pick up exactly where you left off.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/subscription" 
                       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reactivate Subscription
                    </a>
                </div>
                
                <p>We'd love to hear your feedback on how we can improve. Feel free to reach out to our team.</p>
                
                <p>Thank you for being part of the Paint Quote Pro community!</p>
                
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
        logger.info(f"Subscription cancelled email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send subscription cancelled email: {e}")
        raise


# def send_quote_email(client_email: str, quote, project, company):
#     """Send quote to client"""
#     try:
#         mail = Mail(current_app)
        
#         subject = f"Paint Quote #{quote.quote_number} from {company.name}"
        
#         html_body = f"""
#         <html>
#         <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
#             <div style="background-color: #7C3AED; color: white; padding: 20px; text-align: center;">
#                 <h1>Paint Quote</h1>
#             </div>
            
#             <div style="padding: 30px;">
#                 <h2>Quote for {project.name}</h2>
                
#                 <p>Dear {project.client_name or 'Valued Customer'},</p>
                
#                 <p>Thank you for your interest in our painting services. Please find attached your detailed quote.</p>
                
#                 <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
#                     <h3>Quote Summary</h3>
#                     <p><strong>Quote Number:</strong> {quote.quote_number}</p>
#                     <p><strong>Project:</strong> {project.name}</p>
#                     <p><strong>Total Amount:</strong> £{quote.total_amount:.2f}</p>
#                     <p><strong>Valid Until:</strong> {quote.valid_until.strftime('%B %d, %Y')}</p>
#                 </div>
                
#                 <p>This quote includes all materials and labor as specified in the attached document.</p>
                
#                 <p>If you have any questions or would like to discuss this quote, please don't hesitate to contact us.</p>
                
#                 <p>We look forward to working with you!</p>
                
#                 <p>Best regards,<br>{company.name}<br>
#                 {company.phone or ''}<br>
#                 {company.email or ''}</p>
#             </div>
#         </body>
#         </html>
#         """
        
#         msg = Message(
#             subject=subject,
#             recipients=[client_email],
#             html=html_body
#         )
        
#         # Attach PDF if it exists
#         if quote.pdf_path and os.path.exists(quote.pdf_path):
#             with open(quote.pdf_path, 'rb') as f:
#                 msg.attach(
#                     filename=f"quote_{quote.quote_number}.pdf",
#                     content_type="application/pdf",
#                     data=f.read()
#                 )
        
#         mail.send(msg)
#         logger.info(f"Quote email sent to {client_email}")
        
#     except Exception as e:
#         logger.error(f"Failed to send quote email: {e}")
#         raise


def send_quote_email(client_email: str, quote, project, company):
    """Send quote to client with comprehensive PDF attachment logging"""
    try:
        mail = Mail(current_app)
        
        subject = f"Paint Quote #{quote.quote_number} from {company.name}"
        
        # 📧 LOG: Starting quote email process
        logger.info(f"📧 Starting quote email to {client_email} for quote #{quote.quote_number}")
        
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
        
        # 📎 LOG: PDF attachment process
        pdf_attachment_log = {
            'attempted_paths': [],
            'successful_attachment': False,
            'attached_file': None,
            'file_size_bytes': 0,
            'errors': []
        }
        
        # Try multiple PDF path sources
        pdf_paths_to_try = [
            ('quote.pdf_path', quote.pdf_path if hasattr(quote, 'pdf_path') else None),
            ('project.quote_pdf_path', project.quote_pdf_path if hasattr(project, 'quote_pdf_path') else None)
        ]
        
        logger.info(f"📎 Checking PDF paths for quote #{quote.quote_number}")
        
        for path_source, pdf_path in pdf_paths_to_try:
            pdf_attachment_log['attempted_paths'].append({
                'source': path_source,
                'path': pdf_path,
                'exists': bool(pdf_path and os.path.exists(pdf_path))
            })
            
            logger.info(f"📋 Checking {path_source}: {pdf_path} (exists: {bool(pdf_path and os.path.exists(pdf_path))})")
            
            if pdf_path and os.path.exists(pdf_path):
                try:
                    logger.info(f"📎 Attempting to attach PDF from {path_source}: {pdf_path}")
                    
                    with open(pdf_path, 'rb') as f:
                        pdf_data = f.read()
                        msg.attach(
                            filename=f"quote_{quote.quote_number}.pdf",
                            content_type="application/pdf",
                            data=pdf_data
                        )
                    
                    pdf_attachment_log['successful_attachment'] = True
                    pdf_attachment_log['attached_file'] = pdf_path
                    pdf_attachment_log['file_size_bytes'] = len(pdf_data)
                    
                    logger.info(f"✅ PDF attached successfully from {path_source}: {pdf_path} ({len(pdf_data)} bytes)")
                    break
                    
                except Exception as e:
                    error_msg = f"Failed to attach PDF from {path_source}: {str(e)}"
                    pdf_attachment_log['errors'].append(error_msg)
                    logger.warning(f"⚠️ {error_msg}")
        
        # 📎 LOG: Final PDF attachment status
        if not pdf_attachment_log['successful_attachment']:
            logger.warning(f"⚠️ No PDF could be attached to quote email for quote #{quote.quote_number}")
            logger.warning(f"📋 PDF attachment summary: {pdf_attachment_log}")
        else:
            logger.info(f"✅ PDF attachment successful for quote #{quote.quote_number}")
        
        # 📤 LOG: Sending email
        logger.info(f"📤 Sending quote email to {client_email} (PDF attached: {pdf_attachment_log['successful_attachment']})")
        
        mail.send(msg)
        
        # 📧 LOG: Email sent successfully
        logger.info(f"✅ Quote email sent successfully to {client_email}")
        logger.info(f"📊 Email summary - Quote: #{quote.quote_number}, PDF attached: {pdf_attachment_log['successful_attachment']}, File size: {pdf_attachment_log['file_size_bytes']} bytes")
        
        return {
            'success': True,
            'email_sent': True,
            'pdf_attached': pdf_attachment_log['successful_attachment'],
            'pdf_details': pdf_attachment_log
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to send quote email to {client_email}: {e}")
        logger.error(f"📋 PDF attachment log: {pdf_attachment_log}")
        raise











