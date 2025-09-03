import os
from flask import current_app, render_template_string
from flask_mail import Mail, Message
import logging
from datetime import datetime


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


# def send_quote_with_signature_link(client_email: str, client_name: str, quote, company, signature_url: str, pdf_path: str = None):
#     """Send quote email with PDF attachment and signature link"""
#     try:
#         from flask_mail import Mail, Message
#         from email.mime.base import MIMEBase
#         from email import encoders
#         import os
        
#         mail = Mail(current_app)
        
#         subject = f"Quote #{quote.quote_number} - {company.name}"
        
#         # Create multipart message
#         msg = Message(
#             subject=subject,
#             recipients=[client_email],
#             sender=current_app.config.get('MAIL_DEFAULT_SENDER')
#         )
        
#         # HTML body with signature button
#         html_body = f"""
#         <html>
#         <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
#             <div style="background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
#                 <h1 style="margin: 0; font-size: 28px;">Quote Ready for Signature</h1>
#                 <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
#                     From {company.name}
#                 </p>
#             </div>
            
#             <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
#                 <h2 style="color: #1e293b; margin-top: 0;">Dear {client_name},</h2>
                
#                 <p style="color: #475569; font-size: 16px; line-height: 1.6;">
#                     Thank you for your interest in our services. We have prepared a detailed quote for your project.
#                 </p>
                
#                 <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
#                     <h3 style="color: #1e293b; margin-top: 0;">Quote Details</h3>
#                     <table style="width: 100%; border-collapse: collapse;">
#                         <tr>
#                             <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Quote Number:</td>
#                             <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{quote.quote_number}</td>
#                         </tr>
#                         <tr>
#                             <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Project:</td>
#                             <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{quote.project.name}</td>
#                         </tr>
#                         <tr>
#                             <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Total Amount:</td>
#                             <td style="padding: 8px 0; color: #059669; font-weight: 700; font-size: 18px;">€{quote.total_amount:,.2f}</td>
#                         </tr>
#                         <tr>
#                             <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Valid Until:</td>
#                             <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{quote.valid_until.strftime('%B %d, %Y')}</td>
#                         </tr>
#                     </table>
#                 </div>
                
#                 <div style="text-align: center; margin: 30px 0;">
#                     <a href="{signature_url}" 
#                        style="display: inline-block; background-color: #059669; color: white; padding: 15px 30px; 
#                               text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
#                         📝 SIGN QUOTE ONLINE
#                     </a>
#                 </div>
                
#                 <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
#                     <h4 style="color: #047857; margin-top: 0;">Quick & Secure Digital Signing</h4>
#                     <ul style="color: #065f46; margin: 0; padding-left: 20px;">
#                         <li>Review the complete quote details</li>
#                         <li>Sign digitally with your mouse or finger</li>
#                         <li>Get instant confirmation</li>
#                         <li>Legally binding electronic signature</li>
#                     </ul>
#                 </div>
                
#                 <p style="color: #475569; font-size: 14px; line-height: 1.6;">
#                     📎 <strong>Quote PDF is attached</strong> for your records. You can also download it from the signing page.
#                 </p>
                
#                 <p style="color: #475569; font-size: 16px; line-height: 1.6;">
#                     If you have any questions about this quote, please don't hesitate to contact us.
#                 </p>
                
#                 <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
#                     <p style="color: #475569; margin: 0;">
#                         <strong>Best regards,</strong><br>
#                         {company.name}<br>
#                         {company.phone or ''}<br>
#                         {company.email or ''}
#                     </p>
#                 </div>
#             </div>
            
#             <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
#                 <p style="margin: 0;">
#                     This is an automated message from {company.name}.<br>
#                     Quote generated on {datetime.now().strftime('%B %d, %Y')}
#                 </p>
#             </div>
#         </body>
#         </html>
#         """
        
#         msg.html = html_body
        
#         # Attach PDF if available
#         if pdf_path and os.path.exists(pdf_path):
#             try:
#                 with open(pdf_path, "rb") as attachment:
#                     msg.attach(
#                         filename=f"quote_{quote.quote_number}.pdf",
#                         content_type="application/pdf",
#                         data=attachment.read()
#                     )
                
#                 current_app.logger.info(f"📎 PDF attached to email: {pdf_path}")
                
#             except Exception as e:
#                 current_app.logger.warning(f"Failed to attach PDF: {e}")
        
#         # Send email
#         mail.send(msg)
#         current_app.logger.info(f"📧 Quote email sent successfully to {client_email}")
        
#     except Exception as e:
#         current_app.logger.error(f"Failed to send quote email: {e}")
#         raise


def send_quote_with_signature_link_frontend(client_email: str, client_name: str, quote, company, frontend_url: str, pdf_path: str = None):
    """Send quote email with PDF attachment and frontend signature link"""
    try:

        current_app.logger.info(f"Sending quote email to {client_email}, {client_name}, {quote}, {company}, {frontend_url}, {pdf_path} for quote #{quote.quote_number}")


        from flask_mail import Mail, Message
        
        mail = Mail(current_app)
        
        # Frontend signature URL instead of backend
        signature_url = f"{frontend_url}/quotes/{quote.id}/sign"
        
        subject = f"Quote #{quote.quote_number} - {company.name}"
        
        
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Quote Ready for Signature</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    From {company.name}
                </p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Dear {client_name},</h2>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Thank you for your interest in our services. We have prepared a detailed quote for your project.
                </p>
                
                <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1e293b; margin-top: 0;">Quote Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Quote Number:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{quote.quote_number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Project:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{quote.project.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Total Amount:</td>
                            <td style="padding: 8px 0; color: #059669; font-weight: 700; font-size: 18px;">£{quote.total_amount:,.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Valid Until:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">{quote.valid_until.strftime('%B %d, %Y')}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{signature_url}" 
                       style="display: inline-block; background-color: #059669; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        📝 SIGN QUOTE ONLINE
                    </a>
                </div>
                
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h4 style="color: #047857; margin-top: 0;">Quick & Secure Digital Signing</h4>
                    <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                        <li>Review the complete quote details</li>
                        <li>Sign digitally with your mouse or finger</li>
                        <li>Get instant confirmation</li>
                        <li>Legally binding electronic signature</li>
                    </ul>
                </div>
                
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    📎 <strong>Quote PDF is attached</strong> for your records. You can also download it from the signing page.
                </p>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    If you have any questions about this quote, please don't hesitate to contact us.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #475569; margin: 0;">
                        <strong>Best regards,</strong><br>
                        {company.name}<br>
                        {company.phone or ''}<br>
                        {company.email or ''}
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">
                    This is an automated message from {company.name}.<br>
                    Quote generated on {datetime.now().strftime('%B %d, %Y')}
                </p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[client_email],
            html=html_body,
            # sender=current_app.config.get('MAIL_DEFAULT_SENDER')
        )
        
        # Attach PDF if available
        if pdf_path and os.path.exists(pdf_path):
            try:
                with open(pdf_path, "rb") as attachment:
                    msg.attach(
                        filename=f"quote_{quote.quote_number}.pdf",
                        content_type="application/pdf",
                        data=attachment.read()
                    )
                current_app.logger.info(f"📎 PDF attached to email: {pdf_path}")
            except Exception as e:
                current_app.logger.warning(f"Failed to attach PDF: {e}")
        
        mail.send(msg)
        current_app.logger.info(f"📧 Quote email sent successfully to {client_email}")
        
    except Exception as e:
        current_app.logger.error(f"Failed to send quote email: {e}")
        raise

def send_email(to_email, subject, html_content, from_name=None):
    """Send email using Flask-Mail"""
    try:
        # Initialize Flask-Mail
        mail = Mail(current_app)
        
        # Set sender
        sender = current_app.config.get('MAIL_USERNAME')
        if from_name:
            sender = f"{from_name} <{sender}>"
        
        # Create message
        msg = Message(
            subject=subject,
            sender=sender,
            recipients=[to_email]
        )
        
        msg.html = html_content
        
        # Send email
        mail.send(msg)
        logger.info(f"Email sent successfully to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise e


def send_simple_test_email(client_email, company):
    """Send a simple test email"""
    
    # Email content
    subject = "Testing Email"
    
    html_content = f"""
    <html>
    <body>
        <h2>Testing Email</h2>
        <p>Hello!</p>
        <p>This is a test email from {company.name}.</p>
        <p>If you received this, the email system is working.</p>
        <hr>
        <p>Best regards,<br>{company.name}</p>
    </body>
    </html>
    """
    
    # Send email using your existing email setup
    send_email(
        to_email=client_email,
        subject=subject,
        html_content=html_content,
        from_name=company.name
    )






# def send_signature_confirmation_email(client_email: str, client_name: str, quote):
#     """Send signature confirmation email to client"""
#     try:
#         mail = Mail(current_app)
        
#         subject = f"Quote Signed Successfully - {quote.project.company.name}"
        
#         html_body = f"""
#         <html>
#         <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
#             <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
#                 <h1>✅ Quote Signed Successfully!</h1>
#             </div>
            
#             <div style="padding: 30px;">
#                 <h2>Dear {client_name},</h2>
                
#                 <p>Thank you for digitally signing our quote! We have received your acceptance and are excited to work with you.</p>
                
#                 <div style="background-color: #e8f5e8; border: 1px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0;">
#                     <h3 style="color: #1e7e34; margin-top: 0;">Quote Details</h3>
#                     <p><strong>Quote Number:</strong> {quote.quote_number}</p>
#                     <p><strong>Project:</strong> {quote.project.name}</p>
#                     <p><strong>Total Amount:</strong> €{quote.total_amount:.2f}</p>
#                     <p><strong>Signed On:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
#                 </div>
                
#                 <h3>What Happens Next?</h3>
#                 <ul>
#                     <li>Our team will review your signed quote within 1 business day</li>
#                     <li>A project coordinator will contact you to schedule the work</li>
#                     <li>We'll confirm all details and start dates with you directly</li>
#                     <li>All work will be completed according to the specifications in your quote</li>
#                 </ul>
                
#                 <div style="text-align: center; margin: 30px 0;">
#                     <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/quotes/{quote.id}/pdf" 
#                        style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
#                         Download Signed Quote PDF
#                     </a>
#                 </div>
                
#                 <p>Your digital signature has been securely recorded and has the same legal validity as a handwritten signature.</p>
                
#                 <p>If you have any questions, please don't hesitate to contact us.</p>
                
#                 <p>Best regards,<br>{quote.project.company.name}<br>
#                 {quote.project.company.phone or ''}<br>
#                 {quote.project.company.email or ''}</p>
#             </div>
            
#             <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
#                 <p>This is an automated confirmation of your digital signature.</p>
#                 <p>© 2025 {quote.project.company.name}. All rights reserved.</p>
#             </div>
#         </body>
#         </html>
#         """
        
#         msg = Message(
#             subject=subject,
#             recipients=[client_email],
#             html=html_body
#         )
        
#         mail.send(msg)
#         logger.info(f"Signature confirmation email sent to {client_email}")
        
#     except Exception as e:
#         logger.error(f"Failed to send signature confirmation email: {e}")
#         raise

# services/email_service.py - Fix email templates
def send_signature_confirmation_email(client_email: str, client_name: str, quote):
    """Send signature confirmation email to client"""
    try:
        mail = Mail(current_app)
        
        subject = f"Quote Signed Successfully - {quote.project.company.name}"
        
        # Get the correct download URL
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        pdf_view_url = f"{frontend_url}/quotes/{quote.id}/pdf"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                <h1>✅ Quote Signed Successfully!</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Dear {client_name},</h2>
                
                <p>Thank you for digitally signing our quote! We have received your acceptance and are excited to work with you.</p>
                
                <div style="background-color: #e8f5e8; border: 1px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1e7e34; margin-top: 0;">Quote Details</h3>
                    <p><strong>Quote Number:</strong> {quote.quote_number}</p>
                    <p><strong>Project:</strong> {quote.project.name}</p>
                    <p><strong>Total Amount:</strong> £{quote.total_amount:.2f}</p>
                    <p><strong>Signed On:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <h3>What Happens Next?</h3>
                <ul>
                    <li>Our team will review your signed quote within 1 business day</li>
                    <li>A project coordinator will contact you to schedule the work</li>
                    <li>We'll confirm all details and start dates with you directly</li>
                    <li>All work will be completed according to the specifications in your quote</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{pdf_view_url}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Download Signed Quote PDF
                    </a>
                </div>
                
                <p>Your digital signature has been securely recorded and has the same legal validity as a handwritten signature.</p>
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>{quote.project.company.name}<br>
                {quote.project.company.phone or ''}<br>
                {quote.project.company.email or ''}</p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[client_email],
            html=html_body
        )
        
        mail.send(msg)
        logger.info(f"Signature confirmation email sent to {client_email}")
        
    except Exception as e:
        logger.error(f"Failed to send signature confirmation email: {e}")
        raise


def send_quote_signed_notification_email(company_email: str, company_name: str, quote, client_name: str):
    """Send quote signed notification to company"""
    try:
        mail = Mail(current_app)
        
        subject = f"🎉 Quote #{quote.quote_number} Signed by {client_name}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                <h1>🎉 Quote Accepted!</h1>
            </div>
            
            <div style="padding: 30px;">
                <h2>Great news!</h2>
                
                <p>Quote #{quote.quote_number} has been digitally signed and accepted by your client.</p>
                
                <div style="background-color: #e8f5e8; border: 1px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1e7e34; margin-top: 0;">Project Details</h3>
                    <p><strong>Client:</strong> {client_name}</p>
                    <p><strong>Project:</strong> {quote.project.name}</p>
                    <p><strong>Quote Number:</strong> {quote.quote_number}</p>
                    <p><strong>Total Amount:</strong> €{quote.total_amount:.2f}</p>
                    <p><strong>Property:</strong> {quote.project.property_address}</p>
                    <p><strong>Client Email:</strong> {quote.project.client_email}</p>
                    <p><strong>Client Phone:</strong> {quote.project.client_phone or 'Not provided'}</p>
                </div>
                
                <h3>Next Steps:</h3>
                <ul>
                    <li>Contact the client to schedule the project</li>
                    <li>Confirm all project details and timeline</li>
                    <li>Begin work as specified in the accepted quote</li>
                    <li>Update project status in your dashboard</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/projects/{quote.project.id}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View Project Details
                    </a>
                </div>
                
                <p>The client's digital signature has been securely recorded with IP address and timestamp for your records.</p>
                
                <p>Congratulations on winning this project!</p>
                
                <p>Best regards,<br>Paint Quote Pro System</p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[company_email],
            html=html_body
        )
        
        mail.send(msg)
        logger.info(f"Quote signed notification sent to {company_email}")
        
    except Exception as e:
        logger.error(f"Failed to send quote signed notification: {e}")
        raise













