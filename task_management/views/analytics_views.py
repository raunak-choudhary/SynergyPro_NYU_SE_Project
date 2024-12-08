# analytics_views.py

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Count, Avg
from django.db.models.functions import ExtractHour, ExtractWeekDay
from django.utils import timezone
from datetime import timedelta
from ..models.task_models import Task, TaskCategory, TaskFile

@login_required
def analytics_view(request):
    """Render the analytics dashboard"""
    return render(request, 'task_management/dashboard/analytics.html')

@login_required
def analytics_data(request):
    """Get all analytics data for the dashboard"""
    user = request.user
    today = timezone.now()
    thirty_days_ago = today - timedelta(days=30)
    
    # Get user's tasks within last 30 days
    tasks = Task.objects.filter(
        user=user,
        created_at__gte=thirty_days_ago
    )
    
    return JsonResponse({
        'status_distribution': get_status_distribution(tasks),
        'priority_distribution': get_priority_distribution(tasks),
        'completion_rate': get_completion_rate(tasks),
        'overdue_analysis': get_overdue_analysis(tasks),
        'task_categories': get_task_categories(tasks),
        'file_activity': get_file_activity(user),
        'task_load': get_task_load(tasks),
        'peak_performance': get_peak_performance(tasks)
    })

def get_status_distribution(tasks):
    """Get distribution of tasks by status"""
    status_counts = tasks.values('status').annotate(
        count=Count('id')
    )
    return {
        status['status']: status['count']
        for status in status_counts
    }

def get_priority_distribution(tasks):
    """Get distribution of tasks by priority"""
    priority_counts = tasks.values('priority').annotate(
        count=Count('id')
    )
    return {
        priority['priority']: priority['count']
        for priority in priority_counts
    }

def get_completion_rate(tasks):
    """Calculate daily completion rates for the past 7 days"""
    seven_days_ago = timezone.now() - timedelta(days=7)
    daily_completion = tasks.filter(
        status='completed',
        updated_at__gte=seven_days_ago
    ).values('updated_at__date').annotate(
        count=Count('id')
    ).order_by('updated_at__date')
    
    return {
        str(stat['updated_at__date']): stat['count']
        for stat in daily_completion
    }

def get_overdue_analysis(tasks):
    """Get overdue tasks analysis for past 4 weeks"""
    overdue_tasks = tasks.filter(
        end_date__lt=timezone.now().date()
    ).values('end_date__week').annotate(
        count=Count('id')
    ).order_by('end_date__week')
    
    return {
        f"Week {stat['end_date__week']}": stat['count']
        for stat in overdue_tasks
    }

def get_task_categories(tasks):
    """Get task distribution across categories"""
    category_counts = tasks.values(
        'category__name'
    ).annotate(
        count=Count('id')
    ).exclude(category__isnull=True)
    
    return {
        cat['category__name']: cat['count']
        for cat in category_counts
    }

def get_file_activity(user):
    """Get file upload activity over time"""
    thirty_days_ago = timezone.now() - timedelta(days=30)
    file_activity = TaskFile.objects.filter(
        user=user,
        uploaded_at__gte=thirty_days_ago
    ).values('uploaded_at__date').annotate(
        count=Count('id')
    ).order_by('uploaded_at__date')
    
    return {
        str(activity['uploaded_at__date']): activity['count']
        for activity in file_activity
    }

def get_task_load(tasks):
    """Get task load distribution by day"""
    task_load = tasks.values('start_date').annotate(
        count=Count('id')
    ).order_by('start_date')
    
    return {
        str(load['start_date']): load['count']
        for load in task_load
    }

def get_peak_performance(tasks):
    """Get task completion distribution by hour"""
    peak_hours = tasks.filter(
        status='completed'
    ).annotate(
        hour=ExtractHour('updated_at')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('hour')
    
    return {
        f"{hour['hour']:02d}:00": hour['count']
        for hour in peak_hours
    }