from django.urls import re_path
from task_management.consumers import TeamChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/$', TeamChatConsumer.as_asgi()),
]