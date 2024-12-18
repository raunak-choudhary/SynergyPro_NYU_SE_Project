from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class TeamMessage(models.Model):
    team_name = models.CharField(max_length=50)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_private = models.BooleanField(default=False)
    receiver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_messages',
        null=True, 
        blank=True
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.get_full_name()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"