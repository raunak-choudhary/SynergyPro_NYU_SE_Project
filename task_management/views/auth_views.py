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
        if user.profile_type in ['student', 'teacher']:
            return reverse('team_academic_dashboard')
        elif user.profile_type in ['professional', 'hr']:
            return reverse('team_professional_dashboard')
    
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
            
            if data.get('userType') == 'team' and data.get('teamName'):
                existing_team = CustomUser.objects.filter(team_name=data.get('teamName')).first()
                if existing_team and not data.get('joining_existing_team'):
                    # Only send team exists response if not joining
                    return JsonResponse({
                        'status': 'team_exists',
                        'message': 'Team already exists',
                        'team_details': {
                            'name': existing_team.team_name,
                            'admin_name': f"{existing_team.first_name} {existing_team.last_name}",
                            'created_at': existing_team.created_at.strftime("%B %d, %Y"),
                            'organization': existing_team.organization_name if existing_team.profile_type in ['professional', 'hr'] else existing_team.university_name,
                            'team_type': 'Professional Team' if existing_team.profile_type in ['professional', 'hr'] else 'Academic Team'
                        }
                    }, status=409)
                
            # Create user with all fields
            user = CustomUser.objects.create_user(
                username=data.get('username'),
                email=data.get('email'),
                password=data.get('password1'),
                first_name=data.get('firstName', ''),
                last_name=data.get('lastName', ''),
                phone=data.get('phone', ''),
                user_type=data.get('userType', ''),
                profile_type=data.get('profileType', ''),
                team_name=data.get('teamName') if data.get('userType') == 'team' else None
            )
            
            # Handle conditional fields
            if data.get('profileType') in ['student', 'teacher']:
                user.university_name = data.get('universityName', 'N/A')
            else:
                user.organization_name = data.get('organizationName', 'N/A')
                user.organization_website = data.get('organizationWebsite', 'N/A')
            
            user.save()

            login(request, user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Account created successfully',
                'username': user.username,
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
