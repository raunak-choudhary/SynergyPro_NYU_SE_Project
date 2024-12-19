import unittest
from django.test import TestCase
from django.utils import timezone
from myapp.models.task_models import Task, TaskCategory, TaskFile, TaskNotification, Team, TeamMember, User
from datetime import timedelta

class TestTeamModels(TestCase):

    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')

        # Create a team
        self.team = Team.objects.create(
            name='Development Team',
            description='A team for developers',
            created_by=self.user1
        )

    def test_team_creation(self):
        self.assertEqual(self.team.name, 'Development Team')
        self.assertEqual(self.team.description, 'A team for developers')
        self.assertEqual(self.team.created_by, self.user1)

    def test_team_member_creation(self):
        team_member = TeamMember.objects.create(
            team=self.team,
            user=self.user2,
            role='member'
        )

        self.assertEqual(team_member.team, self.team)
        self.assertEqual(team_member.user, self.user2)
        self.assertEqual(team_member.role, 'member')
        self.assertTrue(team_member.is_active)

    def test_team_member_role(self):
        # Create a team member with 'admin' role
        team_member = TeamMember.objects.create(
            team=self.team,
            user=self.user2,
            role='admin'
        )

        self.assertEqual(team_member.role, 'admin')

    def test_team_member_unique_constraint(self):
        # Add a team member
        TeamMember.objects.create(
            team=self.team,
            user=self.user2,
            role='member'
        )

        # Try adding the same user to the same team
        with self.assertRaises(Exception):
            TeamMember.objects.create(
                team=self.team,
                user=self.user2,
                role='admin'
            )

    def test_team_member_deactivation(self):
        # Create a team member
        team_member = TeamMember.objects.create(
            team=self.team,
            user=self.user2,
            role='member'
        )

        # Deactivate the team member
        team_member.is_active = False
        team_member.save()

        self.assertFalse(team_member.is_active)

class TestTaskModels(TestCase):

    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(username='testuser', password='password')
        self.category = TaskCategory.objects.create(user=self.user, name='Work')
        self.task = Task.objects.create(
            user=self.user,
            title='Test Task',
            description='This is a test task',
            category=self.category,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            task_progress=50,
            task_owner='Owner Name',
        )

    def test_task_creation(self):
        self.assertEqual(self.task.title, 'Test Task')
        self.assertEqual(self.task.task_progress, 50)
        self.assertEqual(self.task.status, 'in_progress')

    def test_task_status_update_based_on_progress(self):
        self.task.task_progress = 100
        self.task.save()
        self.assertEqual(self.task.status, 'completed')

        self.task.task_progress = 0
        self.task.save()
        self.assertEqual(self.task.status, 'yet_to_start')

    def test_is_overdue(self):
        self.task.end_date = timezone.now().date() - timedelta(days=1)
        self.task.save()
        self.assertTrue(self.task.is_overdue())

        self.task.end_date = timezone.now().date() + timedelta(days=1)
        self.task.save()
        self.assertFalse(self.task.is_overdue())

    def test_task_category_unique_together(self):
        with self.assertRaises(Exception):
            TaskCategory.objects.create(user=self.user, name='Work')

    def test_task_file_creation_and_deletion(self):
        task_file = TaskFile.objects.create(
            task=self.task,
            user=self.user,
            file='test_file.txt',
            original_filename='Test File.txt',
            file_size=1024,
            file_type='txt',
        )
        self.assertEqual(self.task.file_count, 1)

        task_file.delete()
        self.assertEqual(self.task.file_count, 0)

class TestTaskNotificationModels(TestCase):

    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(username='testuser', password='password')

    def test_task_notification_creation(self):
        notification = TaskNotification.objects.create(
            user=self.user,
            message="Task is overdue",
            task_id=1,
        )

        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.message, "Task is overdue")
        self.assertEqual(notification.task_id, 1)
        self.assertFalse(notification.read)

    def test_task_notification_mark_as_read(self):
        notification = TaskNotification.objects.create(
            user=self.user,
            message="Task is overdue",
            task_id=1,
        )
        self.assertFalse(notification.read)

        # Mark notification as read
        notification.read = True
        notification.save()

        self.assertTrue(notification.read)

    def test_task_notification_ordering(self):
        TaskNotification.objects.create(user=self.user, message="Notification 1", task_id=1)
        TaskNotification.objects.create(user=self.user, message="Notification 2", task_id=2)

        notifications = TaskNotification.objects.filter(user=self.user).order_by('-created_at')
        self.assertEqual(notifications[0].message, "Notification 2")
        self.assertEqual(notifications[1].message, "Notification 1")

if __name__ == '__main__':
    unittest.main()
