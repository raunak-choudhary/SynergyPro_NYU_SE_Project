from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..models import ContactQuery
import json

@csrf_exempt
def submit_query(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            subject = data.get('subject')
            description = data.get('description')
            
            query = ContactQuery.objects.create(
                subject=subject,
                description=description
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Query submitted successfully'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
            
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)