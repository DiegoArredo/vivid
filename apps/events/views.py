from django.shortcuts import render
from django.http import HttpResponse
from .models import Event

# TEST 1
#def test_view(request):
#    return render(request, 'events/test.html')

# TEST 2
#def test_view(request):
#    return render(request, 'events/test_navbar.html')

# TEST 3
#def test_view(request):
#    return render(request, 'events/test_card.html')



def event_list(request):
    """
    Vista principal: muestra la lista de eventos con mapa
    """
    eventos = Event.objects.all().select_related('owner').order_by('-date')
    
    context = {
        'eventos': eventos,
    }
    
    return render(request, 'events/event_list.html', context)

def test_view(request):
    return render(request, 'events/tests/test_mapa.html')