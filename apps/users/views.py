from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required
def logout_view(request):
    """
    Vista de cierre de sesión
    """
    username = request.user.username
    logout(request)
    messages.info(request, f'Has cerrado sesión. ¡Hasta pronto, {username}!')
    return redirect('events:event_list')  # ← CORREGIDO: agregado 'events:'


@login_required
def user_events_view(request):
    """
    Vista de eventos del usuario (creados y suscritos)
    """
    from apps.events.models import Event
    
    # Eventos creados por el usuario
    created_events = Event.objects.filter(owner=request.user).order_by('-date')
    
    # Eventos a los que el usuario está suscrito
    # Esto requiere el modelo HasSubs implementado
    # subscribed_events = Event.objects.filter(hassubs__user=request.user).order_by('-date')
    
    context = {
        'created_events': created_events,
        # 'subscribed_events': subscribed_events,
    }
    
    return render(request, 'users/user_events.html', context)
