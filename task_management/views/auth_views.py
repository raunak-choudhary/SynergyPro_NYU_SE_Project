from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.urls import reverse
from ..models import CustomUser
import json

def get_dashboard_url(user):
    """Determine dashboard URL based on user type and profile"""
    if user.user_type == 'individual':
        if user.profile_type == 'student':
            return reverse('individual_student_dashboard')
        elif user.profile_type == 'freelancer':
            return reverse('individual_freelancer_dashboard')
    elif user.user_type == 'team':
        if user.profile_type == 'student':
            return reverse('team_student_dashboard')
        elif user.profile_type == 'teacher':
            return reverse('team_teacher_dashboard')
        elif user.profile_type == 'professional':
            return reverse('team_professional_dashboard')
        elif user.profile_type == 'hr':
            return reverse('team_hr_dashboard')
    
    # Default fallback
    return reverse('individual_student_dashboard')

def home_view(request):
    return render(request, 'task_management/home.html')

@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return JsonResponse({
                "success": False,
                "message": "Please provide both username and password."
            }, status=400)

        user = authenticate(username=username, password=password)
        
        if user is not None:
            if user.is_active:
                login(request, user)
                dashboard_url = get_dashboard_url(user)
                return JsonResponse({
                    "success": True,
                    "message": f"Login Successful. Welcome back, {user.first_name}!",
                    "user": {
                        "username": user.username,
                        "firstName": user.first_name,
                        "lastName": user.last_name
                    },
                    "redirect_url": dashboard_url
                })
            else:
                return JsonResponse({
                    "success": False,
                    "message": "Your account is not active. Please contact support."
                }, status=401)
        else:
            return JsonResponse({
                "success": False,
                "message": "Invalid username or password. Please try again."
            }, status=401)

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "Invalid request format."
        }, status=400)
    except Exception as e:
        print(f"Login error: {str(e)}")
        return JsonResponse({
            "success": False,
            "message": "An unexpected error occurred. Please try again."
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def signup_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received data:", data)
            
            if data.get('password1') != data.get('password2'):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Passwords do not match'
                }, status=400)
                
            # Check if username exists
            if CustomUser.objects.filter(username=data.get('username')).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username already exists'
                }, status=400)
                
            # Check if email exists
            if CustomUser.objects.filter(email=data.get('email')).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email already exists'
                }, status=400)
                
            # Create user with all fields
            user = CustomUser.objects.create_user(
                username=data.get('username'),
                email=data.get('email'),
                password=data.get('password1'),
                first_name=data.get('firstName', ''),
                last_name=data.get('lastName', ''),
                phone=data.get('phone', ''),
                user_type=data.get('userType', ''),
                profile_type=data.get('profileType', '')
            )
            
            # Handle conditional fields
            if data.get('profileType') in ['student', 'teacher']:
                user.university_name = data.get('universityName', 'N/A')
            else:
                user.organization_name = data.get('organizationName', 'N/A')
                user.organization_website = data.get('organizationWebsite', 'N/A')
            
            user.save()
            
            # Log the user in after signup
            login(request, user)
            dashboard_url = get_dashboard_url(user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Account created successfully',
                'username': user.username,
                'redirect_url': dashboard_url
            })
            
        except Exception as e:
            print("Signup error:", str(e))
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
            
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def logout_view(request):
    logout(request)
    return redirect('/')
