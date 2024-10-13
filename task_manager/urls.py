from django.urls import path
from . import views

urlpatterns = [
    path('tasks/create/', views.create_task, name='create_task'),
    path('tasks', views.task_list, name='task_list'),
    path('tasks/<int:task_id>', views.task_detail, name='task_detail')
]

