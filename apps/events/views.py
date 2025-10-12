from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from .models import Event
from .forms import EventForm


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

# Vista para crear nuevo evento
#@login_required -> Login se hará en futuras iteraciones
def event_create(request):
    if request.method == 'POST':
        form = EventForm(request.POST, request.FILES) 
        
        if form.is_valid():
            evento = form.save(commit=False)

            if evento.location:
                # Aquí llamaríamos a una API de geocoding
                # Por ahora, dejar en null (el modelo permite null=True, blank=True)
                pass
        
            # Temporal: asignar un usuario por defecto
            # Cuando se implemente login, usa: evento.owner = request.user
            if request.user.is_authenticated:
                evento.owner = request.user

            # Asignar al primer usuario existente (solo para testing)    
            else:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                evento.owner = User.objects.first()
                
                if not evento.owner:
                    messages.error(request, 'No hay usuarios en el sistema.')
                    return redirect('events:event_create')
            
            evento.save()
            messages.success(request, f'Evento "{evento.name}" creado exitosamente!')
            return redirect('events:event_list')
    else:
        form = EventForm()
    
    context = {'form': form}
    return render(request, 'events/event_create.html', context)

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