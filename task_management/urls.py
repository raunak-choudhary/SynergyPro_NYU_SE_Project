from django.urls import path, include
from .views import auth_views, contact_views, dashboard_views

urlpatterns = [

    path('', auth_views.home_view, name='home'),
    # Authentication URLs
    path('api/signup/', auth_views.signup_view, name='signup'),
    path('api/login/', auth_views.login_view, name='login'),
    path('api/logout/', auth_views.logout_view, name='logout'), # Changed this line

    # Contact paths
    path('api/contact/', contact_views.submit_query, name='submit_query'),

    # Dashboard URLs
    path('dashboard/individual/student/', dashboard_views.individual_student_dashboard, name='individual_student_dashboard'),
    
    # Profile path
    path('profile/', dashboard_views.profile_view, name='profile'),

    # Profile image upload path and capture image
    path('api/profile/upload-image/', dashboard_views.upload_profile_image, name='upload_profile_image'),
    path('api/profile/capture-image/', dashboard_views.capture_profile_image, name='capture_profile_image'),

    # Generate and Verify OTP
    path('api/otp/', include([
        path('generate/', dashboard_views.generate_verification_otp, name='generate_otp'),
        path('verify/', dashboard_views.verify_otp, name='verify_otp'),
        path('status/', dashboard_views.verification_status, name='verification_status'),  # New endpoint
        path('resend/', dashboard_views.resend_otp, name='resend_otp'),  # New endpoint
    ])),
]