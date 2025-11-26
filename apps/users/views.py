from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required


@login_required
def user_events_view(request):
    """
    Vista del panel de eventos personales del usuario autenticado.
    
    Muestra una página con todos los eventos relacionados con el usuario,
    organizados en dos categorías diferentes para facilitar la gestión:
    1. Eventos creados por el usuario (como organizador).
    2. Eventos suscritos que no son creados por el usuario (como asistente).
    
    Args:
        request: Objeto HttpRequest de Django.
    
    Returns:
        HttpResponse: Renderiza 'users/my_events.html' con el siguiente contexto:
            - created_events: QuerySet de eventos creados por el usuario,
                             ordenados por fecha descendente (más recientes primero).
            - subscribed_events: Lista de todos los eventos a los que el usuario
                                está suscrito (incluyendo los que creó).
            - subscribed_events_not_owned: Lista filtrada de eventos suscritos
                                          excluyendo aquellos que el usuario creó
                                          (solo eventos donde asiste como participante).
    
    """
    from apps.events.models import Event, HasSubs
    
    # Eventos creados por el usuario
    created_events = Event.objects.filter(owner=request.user).order_by('-date')
    
    # Eventos a los que el usuario está suscrito
    suscripciones = HasSubs.objects.filter(username=request.user).select_related('name')
    subscribed_events = [sub.name for sub in suscripciones]
    

    subscribed_events_not_owned = [event for event in subscribed_events if event.owner != request.user]
    
    context = {
        'created_events': created_events,
        'subscribed_events': subscribed_events,
        'subscribed_events_not_owned': subscribed_events_not_owned,
    }
    
    return render(request, 'users/my_events.html', context)