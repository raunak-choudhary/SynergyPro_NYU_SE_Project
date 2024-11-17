from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = [
        ('individual', 'Individual/Freelancer'),
        ('team', 'Team Member'),
    ]
    
    PROFILE_TYPE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('freelancer', 'Freelancer'),
        ('professional', 'Working Professional'),
        ('hr', 'Human Resource (HR)'),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    profile_type = models.CharField(max_length=20, choices=PROFILE_TYPE_CHOICES)
    university_name = models.CharField(max_length=100, default='N/A')
    organization_name = models.CharField(max_length=100, default='N/A')
    organization_website = models.URLField(max_length=200, default='N/A')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    mobile_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    mobile_verified_at = models.DateTimeField(null=True, blank=True)
    last_verification_attempt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_instance = CustomUser.objects.get(pk=self.pk)
                
                # Check email change
                if old_instance.email_verified and old_instance.email != self.email:
                    raise ValidationError("Cannot change email after verification")
                
                # Separate check for phone number
                elif old_instance.mobile_verified and old_instance.phone != self.phone:
                    raise ValidationError("Cannot change phone number after verification")
                    
            except CustomUser.DoesNotExist:
                pass

        # Rest of your save method remains same
        if self.profile_type in ['student', 'teacher']:
            self.organization_name = 'N/A'
            self.organization_website = 'N/A'
        elif self.profile_type in ['freelancer', 'professional', 'hr']:
            self.university_name = 'N/A'
            if not self.organization_website:
                self.organization_website = 'N/A'

        super().save(*args, **kwargs)

    def update_verification_attempt(self):
        """Update the last verification attempt timestamp"""
        self.last_verification_attempt = timezone.now()
        self.save(update_fields=['last_verification_attempt'])

    def mark_email_verified(self):
        """Mark email as verified with timestamp"""
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self.save(update_fields=['email_verified', 'email_verified_at'])

    def mark_mobile_verified(self):
        """Mark mobile as verified with timestamp"""
        self.mobile_verified = True
        self.mobile_verified_at = timezone.now()
        self.save(update_fields=['mobile_verified', 'mobile_verified_at'])

    def can_verify_again(self, waiting_time_minutes=1):
        """
        Check if user can attempt verification based on waiting time
        Returns True if user can attempt verification, False otherwise
        """
        if not self.last_verification_attempt:
            return True
            
        waiting_period = timezone.now() - timezone.timedelta(minutes=waiting_time_minutes)
        return self.last_verification_attempt <= waiting_period