from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from ..models.task_models import Task
from datetime import datetime, timedelta
from django.utils.dateparse import parse_date

@login_required
def calendar_view(request):
    today = datetime.now()
    start_date = today.replace(day=1)
    end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    tasks = Task.objects.filter(
        user=request.user,
        start_date__lte=end_date,
        end_date__gte=start_date
    )

    context = {
        'tasks': tasks,
        'user': request.user,
        'email_verified': request.user.email_verified,
        'mobile_verified': request.user.mobile_verified
    }

    return render(request, 'task_management/dashboard/calendar.html', context)

@login_required
@require_POST
def create_task(request):
    title = request.POST.get('title')
    description = request.POST.get('description')
    start_date = request.POST.get('start_date')
    end_date = request.POST.get('end_date')
    print(title)
    if not title or not start_date:
        return JsonResponse({'success': False, 'error': 'Title and start date are required.'})

    try:
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date() if end_date else None

        if not start_date:
            raise ValueError("Invalid start date format")

        task = Task.objects.create(
            user=request.user,
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date
        )
        return JsonResponse({'success': True, 'task_id': task.id})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

