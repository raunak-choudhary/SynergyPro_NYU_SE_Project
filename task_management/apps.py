from django.apps import AppConfig

class TaskManagementConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "task_management"
    verbose_name = "Task Management"

    def ready(self):
        import task_management.models.user_models  # Import the models