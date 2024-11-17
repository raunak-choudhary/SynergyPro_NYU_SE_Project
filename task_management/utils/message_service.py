from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags
from django.conf import settings

class MessageService:
    @staticmethod
    def send_otp_email(email, otp):
        """
        Send OTP via email with custom HTML template
        """
        try:
            validate_email(email)
            # Render HTML template
            html_message = render_to_string('task_management/emails/otp_email.html', {
                'otp': otp
            })
            
            # Create plain text version
            plain_message = strip_tags(html_message)
            
            # Send email
            send_mail(
                subject='SynergyPro Email Verification',
                message=plain_message,
                html_message=html_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
            
            return {
                'success': True,
                'message': 'Email sent successfully'
            }
            
        except ValidationError:
            return {
            'success': False,
            'message': 'Invalid email format'
        }

    @staticmethod
    def send_otp_sms(phone_number, otp):
        """
        Send OTP via SMS (Simulated for now)
        """
        try:
            # Basic phone number validation
            cleaned_number = ''.join(filter(str.isdigit, str(phone_number)))
            if not cleaned_number or len(cleaned_number) < 10:
                return {
                    'success': False,
                    'message': 'Invalid phone number format'
                }

            # Format SMS message
            message = (
                f"Welcome to SynergyPro! 🌟\n\n"
                f"Your verification code is: {otp}\n\n"
                f"This code will expire in 5 minutes.\n"
                f"If you didn't request this code, please ignore this message."
            )
            
            # Log the message (simulated sending)
            print(f"SMS would be sent to {phone_number}: {message}")
            
            # For testing purposes, always return success
            return {
                'success': True,
                'message': 'SMS sent successfully (simulated)'
            }
            
        except Exception:
            return {
            'success': False,
            'message': 'Invalid phone number format'
        }