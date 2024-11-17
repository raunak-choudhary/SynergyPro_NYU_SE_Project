from typing import Any, Dict, Optional
from django.http import JsonResponse

class APIResponse:
    @staticmethod
    def success(data: Optional[Dict[str, Any]] = None, message: str = "Success") -> JsonResponse:
        return JsonResponse({
            'status': 'success',
            'message': message,
            'data': data or {}
        })

    @staticmethod
    def error(message: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None) -> JsonResponse:
        response_data = {
            'status': 'error',
            'message': message
        }
        if details:
            response_data['details'] = details
        return JsonResponse(response_data, status=status_code)