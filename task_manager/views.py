from django.shortcuts import render, redirect, get_object_or_404
from .models import Task
from .forms import TaskForm

# Create your views here.
# Calendar view
def task_calendar(request):
    tasks = Task.objects.all()
    return render(request, 'task_manager/calendar.html', {'tasks': tasks})

# View to create a task
def create_task(request, date):
    if request.method == "POST":
        form = TaskForm(request.POST)
        if form.is_valid():
            task = form.save(commit=False)
            task.due_date = date  # Set the selected date
            task.save()
            return redirect('task_list')
    else:
        form = TaskForm()

    return render(request, "task_manager/create_task.html", {'form': form, 'date': date})

# view all tasks
def task_list(request):
    tasks = Task.objects.all()
    return render(request, 'task_manager/task_list.html', {'tasks': tasks})

# view individual task
def task_detail(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    return render(request, 'task_manager/task_detail.html', {'task': task})

