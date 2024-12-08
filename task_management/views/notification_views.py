from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from ..models.notification_models import TaskNotification
import json

@login_required
def get_notifications(request):
    """Fetch all notifications for the current user"""
    notifications = TaskNotification.objects.filter(user=request.user).values(
        'id', 'message', 'read', 'created_at', 'task_id'
    )
    return JsonResponse(list(notifications), safe=False)

@login_required
@require_http_methods(["POST"])
def mark_notification_read(request, notification_id):
    """Mark a single notification as read"""
    try:
        notification = TaskNotification.objects.get(
            id=notification_id, 
            user=request.user
        )
        notification.read = True
        notification.save()
        return JsonResponse({'status': 'success'})
    except TaskNotification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found'}, status=404)

@login_required
@require_http_methods(["POST"])
def mark_all_read(request):
    """Mark all notifications as read for the current user"""
    TaskNotification.objects.filter(user=request.user).update(read=True)
    return JsonResponse({'status': 'success'})

@login_required
@require_http_methods(["DELETE"])
def clear_notifications(request):
    """Delete all notifications for the current user"""
    TaskNotification.objects.filter(user=request.user).delete()
    return JsonResponse({'status': 'success'})

@login_required
@require_http_methods(["POST"])
def create_notification(request):
    """Create a new notification"""
    try:
        data = json.loads(request.body)
        notification = TaskNotification.objects.create(
            user=request.user,
            message=data.get('message'),
            task_id=data.get('task_id')
        )
        return JsonResponse({
            'id': notification.id,
            'message': notification.message,
            'read': notification.read,
            'created_at': notification.created_at.isoformat(),
            'task_id': notification.task_id
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)