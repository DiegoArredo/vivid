from django.shortcuts import render
from django.http import HttpResponse

# TEST 1
#def test_view(request):
#    return render(request, 'events/test.html')

# TEST 2
#def test_view(request):
#    return render(request, 'events/test_navbar.html')

# TEST 3
#def test_view(request):
#    return render(request, 'events/test_card.html')

def test_view(request):
    return render(request, 'events/test_mapa.html')