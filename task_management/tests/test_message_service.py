import unittest
from unittest.mock import patch, MagicMock
from django.core.exceptions import ValidationError
from django.conf import settings
from myapp.services import MessageService  # Update with the actual import path

class TestMessageService(unittest.TestCase):

    @patch('myapp.services.send_mail')  # Mock the send_mail function
    @patch('myapp.services.render_to_string')  # Mock the render_to_string function
    def test_send_otp_email_valid(self, mock_render_to_string, mock_send_mail):
        mock_render_to_string.return_value = '<p>Your OTP is 123456</p>'
        mock_send_mail.return_value = 1  # Simulate successful email sending

        response = MessageService.send_otp_email('test@example.com', '123456')

        print("Test: test_send_otp_email_valid")
        print(f"Response: {response}")

        self.assertTrue(response['success'])
        self.assertEqual(response['message'], 'Email sent successfully')
        mock_render_to_string.assert_called_once_with('task_management/emails/otp_email.html', {'otp': '123456'})
        mock_send_mail.assert_called_once()

    def test_send_otp_email_invalid_email(self):
        response = MessageService.send_otp_email('invalid-email', '123456')

        print("Test: test_send_otp_email_invalid_email")
        print(f"Response: {response}")

        self.assertFalse(response['success'])
        self.assertEqual(response['message'], 'Invalid email format')

    @patch('myapp.services.print')  # Mock the print function for SMS simulation
    def test_send_otp_sms_valid(self, mock_print):
        phone_number = '1234567890'
        otp = '654321'
        response = MessageService.send_otp_sms(phone_number, otp)

        print("Test: test_send_otp_sms_valid")
        print(f"Response: {response}")

        self.assertTrue(response['success'])
        self.assertEqual(response['message'], 'SMS sent successfully (simulated)')
        mock_print.assert_called_once_with(
            f"SMS would be sent to {phone_number}: Welcome to SynergyPro! 🌟\n\n"
            f"Your verification code is: {otp}\n\n"
            f"This code will expire in 5 minutes.\n"
            f"If you didn't request this code, please ignore this message."
        )

    def test_send_otp_sms_invalid_phone_number(self):
        invalid_numbers = ['abc123', '', '123']
        for number in invalid_numbers:
            response = MessageService.send_otp_sms(number, '654321')

            print("Test: test_send_otp_sms_invalid_phone_number")
            print(f"Phone Number: {number}")
            print(f"Response: {response}")

            self.assertFalse(response['success'])
            self.assertEqual(response['message'], 'Invalid phone number format')

if __name__ == '__main__':
    unittest.main()
