import unittest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from task_management.views.dashboard_views import generate_otp, get_otp_file_path
import os
import time
from datetime import datetime
from django.conf import settings

class OTPVerificationTests(TestCase):
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

    def test_otp_generation(self):
        """Test OTP generation functionality"""
        # Test 1: OTP Format
        otp = generate_otp()
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

        # Test 2: Unique OTPs
        otp2 = generate_otp()
        self.assertNotEqual(otp, otp2)

        print(f"""
        OTP Generation Test Results:
        First OTP: {otp}
        Second OTP: {otp2}
        Length Check: {'✓' if len(otp) == 6 else '✗'}
        Numeric Check: {'✓' if otp.isdigit() else '✗'}
        Uniqueness Check: {'✓' if otp != otp2 else '✗'}
        """)

    def test_file_storage(self):
        """Test OTP file storage functionality"""
        # Test file path generation
        email_path = get_otp_file_path(self.test_user, 'email')
        mobile_path = get_otp_file_path(self.test_user, 'mobile')

        # Generate OTP and ensure file is created
        response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        
        print(f"""
        File Storage Test Results:
        Email Path: {email_path}
        Mobile Path: {mobile_path}
        Directory Exists: {'✓' if os.path.exists(os.path.dirname(email_path)) else '✗'}
        File Created: {'✓' if os.path.exists(email_path) else '✗'}
        """)

    def test_email_otp_generation(self):
        """Test email OTP generation endpoint"""
        email_response = self.client.post(reverse('generate_otp'), {'type': 'email'})

        print(f"""
        Email OTP Generation Test Results:
        Status: {'✓' if email_response.status_code == 200 else '✗'}
        Response: {email_response.content}
        """)
        
        self.assertEqual(email_response.status_code, 200)

    def test_mobile_otp_generation(self):
        """Test mobile OTP generation endpoint"""
        # Reset verification attempt time to avoid cooldown
        self.test_user.last_verification_attempt = None
        self.test_user.save()
        
        mobile_response = self.client.post(reverse('generate_otp'), {'type': 'mobile'})

        print(f"""
        Mobile OTP Generation Test Results:
        Status: {'✓' if mobile_response.status_code == 200 else '✗'}
        Response: {mobile_response.content}
        """)
        
        self.assertEqual(mobile_response.status_code, 200)

    def test_invalid_otp_type(self):
        """Test invalid OTP type handling"""
        invalid_response = self.client.post(reverse('generate_otp'), {'type': 'invalid'})

        print(f"""
        Invalid OTP Type Test Results:
        Status: {'✓' if invalid_response.status_code == 400 else '✗'}
        Response: {invalid_response.content}
        """)
        
        self.assertEqual(invalid_response.status_code, 400)

    def test_verification_flow(self):
        """Test complete verification flow"""
        # Generate OTP
        gen_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        self.assertEqual(gen_response.status_code, 200)
        
        # Read OTP from file
        file_path = get_otp_file_path(self.test_user, 'email')
        stored_otp = None
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read().strip()
                try:
                    stored_otp = content.split(':')[0]
                except Exception as e:
                    print(f"Error reading OTP file: {e}, Content: {content}")
        
        self.assertIsNotNone(stored_otp)

        # Test correct OTP
        verify_response = self.client.post(reverse('verify_otp'), {
            'type': 'email',
            'otp': stored_otp
        })
        self.assertEqual(verify_response.status_code, 200)

        print(f"""
        Verification Flow Test Results:
        OTP Generated: {'✓' if gen_response.status_code == 200 else '✗'}
        OTP Retrieved: {'✓' if stored_otp else '✗'}
        Correct OTP Verification: {'✓' if verify_response.status_code == 200 else '✗'}
        Generated OTP: {stored_otp}
        Verification Response: {verify_response.content if verify_response else 'No verification response'}
        """)

    def test_edge_cases(self):
        """Test edge cases"""
        # Test cooldown period
        first_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        second_response = self.client.post(reverse('generate_otp'), {'type': 'email'})

        # Test already verified
        self.test_user.mark_email_verified()
        verified_response = self.client.post(reverse('generate_otp'), {'type': 'email'})

        # Test missing parameters
        missing_response = self.client.post(reverse('verify_otp'), {'type': 'email'})

        print(f"""
        Edge Cases Test Results:
        Cooldown Check: {'✓' if second_response.status_code == 400 else '✗'}
        Already Verified Check: {'✓' if verified_response.status_code == 400 else '✗'}
        Missing Parameters Check: {'✓' if missing_response.status_code == 400 else '✗'}
        """)

    def test_file_cleanup(self):
        """Test OTP file cleanup"""
        # Generate OTP
        gen_response = self.client.post(reverse('generate_otp'), {'type': 'email'})
        file_path = get_otp_file_path(self.test_user, 'email')
        
        # Wait briefly for file creation
        time.sleep(0.1)
        
        # Verify file exists
        file_exists_before = os.path.exists(file_path)
        
        # Read OTP
        stored_otp = None
        if file_exists_before:
            with open(file_path, 'r') as f:
                content = f.read().strip()
                stored_otp = content.split(':')[0]
        
        # Verify OTP
        verify_response = None
        if stored_otp:
            verify_response = self.client.post(reverse('verify_otp'), {
                'type': 'email',
                'otp': stored_otp
            })
            # Wait briefly for file deletion
            time.sleep(0.1)
        
        # Multiple checks for file existence
        file_exists_after = False
        try:
            file_exists_after = os.path.exists(file_path) and os.path.getsize(file_path) > 0
        except:
            file_exists_after = False

        print(f"""
        File Cleanup Test Results:
        File Created: {'✓' if file_exists_before else '✗'}
        File Deleted: {'✓' if not file_exists_after else '✗'}
        OTP Used: {stored_otp}
        Verification Response: {verify_response.content if verify_response else 'No verification attempted'}
        File Path: {file_path}
        File Exists Before: {file_exists_before}
        File Exists After: {file_exists_after}
        """)
        
        # Assertions
        self.assertTrue(file_exists_before, "File should be created initially")
        self.assertFalse(file_exists_after, "File should be deleted after verification")

    

if __name__ == '__main__':
    unittest.main(verbosity=2)