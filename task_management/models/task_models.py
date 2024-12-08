from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import time

User = get_user_model()

class TaskCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Prevent duplicate category names per user
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name']  
        
    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = [
        ('yet_to_start', 'Yet to Start'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(TaskCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    start_date = models.DateField(default=timezone.now)
    start_time = models.TimeField(default=time(0, 0))
    end_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='yet_to_start')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    task_progress = models.IntegerField(default=0)
    task_owner = models.CharField(max_length=150)
    file_count = models.IntegerField(default=0)
    
    
    def is_overdue(self):
        today = timezone.now().date()
        now = timezone.now().time()
        return (self.end_date < today or 
                (self.end_date == today and self.end_time < now))
    
    def __str__(self):
        return self.title
    
class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Comment by {self.user.username} on {self.task.title}'

def get_file_upload_path(instance, filename):
    """
    Generate the upload path for task files.
    Path format: task_files/<user_id>/<task_id>/<filename>
    """
    return f'task_files/{instance.user.id}/{instance.task.id}/{filename}'
    
class TaskFile(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='files')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to=get_file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField() 
    file_type = models.CharField(max_length=10)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.original_filename} - {self.task.title}"

    def save(self, *args, **kwargs):
        # Update task file count on save
        if not self.pk:
            self.task.file_count += 1
            self.task.save()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Update task file count on delete
        self.task.file_count -= 1
        self.task.save()
        super().delete(*args, **kwargs)

    class Meta:
        ordering = ['-uploaded_at']

