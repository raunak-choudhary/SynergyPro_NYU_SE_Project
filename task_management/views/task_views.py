from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
import json
from ..models.task_models import Task, TaskComment, TaskCategory, TaskFile


def task_detail_view(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    return render(request, 'task_management/dashboard/task_detail.html', {'task': task})

def get_task_details(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    return JsonResponse({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'start_date': task.start_date.isoformat() if task.start_date else None,
        'end_date': task.end_date.isoformat() if task.end_date else None,
        'status': task.status
    })

@csrf_exempt
def update_task(request, task_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    try:
        data = json.loads(request.body)
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        
        if 'start_date' in data:
            task.start_date = parse_datetime(data['start_date'])
        if 'end_date' in data:
            task.end_date = parse_datetime(data['end_date'])
            
        task.save()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def delete_task(request, task_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    try:
        task.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
def tasks_view(request):
    tasks = Task.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'task_management/dashboard/tasks.html', {'tasks': tasks})

def tasks_api(request):
    tasks = Task.objects.filter(user=request.user).order_by('-created_at')
    tasks_data = [
        {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'start_date': task.start_date.isoformat() if task.start_date else None,
            'end_date': task.end_date.isoformat() if task.end_date else None,
            'status': task.status,
            'is_overdue': task.is_overdue(),
        }
        for task in tasks
    ]
    return JsonResponse(tasks_data, safe=False)

def get_task_comments(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    comments = task.comments.all().order_by('-created_at')
    comments_data = [
        {
            'id': comment.id,
            'content': comment.content,
            'author_name': comment.user.get_full_name() or comment.user.username,
            'author_avatar': comment.user.profile_image.url if hasattr(comment.user, 'profile_image') else None,
            'created_at': comment.created_at.isoformat()
        }
        for comment in comments
    ]
    return JsonResponse(comments_data, safe=False)

@csrf_exempt
def add_task_comment(request, task_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    try:
        data = json.loads(request.body)
        comment = TaskComment.objects.create(
            task=task,
            user=request.user,
            content=data['content']
        )
        return JsonResponse({
            'status': 'success',
            'comment': {
                'id': comment.id,
                'content': comment.content,
                'author_name': comment.user.get_full_name() or comment.user.username,
                'author_avatar': comment.user.profile_image.url if hasattr(comment.user, 'profile_image') else None,
                'created_at': comment.created_at.isoformat()
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@csrf_exempt
def upload_task_file(request, task_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided'}, status=400)
    
    try:
        file = request.FILES['file']
        task_file = TaskFile.objects.create(task=task, file=file)
        return JsonResponse({
            'status': 'success',
            'file_id': task_file.id,
            'file_url': task_file.file.url
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_user_categories(request):
    categories = TaskCategory.objects.filter(user=request.user)
    return JsonResponse({
        'categories': [{
            'id': cat.id,
            'name': cat.name
        } for cat in categories]
    })

@csrf_exempt
def create_category(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        category = TaskCategory.objects.create(
            user=request.user,
            name=data.get('name')
        )
        return JsonResponse({
            'status': 'success',
            'category': {
                'id': category.id,
                'name': category.name
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def update_task_category(request, task_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    try:
        data = json.loads(request.body)
        category_id = data.get('category_id')
        
        if category_id:
            category = get_object_or_404(TaskCategory, id=category_id, user=request.user)
            task.category = category
        else:
            task.category = None
            
        task.save()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)