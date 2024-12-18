import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models.message_models import TeamMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class TeamChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.team_name = self.scope['user'].team_name
        self.room_group_name = f'chat_{self.team_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        is_private = text_data_json.get('is_private', False)
        receiver_id = text_data_json.get('receiver_id')

        # Save message to database
        await self.save_message(message, is_private, receiver_id)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.scope['user'].id,
                'sender_name': self.scope['user'].get_full_name(),
                'is_private': is_private,
                'receiver_id': receiver_id
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'sender_name': event['sender_name'],
            'is_private': event['is_private'],
            'receiver_id': event['receiver_id']
        }))

    @database_sync_to_async
    def save_message(self, message, is_private, receiver_id):
        receiver = None
        if is_private and receiver_id:
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                pass

        TeamMessage.objects.create(
            team_name=self.team_name,
            sender=self.scope['user'],
            content=message,
            is_private=is_private,
            receiver=receiver
        )