from django.shortcuts import render, redirect
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
        form = EventForm(request.POST)
        
        if form.is_valid():
            # Guardar el evento pero sin commit todavía
            evento = form.save(commit=False)
            
            # Asignar el usuario como organizador
            evento.owner = request.user
            
            # Guardar en la base de datos
            evento.save()
            
            # Mensaje de éxito
            messages.success(request, f'Evento "{evento.name}" creado exitosamente!')
            
            # Redirigir a la lista de eventos
            return redirect('events:event_list')
    else:
        # Mostrar formulario vacío
        form = EventForm()
    
    context = {
        'form': form,
    }
    
    return render(request, 'events/event_create.html', context)



# Vista de testeo de mapa
def test_view(request):
    return render(request, 'events/tests/test_mapa.html')