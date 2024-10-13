from django.urls import path
from . import views

urlpatterns = [
    path('tasks/create/', views.create_task, name='create_task'),
]

