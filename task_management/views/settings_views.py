from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import update_session_auth_hash
from django.utils import timezone
from ..models.user_models import UserPreference, LoginHistory, UserSession
import json
from datetime import datetime, timedelta

@login_required
def settings_view(request):
    """Render the settings page"""
    context = {
        'user': request.user,
        'email_verified': request.user.email_verified,
        'mobile_verified': request.user.mobile_verified
    }
    return render(request, 'task_management/dashboard/settings.html', context)

@login_required
@require_http_methods(["POST"])
def change_password(request):
    """Handle password change request"""
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        # Verify current password
        if not request.user.check_password(current_password):
            return JsonResponse({
                'status': 'error',
                'message': 'Current password is incorrect'
            }, status=400)

        # Update password
        request.user.set_password(new_password)
        request.user.save()
        
        # Update session to prevent logout
        update_session_auth_hash(request, request.user)

        return JsonResponse({
            'status': 'success',
            'message': 'Password updated successfully'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def update_bio(request):
    """Update user bio"""
    try:
        data = json.loads(request.body)
        bio = data.get('bio')
        
        request.user.bio = bio
        request.user.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Bio updated successfully'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def update_theme(request):
    """Update user theme preference"""
    try:
        data = json.loads(request.body)
        theme = data.get('theme')
        
        UserPreference.objects.update_or_create(
            user=request.user,
            defaults={'theme': theme}
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Theme updated successfully'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
def get_login_history(request):
    """Get user's login history"""
    try:
        history = LoginHistory.objects.filter(
            user=request.user
        ).order_by('-timestamp')[:10]  # Last 10 logins

        history_data = [{
            'timestamp': entry.timestamp.isoformat(),
            'device': entry.device,
            'location': entry.location,
            'status': entry.status
        } for entry in history]

        return JsonResponse({
            'status': 'success',
            'history': history_data
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
def get_active_sessions(request):
    """Get user's active sessions"""
    try:
        sessions = UserSession.objects.filter(
            user=request.user,
            expires_at__gt=timezone.now()
        ).order_by('-last_activity')

        session_data = [{
            'id': session.id,
            'device': session.device,
            'location': session.location,
            'last_active': session.last_activity.isoformat()
        } for session in sessions]

        return JsonResponse({
            'status': 'success',
            'sessions': session_data
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def revoke_session(request):
    """Revoke a specific session"""
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        
        session = UserSession.objects.get(
            id=session_id,
            user=request.user
        )
        session.delete()

        return JsonResponse({
            'status': 'success',
            'message': 'Session revoked successfully'
        })

    except UserSession.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Session not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def delete_account(request):
    """Delete user account"""
    try:
        # Add any cleanup logic here
        request.user.is_active = False
        request.user.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Account deleted successfully'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def save_preference(request):
    """Save user preferences"""
    try:
        data = json.loads(request.body)
        key = data.get('key')
        value = data.get('value')

        if not key:
            return JsonResponse({
                'status': 'error',
                'message': 'Preference key is required'
            }, status=400)

        UserPreference.objects.update_or_create(
            user=request.user,
            key=key,
            defaults={'value': value}
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Preference saved successfully'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)