import unittest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.template.loader import render_to_string
from task_management.views.dashboard_views import generate_otp, get_otp_file_path
from task_management.utils.message_service import MessageService
import os
import time
from datetime import datetime
from django.conf import settings


class OTPVerificationPhase3Tests(TestCase):
    def setUp(self):
        """Setup run before every test method."""
        self.client = Client()
        self.User = get_user_model()
        
        # Create test user
        self.test_user = self.User.objects.create_user(
            username='testuser',
            email='test@example.com',
            phone='1234567890',
            password='testpass123'
        )
        
        # Force login
        self.client.force_login(self.test_user)
        
        # Clean up any existing OTP files
        self.cleanup_otp_files()

    def tearDown(self):
        """Cleanup run after every test method."""
        self.cleanup_otp_files()

    def cleanup_otp_files(self):
        """Helper method to clean up OTP files"""
        otp_dir = os.path.join(settings.BASE_DIR, 'temp_otp')
        if os.path.exists(otp_dir):
            for file in os.listdir(otp_dir):
                if file.startswith('testuser_'):
                    try:
                        os.remove(os.path.join(otp_dir, file))
                    except:
                        pass

    def test_email_template_rendering(self):
        """Test if email template renders correctly with OTP"""
        otp = "123456"
        html_content = render_to_string('task_management/emails/otp_email.html', {'otp': otp})
        
        # Check for required elements
        expected_elements = [
            "Welcome to SynergyPro",
            "123456",
            "expire in 5 minutes",
            "verification code"
        ]

        for element in expected_elements:
            self.assertIn(element.lower(), html_content.lower())

        print(f"""
        Email Template Test Results:
        Template Rendering: {'✓' if all(e.lower() in html_content.lower() for e in expected_elements) else '✗'}
        OTP Present: {'✓' if otp in html_content else '✗'}
        Styling Applied: {'✓' if 'style' in html_content.lower() else '✗'}
        """)

    def test_email_sending(self):
        """Test email sending functionality"""
        message_service = MessageService()
        result = message_service.send_otp_email(self.test_user.email, "123456")

        print(f"""
        Email Sending Test Results:
        Send Success: {'✓' if result['success'] else '✗'}
        Response: {result['message']}
        """)

        self.assertTrue(result['success'])

    def test_sms_logging(self):
        """Test SMS logging functionality"""
        message_service = MessageService()
        result = message_service.send_otp_sms(self.test_user.phone, "123456")

        print(f"""
        SMS Logging Test Results:
        Log Success: {'✓' if result['success'] else '✗'}
        Response: {result['message']}
        """)

        self.assertTrue(result['success'])

    def test_otp_generation_with_messaging(self):
        """Test OTP generation with message sending"""
        # Test email OTP
        email_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        
        # Test mobile OTP
        self.test_user.last_verification_attempt = None
        self.test_user.save()
        mobile_response = self.client.post(reverse('generate_otp'), {'type': 'mobile'})

        print(f"""
        OTP Generation with Messaging Test Results:
        Email OTP Generation: {'✓' if email_response.status_code == 200 else '✗'}
        Mobile OTP Generation: {'✓' if mobile_response.status_code == 200 else '✗'}
        Email Response: {email_response.content}
        Mobile Response: {mobile_response.content}
        """)

    def test_verification_after_message(self):
        """Test verification process after message sending"""
        # Generate and get OTP
        gen_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        file_path = get_otp_file_path(self.test_user, 'email')
        
        stored_otp = None
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                stored_otp = f.read().split(':')[0]

        # Verify OTP
        verify_response = None
        if stored_otp:
            verify_response = self.client.post(reverse('verify_otp'), {
                'type': 'email',
                'otp': stored_otp
            })

        print(f"""
        Verification After Message Test Results:
        OTP Generated: {'✓' if gen_response.status_code == 200 else '✗'}
        OTP Retrieved: {'✓' if stored_otp else '✗'}
        Verification Success: {'✓' if verify_response and verify_response.status_code == 200 else '✗'}
        Response: {verify_response.content if verify_response else 'No response'}
        """)

    def test_message_service_errors(self):
        """Test message service error handling"""
        message_service = MessageService()
        
        # Test with invalid email
        invalid_email_result = message_service.send_otp_email("invalid-email", "123456")
        
        # Test with invalid phone
        invalid_phone_result = message_service.send_otp_sms("invalid-phone", "123456")

        print(f"""
        Message Service Error Handling Test Results:
        Invalid Email Handled: {'✓' if not invalid_email_result['success'] else '✗'}
        Invalid Phone Handled: {'✓' if not invalid_phone_result['success'] else '✗'}
        Email Error: {invalid_email_result['message']}
        Phone Error: {invalid_phone_result['message']}
        """)

    def test_complete_verification_flow_with_messages(self):
        """Test complete verification flow including message sending"""
        # Test both email and mobile verification
        for verification_type in ['email', 'mobile']:
            # Reset verification attempt time
            self.test_user.last_verification_attempt = None
            self.test_user.save()
            
            # Generate OTP
            gen_response = self.client.post(reverse('generate_otp'), {'type': verification_type})
            
            # Get OTP
            file_path = get_otp_file_path(self.test_user, verification_type)
            stored_otp = None
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    stored_otp = f.read().split(':')[0]
            
            # Verify OTP
            verify_response = None
            if stored_otp:
                verify_response = self.client.post(reverse('verify_otp'), {
                    'type': verification_type,
                    'otp': stored_otp
                })

            print(f"""
            Complete Flow Test Results for {verification_type}:
            OTP Generation: {'✓' if gen_response.status_code == 200 else '✗'}
            Message Sent: {'✓' if stored_otp else '✗'}
            Verification: {'✓' if verify_response and verify_response.status_code == 200 else '✗'}
            Response: {verify_response.content if verify_response else 'No response'}
            """)

    def test_email_validation_edge_cases(self):
        """Test email validation with various edge cases"""
        message_service = MessageService()
        test_cases = [
            {
                "email": "",  # Empty email
                "expected_success": False
            },
            {
                "email": "test@",  # Incomplete email
                "expected_success": False
            },
            {
                "email": "@example.com",  # Missing username
                "expected_success": False
            },
            {
                "email": "test@example",  # Missing domain
                "expected_success": False
            },
            {
                "email": "test.example.com",  # Missing @
                "expected_success": False
            }
        ]

        for case in test_cases:
            result = message_service.send_otp_email(case['email'], "123456")
            print(f"""
            Email Validation Test for {case['email']}:
            Expected Success: {case['expected_success']}
            Actual Success: {result['success']}
            Error Message: {result['message']}
            """)
            self.assertEqual(result['success'], case['expected_success'])

    def test_phone_validation_edge_cases(self):
        """Test phone number validation with various edge cases"""
        message_service = MessageService()
        test_cases = [
            {
                "phone": "",  # Empty phone
                "expected_success": False
            },
            {
                "phone": "abc123",  # Non-numeric
                "expected_success": False
            },
            {
                "phone": "123",  # Too short
                "expected_success": False
            },
            {
                "phone": "12345678901234567890",  # Too long
                "expected_success": False
            }
        ]

        for case in test_cases:
            result = message_service.send_otp_sms(case['phone'], "123456")
            print(f"""
            Phone Validation Test for {case['phone']}:
            Expected Success: {case['expected_success']}
            Actual Success: {result['success']}
            Error Message: {result['message']}
            """)
            self.assertEqual(result['success'], case['expected_success'])

    def test_otp_expiry(self):
        """Test OTP expiry functionality"""
        # Generate OTP
        gen_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        file_path = get_otp_file_path(self.test_user, 'email')
        
        # Read OTP
        stored_otp = None
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read().strip()
                stored_otp = content.split(':')[0]
        
        # Wait for 301 seconds (OTP expires after 300 seconds)
        print("Waiting for OTP to expire...")
        time.sleep(61)
        
        # Try to verify expired OTP
        verify_response = None
        if stored_otp:
            verify_response = self.client.post(reverse('verify_otp'), {
                'type': 'email',
                'otp': stored_otp
            })

        print(f"""
        OTP Expiry Test Results:
        OTP Generated: {'✓' if gen_response.status_code == 200 else '✗'}
        Expired OTP Rejection: {'✓' if verify_response and verify_response.status_code == 400 else '✗'}
        Response: {verify_response.content if verify_response else 'No response'}
        """)

    def test_multiple_otp_requests(self):
        """Test multiple OTP requests within cooldown period"""
        # First request
        first_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        
        # Immediate second request (should fail due to cooldown)
        second_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        
        # Wait for cooldown
        time.sleep(61)
        
        # Third request after cooldown (should succeed)
        third_response = self.client.post(reverse('generate_otp'), {'type': 'email'})

        print(f"""
        Multiple OTP Requests Test Results:
        First Request: {'✓' if first_response.status_code == 200 else '✗'}
        Second Request (Expected Failure): {'✓' if second_response.status_code == 400 else '✗'}
        Third Request (After Cooldown): {'✓' if third_response.status_code == 200 else '✗'}
        Responses:
        First: {first_response.content}
        Second: {second_response.content}
        Third: {third_response.content}
        """)

    def test_invalid_otp_attempts(self):
        """Test invalid OTP verification attempts"""
        # Generate valid OTP first
        gen_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        
        test_cases = [
            {
                "otp": "",  # Empty OTP
                "expected_status": 400
            },
            {
                "otp": "12345",  # Too short
                "expected_status": 400
            },
            {
                "otp": "1234567",  # Too long
                "expected_status": 400
            },
            {
                "otp": "abcdef",  # Non-numeric
                "expected_status": 400
            },
            {
                "otp": "000000",  # Wrong OTP
                "expected_status": 400
            }
        ]

        for case in test_cases:
            verify_response = self.client.post(reverse('verify_otp'), {
                'type': 'email',
                'otp': case['otp']
            })
            
            print(f"""
            Invalid OTP Test for {case['otp']}:
            Expected Status: {case['expected_status']}
            Actual Status: {verify_response.status_code}
            Response: {verify_response.content}
            """)
            
            self.assertEqual(verify_response.status_code, case['expected_status'])

    def test_concurrent_verification_types(self):
        """Test handling of concurrent email and mobile verification"""
        # Generate OTP for both email and mobile
        email_gen = self.client.post(reverse('generate_otp'), {'type': 'email'})
        
        # Reset verification attempt time for mobile
        self.test_user.last_verification_attempt = None
        self.test_user.save()
        
        mobile_gen = self.client.post(reverse('generate_otp'), {'type': 'mobile'})
        
        # Get both OTPs
        email_otp = None
        mobile_otp = None
        
        email_path = get_otp_file_path(self.test_user, 'email')
        mobile_path = get_otp_file_path(self.test_user, 'mobile')
        
        if os.path.exists(email_path):
            with open(email_path, 'r') as f:
                email_otp = f.read().split(':')[0]
                
        if os.path.exists(mobile_path):
            with open(mobile_path, 'r') as f:
                mobile_otp = f.read().split(':')[0]
        
        # Verify both
        email_verify = None
        mobile_verify = None
        
        if email_otp:
            email_verify = self.client.post(reverse('verify_otp'), {
                'type': 'email',
                'otp': email_otp
            })
            
        if mobile_otp:
            mobile_verify = self.client.post(reverse('verify_otp'), {
                'type': 'mobile',
                'otp': mobile_otp
            })

        print(f"""
        Concurrent Verification Test Results:
        Email Generation: {'✓' if email_gen.status_code == 200 else '✗'}
        Mobile Generation: {'✓' if mobile_gen.status_code == 200 else '✗'}
        Email Verification: {'✓' if email_verify and email_verify.status_code == 200 else '✗'}
        Mobile Verification: {'✓' if mobile_verify and mobile_verify.status_code == 200 else '✗'}
        Email Response: {email_verify.content if email_verify else 'No response'}
        Mobile Response: {mobile_verify.content if mobile_verify else 'No response'}
        """)

if __name__ == '__main__':
    unittest.main(verbosity=2)