import json
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TestCase
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from .consumers import TeamChatConsumer
from .models.message_models import TeamMessage

User = get_user_model()

class TeamChatConsumerTest(TestCase):

    @sync_to_async
    def create_user(self, username, team_name):
        user = User.objects.create_user(username=username, password='password')
        user.team_name = team_name
        user.save()
        return user

    @sync_to_async
    def get_messages_count(self):
        return TeamMessage.objects.count()

    @sync_to_async
    def get_last_message(self):
        return TeamMessage.objects.last()

    async def setUp(self):
        self.user1 = await self.create_user(username="user1", team_name="team1")
        self.user2 = await self.create_user(username="user2", team_name="team1")
        self.channel_layer = get_channel_layer()

    async def test_connect(self):
        communicator = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_disconnect(self):
        communicator = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        await communicator.connect()
        await communicator.disconnect()

    async def test_send_message_to_group(self):
        communicator1 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        communicator2 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user2})

        await communicator1.connect()
        await communicator2.connect()

        message = {"message": "Hello Team", "is_private": False}
        await communicator1.send_json_to(message)

        response = await communicator2.receive_json_from()

        self.assertEqual(response['message'], "Hello Team")
        self.assertEqual(response['sender'], self.user1.id)
        self.assertEqual(response['is_private'], False)

        await communicator1.disconnect()
        await communicator2.disconnect()

    async def test_private_message(self):
        communicator1 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        communicator2 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user2})

        await communicator1.connect()
        await communicator2.connect()

        message = {"message": "Hello User2", "is_private": True, "receiver_id": self.user2.id}
        await communicator1.send_json_to(message)

        response = await communicator2.receive_json_from()

        self.assertEqual(response['message'], "Hello User2")
        self.assertEqual(response['sender'], self.user1.id)
        self.assertEqual(response['receiver_id'], self.user2.id)
        self.assertEqual(response['is_private'], True)

        await communicator1.disconnect()
        await communicator2.disconnect()

    async def test_invalid_receiver(self):
        communicator1 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        await communicator1.connect()

        invalid_message = {"message": "Hello", "is_private": True, "receiver_id": 9999}  # Invalid receiver
        await communicator1.send_json_to(invalid_message)

        response = await communicator1.receive_json_from()
        self.assertEqual(response['receiver_id'], 9999)
        self.assertEqual(response['is_private'], True)
        await communicator1.disconnect()

    async def test_save_message_to_database(self):
        communicator = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        await communicator.connect()

        message = {"message": "Message to save", "is_private": False}
        await communicator.send_json_to(message)

        count = await self.get_messages_count()
        last_message = await self.get_last_message()

        self.assertEqual(count, 1)
        self.assertEqual(last_message.content, "Message to save")
        self.assertEqual(last_message.sender, self.user1)
        self.assertEqual(last_message.team_name, "team1")

        await communicator.disconnect()

    async def test_edge_case_empty_message(self):
        communicator = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        await communicator.connect()

        empty_message = {"message": "", "is_private": False}
        await communicator.send_json_to(empty_message)

        response = await communicator.receive_json_from()
        self.assertEqual(response['message'], "")
        await communicator.disconnect()

    async def test_edge_case_no_is_private_flag(self):
        communicator1 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user1})
        communicator2 = WebsocketCommunicator(TeamChatConsumer.as_asgi(), {"type": "websocket", "user": self.user2})

        await communicator1.connect()
        await communicator2.connect()

        message = {"message": "Hello User2"}  # No is_private flag
        await communicator1.send_json_to(message)

        response = await communicator2.receive_json_from()
        self.assertEqual(response['message'], "Hello User2")
        self.assertEqual(response['is_private'], False)

        await communicator1.disconnect()
        await communicator2.disconnect()
