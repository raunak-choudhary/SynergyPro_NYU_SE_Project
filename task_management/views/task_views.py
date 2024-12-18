from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from ..models.task_models import Task, TaskComment, TaskFile, TaskCategory
import json
from django.core.exceptions import ValidationError
from django.db import IntegrityError
import os
from django.http import HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

@login_required
def tasks_view(request):
    tasks = Task.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'task_management/dashboard/tasks.html', {'tasks': tasks})

@login_required
def task_detail_view(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    if task.user != request.user:
        raise PermissionDenied
    categories = TaskCategory.objects.filter(user=request.user).order_by('name')
    return render(request, 'task_management/dashboard/task_detail.html', {
        'task': task,
        'categories': categories
    })

@login_required
def tasks_api(request):
    if request.user.user_type == 'team':
        tasks = Task.objects.filter(team_name=request.user.team_name).order_by('-created_at')
    else:
        tasks = Task.objects.filter(user=request.user).order_by('-created_at')

    tasks_data = [{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'start_date': task.start_date.isoformat() if task.start_date else None,
        'start_time': task.start_time.isoformat() if task.start_time else None,
        'end_date': task.end_date.isoformat() if task.end_date else None,
        'end_time': task.end_time.isoformat() if task.end_time else None,
        'status': task.status,
        'priority': task.priority,
        'task_progress': task.task_progress,
        'is_overdue': task.is_overdue(),
        'team_name': task.team_name if request.user.user_type == 'team' else None,
        'category': {
            'id': task.category.id,
            'name': task.category.name
        } if task.category else None
    } for task in tasks]
    return JsonResponse(tasks_data, safe=False)

@login_required
def task_detail_api(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    
    if request.method == 'GET':
        return JsonResponse({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'start_date': task.start_date.isoformat() if task.start_date else None,
            'start_time': task.start_time.strftime('%H:%M') if task.start_time else None,
            'end_date': task.end_date.isoformat() if task.end_date else None,
            'end_time': task.end_time.strftime('%H:%M') if task.end_time else None,
            'status': task.status,
            'priority': task.priority,
            'task_progress': task.task_progress,
            'file_count': task.file_count,
            'category': {
                'id': task.category.id,
                'name': task.category.name
            } if task.category else None
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print("Received data:", data)
            task.title = data.get('title', task.title)
            task.description = data.get('description', task.description)
            task.start_date = data.get('start_date', task.start_date)
            task.start_time = data.get('start_time', task.start_time)
            task.end_date = data.get('end_date', task.end_date)
            task.end_time = data.get('end_time', task.end_time)
            task.status = data.get('status', task.status)
            task.priority = data.get('priority', task.priority)
            task.task_progress = data.get('task_progress', task.task_progress)

            category_id = data.get('category_id')
            print("Category ID received:", category_id)

            if category_id:
                try:
                    category = TaskCategory.objects.get(id=category_id, user=request.user)
                    print("Found category:", category)  # Debug log
                    task.category = category
                except TaskCategory.DoesNotExist:
                    print("Category not found")  # Debug log
                    task.category = None
            else:
                print("No category ID provided")  # Debug log
                task.category = None

            task.save()
            print("Task saved with category:", task.category)

            return JsonResponse({
                'status': 'success',
                'category': {
                    'id': task.category.id,
                    'name': task.category.name
                } if task.category else None
            })
        except Exception as e:
            print("Error saving task:", str(e))  # Debug log
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        task.delete()
        return JsonResponse({'status': 'success'})
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@api_view(['PUT'])
@login_required
def update_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id, user=request.user)

        # Update task progress
        if 'task_progress' in request.data:
            task.task_progress = request.data['task_progress']

        # Update status
        if 'status' in request.data:
            task.status = request.data['status']

        task.save()  # This will trigger our custom save method

        return Response({'status': 'success'})
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=404)


@login_required
def task_comments_api(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    
    if request.method == 'GET':
        comments = task.comments.all()
        comments_data = [{
            'id': comment.id,
            'text': comment.text,
            'author': comment.user.get_full_name() or comment.user.username,
            'created_at': comment.created_at.isoformat(),
        } for comment in comments]
        return JsonResponse(comments_data, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            comment = TaskComment.objects.create(
                task=task,
                user=request.user,
                text=data['text']
            )
            return JsonResponse({
                'id': comment.id,
                'text': comment.text,
                'author': comment.user.get_full_name() or comment.user.username,
                'created_at': comment.created_at.isoformat(),
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required
def delete_task(request, task_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    task = get_object_or_404(Task, id=task_id, user=request.user)
    try:
        task.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
def validate_file(file):
    # Check file size (10MB limit)
    if file.size > 10 * 1024 * 1024:  
        raise ValidationError('File size must be no more than 10MB')
    
    file_extension = os.path.splitext(file.name)[1].lower()
    
    allowed_extensions = [
        '.pdf', '.docx', '.xlsx', '.txt', 
        '.png', '.jpg', '.jpeg', '.pptx'
    ]
    
    if file_extension not in allowed_extensions:
        raise ValidationError(
            f'Invalid file type. Allowed types are: {", ".join(allowed_extensions)}'
        )

@login_required
def upload_task_file(request, task_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided'}, status=400)
    
    file = request.FILES['file']
    
    try:
        validate_file(file)
        
        task_file = TaskFile.objects.create(
            task=task,
            user=request.user,
            file=file,
            original_filename=file.name,
            file_size=file.size,
            file_type=os.path.splitext(file.name)[1].lower()
        )
        
        return JsonResponse({
            'id': task_file.id,
            'filename': task_file.original_filename,
            'size': task_file.file_size,
            'uploaded_at': task_file.uploaded_at.isoformat(),
            'file_type': task_file.file_type
        })
        
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Error uploading file'}, status=500)

@login_required
def categories_api(request):
    """Get all categories for the current user"""
    categories = TaskCategory.objects.filter(user=request.user).order_by('name')
    categories_data = [{
        'id': category.id,
        'name': category.name
    } for category in categories]
    return JsonResponse(categories_data, safe=False)

@login_required
def create_category(request):
    """Create a new category"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
        
    try:
        data = json.loads(request.body)
        category_name = data.get('name', '').strip()
        
        if not category_name:
            return JsonResponse({'error': 'Category name is required'}, status=400)
            
        category = TaskCategory.objects.create(
            user=request.user,
            name=category_name
        )
        
        return JsonResponse({
            'id': category.id,
            'name': category.name
        })
    except IntegrityError:
        return JsonResponse({'error': 'Category already exists'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@login_required
def task_file_view(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    if task.file_count == 0:
        return JsonResponse({'error': 'No files present'}, status=404)
    return render(request, 'task_management/dashboard/task_file_view.html', {'task': task})

@login_required
def task_files_api(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    user_id = request.user.id
    
    directory_path = os.path.join(settings.MEDIA_ROOT, 'task_files', str(user_id), str(task_id))
    
    print(f"Searching directory: {directory_path}")  # Debug log
    
    files_data = []
    if os.path.exists(directory_path):
        for filename in os.listdir(directory_path):
            if filename.startswith('.'):
                continue
                
            file_path = os.path.join(directory_path, filename)
            if os.path.isfile(file_path):
                file_size = os.path.getsize(file_path)
                file_type = os.path.splitext(filename)[1]
                
                files_data.append({
                    'id': filename,
                    'filename': filename,
                    'file_type': file_type,
                    'file_path': file_path.replace('\\', '/'),
                    'size': file_size
                })
    
    return JsonResponse(files_data, safe=False)

@login_required
def view_task_file(request, task_id, file_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    user_id = request.user.id
    
    # Use absolute path with MEDIA_ROOT
    file_path = os.path.join(settings.MEDIA_ROOT, 'task_files', 
                            str(user_id), str(task_id), file_id)
    
    print(f"Looking for file at: {file_path}")  # Debug log
    
    if not os.path.exists(file_path):
        print(f"File not found at: {file_path}")  # Debug log
        return JsonResponse({'error': 'File not found'}, status=404)
    
    try:
        file_type = os.path.splitext(file_id)[1].lower()
        content_type = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain'
        }.get(file_type, 'application/octet-stream')
        
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{file_id}"'
            return response
    except Exception as e:
        print(f"Error serving file: {str(e)}")  # Debug log
        return JsonResponse({'error': str(e)}, status=500)
    
@login_required
def delete_task_file(request, task_id, file_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    user_id = request.user.id
    
    # Construct file path
    file_path = os.path.join(settings.MEDIA_ROOT, 'task_files', 
                            str(user_id), str(task_id), file_id)
    
    try:
        if os.path.exists(file_path):
            # Delete file from filesystem
            os.remove(file_path)
            
            # Decrease file count
            task.file_count = max(0, task.file_count - 1)
            task.save()
            
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'error': 'File not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def categories_api(request):
    categories = TaskCategory.objects.filter(user=request.user).order_by('name')
    categories_data = [{'id': category.id, 'name': category.name} for category in categories]
    return JsonResponse(categories_data, safe=False)
    
