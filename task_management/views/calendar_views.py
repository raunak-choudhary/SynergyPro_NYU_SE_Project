from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from ..models.task_models import Task
from datetime import datetime, timedelta

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
    try:
        # Get form data
        title = request.POST.get('title')
        description = request.POST.get('description')
        start_date = request.POST.get('start_date')  
        start_time = request.POST.get('start_time')  
        end_date = request.POST.get('end_date')      
        end_time = request.POST.get('end_time')     
        priority = request.POST.get('priority')

        # Basic validation
        if not all([title, start_date, start_time, end_date, end_time]):
            return JsonResponse({
                'success': False, 
                'error': 'All fields are required.'
            })

        try:
            # Combine date and time strings
            start_datetime_str = f"{start_date} {start_time}"
            end_datetime_str = f"{end_date} {end_time}"

            # Parse into datetime objects
            start_datetime = datetime.strptime(start_datetime_str, '%Y-%m-%d %H:%M')
            end_datetime = datetime.strptime(end_datetime_str, '%Y-%m-%d %H:%M')

            # Validate date order
            if end_datetime <= start_datetime:
                return JsonResponse({
                    'success': False, 
                    'error': 'End date/time must be after start date/time.'
                })

            # Create task
            task = Task.objects.create(
                user=request.user,
                title=request.POST.get('title'),
                description=request.POST.get('description'),
                start_date=start_datetime.date(),
                start_time=start_datetime.time(),
                end_date=end_datetime.date() if end_datetime else None,
                end_time=end_datetime.time() if end_datetime else None,
                priority=request.POST.get('priority'),
                status='yet_to_start',
                task_progress=0,
                task_owner=request.user.username
            )

            return JsonResponse({
                'success': True, 
                'task_id': task.id,
                'message': 'Task created successfully!'
            })

        except ValueError as ve:
            return JsonResponse({
                'success': False,
                'error': 'Invalid date/time format provided.'
            })

    except Exception as e:
        print("Error creating task:", str(e))  # For debugging
        return JsonResponse({
            'success': False,
            'error': 'An error occurred while creating the task.'
        })

