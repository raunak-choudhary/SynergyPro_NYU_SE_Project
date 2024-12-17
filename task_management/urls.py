from django.urls import path, include
from .views import auth_views, contact_views, dashboard_views
from .views import calendar_views, task_views, help_views, settings_views, notification_views, analytics_views

urlpatterns = [

        path('', auth_views.home_view, name='home'),
        # Authentication URLs
        path('api/signup/', auth_views.signup_view, name='signup'),
        path('api/login/', auth_views.login_view, name='login'),
        path('api/logout/', auth_views.logout_view, name='logout'),

        # Contact paths
        path('api/contact/', contact_views.submit_query, name='submit_query'),

        # Dashboard URLs
        path('dashboard/individual/student/', dashboard_views.individual_student_dashboard, name='individual_student_dashboard'),
        path('dashboard/individual/freelancer/', dashboard_views.individual_freelancer_dashboard, name='individual_freelancer_dashboard'),

        #Dashboard API URLs
        path('api/dashboard/stats/', dashboard_views.dashboard_stats_api, name='dashboard_stats'),
        
        # Profile path
        path('profile/', dashboard_views.profile_view, name='profile'),

        # Profile image upload path and capture image
        path('api/profile/upload-image/', dashboard_views.upload_profile_image, name='upload_profile_image'),
        path('api/profile/capture-image/', dashboard_views.capture_profile_image, name='capture_profile_image'),

        # Generate and Verify OTP
        path('api/otp/', include([
            path('generate/', dashboard_views.generate_verification_otp, name='generate_otp'),
            path('verify/', dashboard_views.verify_otp, name='verify_otp'),
            path('status/', dashboard_views.verification_status, name='verification_status'),
            path('resend/', dashboard_views.resend_otp, name='resend_otp'),
        ])),

        # Calendar path
        path('dashboard/calendar/', calendar_views.calendar_view, name='calendar'),
        path('api/tasks/create/', calendar_views.create_task, name='create_task'),

        # Task Management URLs
        path('tasks/', task_views.tasks_view, name='tasks'),
        path('api/tasks/', task_views.tasks_api, name='tasks_api'),
        path('task/<int:task_id>/', task_views.task_detail_view, name='task_detail'),
        path('api/tasks/<int:task_id>/', task_views.task_detail_api, name='task_detail_api'),
        path('api/tasks/<int:task_id>/comments/', task_views.task_comments_api, name='task_comments_api'),
        path('api/task/<int:task_id>/delete/', task_views.delete_task, name='delete_task'),

        # File Upload and View URLs
        path('api/tasks/<int:task_id>/files/upload/', task_views.upload_task_file, name='upload_task_file'),
        path('api/tasks/<int:task_id>/files/', task_views.task_files_api, name='task_files_api'),
        path('task/<int:task_id>/files/view/', task_views.task_file_view, name='task_file_view'),
        path('api/tasks/<int:task_id>/files/<str:file_id>/view/', task_views.view_task_file, name='view_task_file'),
        path('api/tasks/<int:task_id>/files/<str:file_id>/delete/', task_views.delete_task_file, name='delete_task_file'),

        #Task Categories URLs
        path('api/categories/', task_views.categories_api, name='categories_api'),
        path('api/categories/create/', task_views.create_category, name='create_category'),

        #Help Center Page
        path('help-center/', help_views.help_center_view, name='help_center'),
        path('api/help-center/analytics', help_views.track_help_center_analytics, name='help_center_analytics'),
        path('api/help-center/get-article-pools/', help_views.get_article_pools, name='get_article_pools'),
        path('api/help-center/debug-pools', help_views.debug_article_pools, name='debug_article_pools'),

        # Settings URLs
        path('settings/', settings_views.settings_view, name='settings'),
        path('api/settings/change-password/', settings_views.change_password, name='change_password'),
        path('api/settings/update-bio/', settings_views.update_bio, name='update_bio'),
        path('api/settings/update-theme/', settings_views.update_theme, name='update_theme'),
        path('api/settings/login-history/', settings_views.get_login_history, name='login_history'),
        path('api/settings/active-sessions/', settings_views.get_active_sessions, name='active_sessions'),
        path('api/settings/revoke-session/', settings_views.revoke_session, name='revoke_session'),
        path('api/settings/delete-account/', settings_views.delete_account, name='delete_account'),
        path('api/settings/save-preference/', settings_views.save_preference, name='save_preference'),

        # Notification URLs
        path('api/notifications/', include([
            path('', notification_views.get_notifications, name='get_notifications'),
            path('mark-read/<int:notification_id>/', notification_views.mark_notification_read, name='mark_notification_read'),
            path('mark-all-read/', notification_views.mark_all_read, name='mark_all_read'),
            path('clear/', notification_views.clear_notifications, name='clear_notifications'),
            path('create/', notification_views.create_notification, name='create_notification'),
        ])),

        #Analytic URLs
        path('analytics/', analytics_views.analytics_view, name='analytics'),
        path('api/analytics/dashboard-data/', analytics_views.analytics_data, name='analytics_data'),
]
