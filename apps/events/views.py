from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from .models import Event
from .forms import EventForm
from .utils import geocode_address  


# Vista de testeo css y estilos de home
#def test_view(request):
#    return render(request, 'events/test.html')

# Vista de testeo de navbar
#def test_view(request):
#    return render(request, 'events/test_navbar.html')

# Vista de testeo de event card
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



#@login_required(login_url='/users/login/')
def event_create(request):
    if request.method == "POST":
        form = EventForm(request.POST, request.FILES)
        if form.is_valid():
            ev = form.save(commit=False)
            ev.owner = request.user

            # Si no hay coords, intenta geocodificar a partir de location
            if ev.latitud is None or ev.longitud is None:
                lat, lng = geocode_address(ev.location)
                if lat is not None and lng is not None:
                    ev.latitud = lat
                    ev.longitud = lng
                else:
                    messages.warning(
                        request,
                        "No se pudo geocodificar la dirección. Se guardará sin coordenadas (no se verá en el mapa)."
                    )

            ev.save()
            messages.success(request, "Evento creado correctamente.")
            return redirect("events:event_list")
        else:
            messages.error(request, "Revisa el formulario.")
    else:
        form = EventForm()

    return render(request, "events/event_create.html", {"form": form})


# Vista de detalle: muestra toda la información de un evento específico
def event_detail(request, event_id):
    evento = get_object_or_404(Event, id=event_id)
    
    # Obtener imágenes adicionales del evento (si existen)
    imagenes_adicionales = evento.images.all()
    
    context = {
        'evento': evento,
        'imagenes_adicionales': imagenes_adicionales,
    }
    
    return render(request, 'events/event_detail.html', context)


# Vista de testeo de mapa
def test_view(request):
    return render(request, 'events/tests/test_mapa.html')