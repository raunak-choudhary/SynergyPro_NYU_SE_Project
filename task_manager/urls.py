from django.urls import path
from . import views

urlpatterns = [
    path('calendar/', views.task_calendar, name='task_calendar'),
    path('tasks/create/<str:date>/', views.create_task, name='create_task'),
    path('tasks', views.task_list, name='task_list'),
    path('tasks/<int:task_id>', views.task_detail, name='task_detail'),
]

