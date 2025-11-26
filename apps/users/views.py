from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required


@login_required
def user_events_view(request):
    """
    Vista de eventos del usuario (creados y suscritos)
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