from ..models.user_models import CustomUser

def check_unique_fields(username, email, phone):
    if CustomUser.objects.filter(username=username).exists():
        return False, "username"
    if CustomUser.objects.filter(email=email).exists():
        return False, "email"
    if CustomUser.objects.filter(phone=phone).exists():
        return False, "phone"
    return True, None

def validate_phone_number(phone):
    return phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')