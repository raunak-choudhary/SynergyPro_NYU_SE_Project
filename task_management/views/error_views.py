from django.shortcuts import render

def handler404(request, exception):
    return render(request, 'task_management/errors/404.html', status=404)

def handler500(request):
    return render(request, 'task_management/errors/500.html', status=500)