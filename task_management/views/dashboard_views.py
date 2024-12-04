from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import os
import time
from django.conf import settings
from django.views.decorators.http import require_http_methods
import base64
from PIL import Image
from io import BytesIO
import random
from datetime import datetime, timedelta
from ..utils.message_service import MessageService
from .auth_views import get_dashboard_url

@login_required
def profile_view(request):
    if request.method == 'POST':
        try:
            # Handle image upload
            if request.FILES.get('profile_image'):
                image = request.FILES['profile_image']
                
                # Validate image type
                if not image.content_type.startswith('image/'):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid file type. Please upload an image.'
                    }, status=400)
                
                # Check file size (limit to 5MB)
                if image.size > 5 * 1024 * 1024:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Image size should be less than 5MB.'
                    }, status=400)
                
                # Create media/profile_images directory if it doesn't exist
                profile_path = os.path.join(settings.MEDIA_ROOT, 'profile_images')
                os.makedirs(profile_path, exist_ok=True)
                
                # Generate unique filename
                ext = image.name.split('.')[-1].lower()
                if ext not in ['jpg', 'jpeg', 'png', 'gif']:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid image format. Use JPG, PNG, or GIF.'
                    }, status=400)
                
                filename = f'profile_{request.user.id}.{ext}'
                filepath = os.path.join('profile_images', filename)
                
                # Save the file
                full_path = os.path.join(settings.MEDIA_ROOT, filepath)
                
                # Delete old file if exists
                if request.user.profile_image:
                    old_path = os.path.join(settings.MEDIA_ROOT, str(request.user.profile_image))
                    if os.path.exists(old_path):
                        os.remove(old_path)
                
                # Save new file
                with open(full_path, 'wb+') as destination:
                    for chunk in image.chunks():
                        destination.write(chunk)
                
                # Update user profile
                request.user.profile_image = filepath
                request.user.save()
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Profile image updated successfully',
                    'image_url': request.user.profile_image.url
                })
            
            # Handle other profile updates
            if request.POST.get('university_name') and request.user.profile_type in ['student', 'teacher']:
                request.user.university_name = request.POST.get('university_name')
                request.user.save()
            elif request.POST.get('organization_name'):
                request.user.organization_name = request.POST.get('organization_name')
                request.user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Profile updated successfully'
            })
            
        except Exception as e:
            print(f"Error in profile update: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'An error occurred while updating profile'
            }, status=500)
    
    return render(request, 'task_management/dashboard/profile.html')

@login_required
def individual_freelancer_dashboard(request):
    if request.user.user_type != 'individual' or request.user.profile_type != 'freelancer':
        # Redirect to appropriate dashboard if wrong user type
        return redirect(get_dashboard_url(request.user))
    
    context = {
        'user': request.user,
        'active_projects': 5,
        'pending_deliverables': 3,
        'completed_projects': 12,
        'email_verified': request.user.email_verified,
        'mobile_verified': request.user.mobile_verified
    }
    return render(request, 'task_management/dashboard/individual_freelancer_dashboard.html', context)

@login_required
def individual_student_dashboard(request):
    if request.user.user_type != 'individual' or request.user.profile_type != 'student':
        # Redirect to appropriate dashboard if wrong user type
        return redirect(get_dashboard_url(request.user))
    
    context = {
        'user': request.user,
        'total_tasks': 24,
        'in_progress': 8,
        'completed': 16,
        'email_verified': request.user.email_verified,
        'mobile_verified': request.user.mobile_verified
    }
    return render(request, 'task_management/dashboard/individual_student_dashboard.html', context)

@login_required
@require_http_methods(["POST"])
def upload_profile_image(request):
    try:
        image_file = request.FILES.get('image')
        if not image_file:
            return JsonResponse({'error': 'No image provided'}, status=400)
        
        # Get file extension
        ext = os.path.splitext(image_file.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png']:
            return JsonResponse({'error': 'Invalid file format'}, status=400)
        
        # Create filename using username
        filename = f"{request.user.username}{ext}"
        
        # Full path
        filepath = os.path.join(settings.MEDIA_ROOT, 'profile_images', filename)
        
        # Remove old image if exists
        if request.user.profile_image:
            old_path = request.user.profile_image.path
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Save new image
        request.user.profile_image.save(filename, image_file, save=True)
        request.user.save()  # Force save the user object
        
        # Generate a cache-busting URL
        image_url = f"{request.user.profile_image.url}?v={int(time.time())}"
        
        return JsonResponse({
            'success': True,
            'image_url': image_url
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def capture_profile_image(request):
    try:
        # Get base64 image data
        image_data = request.POST.get('image')
        if not image_data:
            return JsonResponse({'error': 'No image data provided'}, status=400)
        
        # Remove data URL prefix
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        # Convert to image
        image_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(image_bytes))
        
        # Create filename
        filename = f"{request.user.username}.jpg"
        
        # Remove old image if exists
        if request.user.profile_image:
            old_path = request.user.profile_image.path
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Process and save new image
        output = BytesIO()
        # Convert to RGB if image is in RGBA mode
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        img.save(output, format='JPEG', quality=85)
        output.seek(0)
        
        request.user.profile_image.save(filename, output, save=True)
        
        return JsonResponse({
            'success': True,
            'image_url': request.user.profile_image.url
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def get_otp_file_path(user, verification_type):
    """Generate path for OTP storage file"""
    # Create directory if it doesn't exist
    otp_dir = os.path.join(settings.BASE_DIR, 'temp_otp')
    os.makedirs(otp_dir, exist_ok=True)
    
    # Generate filename based on user and verification type
    filename = f"{user.username}_{verification_type}_otp.txt"
    return os.path.join(otp_dir, filename)

@login_required
@require_http_methods(["POST"])
def generate_verification_otp(request):
    try:
        print("Request received for OTP generation")
        print("POST data:", request.POST)
        verification_type = request.POST.get('type')
        print(f"Verification type: {verification_type}")

        ATTEMPT_LIMIT = 3  # Maximum attempts allowed
        COOLDOWN_MINUTES = 15  # Cooldown period in minutes

        current_time = datetime.now()
        
        if not verification_type:
            return JsonResponse({
                'status': 'error',
                'message': 'Verification type is required'
            }, status=400)
        
        if verification_type not in ['email', 'mobile']:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid verification type'
            }, status=400)

        # Check if already verified
        if verification_type == 'email' and request.user.email_verified:
            return JsonResponse({
                'status': 'error',
                'message': 'Email already verified'
            }, status=400)
        elif verification_type == 'mobile' and request.user.mobile_verified:
            return JsonResponse({
                'status': 'error',
                'message': 'Mobile number already verified'
            }, status=400)

        # Check if can attempt verification
        if not request.user.can_verify_again(waiting_time_minutes=1):
            return JsonResponse({
                'status': 'error',
                'message': 'Please wait before requesting another OTP'
            }, status=400)
        
        attempts = request.session.get('verification_attempts', {})
        verification_key = f"{verification_type}_verification"

        if verification_key not in attempts:
            attempts[verification_key] = {
                'count': 0,
                'last_attempt': None,
                'cooldown_until': None
            }
        
        attempt_info = attempts[verification_key]

        # Check if user is in cooldown period
        if attempt_info['cooldown_until']:
            cooldown_until = datetime.fromisoformat(attempt_info['cooldown_until'])
            if current_time < cooldown_until:
                remaining_minutes = int((cooldown_until - current_time).total_seconds() / 60)
                return JsonResponse({
                    'status': 'error',
                    'message': f'Please wait {remaining_minutes} minutes before requesting another OTP'
                }, status=400)
        
        # Check attempt count
        if attempt_info['count'] >= ATTEMPT_LIMIT:
            # Set cooldown period
            cooldown_until = current_time + timedelta(minutes=COOLDOWN_MINUTES)
            attempt_info['cooldown_until'] = cooldown_until.isoformat()
            attempt_info['count'] = 0  # Reset count
            request.session['verification_attempts'] = attempts
            request.session.modified = True
            
            return JsonResponse({
                'status': 'error',
                'message': f'Too many attempts. Please try again after {COOLDOWN_MINUTES} minutes'
            }, status=400)
        
        attempt_info['count'] += 1
        attempt_info['last_attempt'] = current_time.isoformat()
        request.session['verification_attempts'] = attempts
        request.session.modified = True

        # Generate OTP
        otp = generate_otp()
        
        # Store OTP in temporary file
        file_path = get_otp_file_path(request.user, verification_type)
        with open(file_path, 'w') as f:
            f.write(f"{otp}:{datetime.now().isoformat()}")

        # Send OTP via email or SMS
        message_service = MessageService()
        if verification_type == 'email':
            result = message_service.send_otp_email(request.user.email, otp)
        else:
            result = message_service.send_otp_sms(request.user.phone, otp)

        if not result['success']:
            # If sending fails, delete the OTP file and return error
            if os.path.exists(file_path):
                os.remove(file_path)
            return JsonResponse({
                'status': 'error',
                'message': f'Failed to send OTP: {result["message"]}'
            }, status=500)

        # Update verification attempt timestamp
        request.user.update_verification_attempt()

        return JsonResponse({
            'status': 'success',
            'message': f'OTP sent successfully to your {verification_type}'
        })

    except Exception as e:
        # Cleanup in case of error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def verify_otp(request):
    try:
        verification_type = request.POST.get('type')
        entered_otp = request.POST.get('otp')

        if not verification_type or not entered_otp:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required parameters'
            }, status=400)

        # Get stored OTP
        file_path = get_otp_file_path(request.user, verification_type)
        if not os.path.exists(file_path):
            return JsonResponse({
                'status': 'error',
                'message': 'No OTP found. Please generate a new OTP'
            }, status=400)

        # Read and verify OTP
        try:
            with open(file_path, 'r') as f:
                content = f.read().strip()
                
            # Split content and parse timestamp
            if ':' not in content:
                raise ValueError("Invalid content format")
                
            # Split only on first occurrence of ':'
            stored_otp, timestamp = content.split(':', 1)
            stored_time = datetime.fromisoformat(timestamp.strip())
            
        except (ValueError, IOError) as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid OTP format or file read error'
            }, status=400)

        # Check if OTP is expired (5 minutes validity)
        time_diff = (datetime.now() - stored_time).total_seconds()
        if time_diff > 300:  # 5 minutes = 300 seconds
            if os.path.exists(file_path):
                os.remove(file_path)
            return JsonResponse({
                'status': 'error',
                'message': 'OTP expired. Please generate a new OTP'
            }, status=400)

        # Verify OTP
        if entered_otp != stored_otp:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid OTP'
            }, status=400)

        # Mark as verified
        if verification_type == 'email':
            request.user.mark_email_verified()
            success_message = {"status": "success", "message": "Email verified successfully", "type": "email"}
        else:
            request.user.mark_mobile_verified()
            success_message = {"status": "success", "message": "Mobile verified successfully", "type": "mobile"}

        # Delete OTP file after successful verification
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            pass  # Ignore file deletion errors

        return JsonResponse(success_message)

    except Exception as e:
        print(f"Verification error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Verification failed'
        }, status=500)
    
@login_required
@require_http_methods(["GET"])
def verification_status(request):
    """Check verification status for email and mobile"""
    try:
        return JsonResponse({
            'status': 'success',
            'data': {
                'email': {
                    'verified': request.user.email_verified,
                    'verified_at': request.user.email_verified_at.isoformat() if request.user.email_verified_at else None
                },
                'mobile': {
                    'verified': request.user.mobile_verified,
                    'verified_at': request.user.mobile_verified_at.isoformat() if request.user.mobile_verified_at else None
                }
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
    

@login_required
@require_http_methods(["POST"])
def resend_otp(request):
    """Resend OTP with validation checks"""
    try:
        verification_type = request.POST.get('type')
        if verification_type not in ['email', 'mobile']:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid verification type'
            }, status=400)

        # Check if already verified
        if verification_type == 'email' and request.user.email_verified:
            return JsonResponse({
                'status': 'error',
                'message': 'Email already verified'
            }, status=400)
        elif verification_type == 'mobile' and request.user.mobile_verified:
            return JsonResponse({
                'status': 'error',
                'message': 'Mobile number already verified'
            }, status=400)

        # Check cooldown period
        if not request.user.can_verify_again(waiting_time_minutes=1):
            return JsonResponse({
                'status': 'error',
                'message': 'Please wait before requesting another OTP'
            }, status=400)

        # Generate and send new OTP
        return generate_verification_otp(request)

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

