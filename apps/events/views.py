from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse, JsonResponse
from .models import Event, HasSubs, Category
from .forms import EventForm
from .utils import geocode_address
import json
import math
from django.db.models import Q, Count

def event_list(request):

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({"error": "JSON inválido"}, status=400)

        # Guardar valores en variables
        filter_type = data.get("filterType")
        search_value = data.get("searchValue")
        category_id = data.get("categoryId")

        if not search_value:
            search_value = None
        # convertir category_id a int
        try:
            category_id = int(category_id) if category_id is not None else None
        except (ValueError, TypeError):
            category_id = None

        # Obtener parámetros de filtrado
        # Query base
        eventos = Event.objects.all().select_related("owner", "category")

        # Aplicar búsqueda por texto
        if search_value:
            eventos = eventos.filter(
                Q(name__icontains=search_value)
                | Q(description__icontains=search_value)
                | Q(location__icontains=search_value)
                | Q(tags__icontains=search_value)
            )

        # Aplicar filtro por categoría
        if category_id:
            try:
                eventos = eventos.filter(category_id=category_id)
            except ValueError:
                pass

        # Aplicar ordenamiento según el filtro
        if filter_type == "recientes":
            # Ordenar por fecha más reciente
            eventos = eventos.order_by("date")

        elif filter_type == "populares":
            # Ordenar por número de asistentes (popularidad)
            eventos = eventos.annotate(
                num_attendees=Count('attendees')
            ).order_by('-num_attendees')

        elif filter_type == 'cercanos':
            # Ordenar por cercanía
            # Filtrar eventos con coordenadas
            eventos_con_coords = eventos.filter(
                latitud__isnull=False,
                longitud__isnull=False
            )
            
            # Intentar obtener la ubicación del usuario desde los parámetros
            user_lat = data.get('userLat')
            user_lng = data.get('userLng')
            
            if user_lat and user_lng:
                try:
                    user_lat = float(user_lat)
                    user_lng = float(user_lng)
                    
                    # Calcular distancia para cada evento y ordenar
                    eventos_list = list(eventos_con_coords)
                    for evento in eventos_list:
                        if evento.latitud and evento.longitud:
                            # Cálculo simple de distancia usando la fórmula de Haversine
                            lat1, lon1 = math.radians(user_lat), math.radians(user_lng)
                            lat2, lon2 = math.radians(float(evento.latitud)), math.radians(float(evento.longitud))
                            
                            dlat = lat2 - lat1
                            dlon = lon2 - lon1
                            
                            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                            c = 2 * math.asin(math.sqrt(a))
                            r = 6371  # Radio de la Tierra en kilómetros
                            
                            evento.distance = c * r
                        else:
                            evento.distance = float('inf')
                    
                    eventos = sorted(eventos_list, key=lambda x: x.distance)
                except (ValueError, AttributeError, TypeError):
                    # Si hay error, ordenar por fecha
                    eventos = eventos_con_coords.order_by('-date')

        else:
            # Filtro "all" o por defecto
            eventos = eventos

        # Serializar eventos para JSON (asegurando que las fechas sean strings)
        events_data = []
        # isAuthenticated = false, userId = null, subscribedEventIds = [] 
        options = {}
        isAuthenticated = request.user.is_authenticated
        subscribedEventIds = list(HasSubs.objects.filter(username=request.user).values_list('name_id', flat=True)) if isAuthenticated else []
        options['isAuthenticated'] = isAuthenticated
        options['subscribedEventIds'] = subscribedEventIds


        for ev in eventos:
            events_data.append(
                {
                    "id": ev.id,
                    "name": ev.name,
                    "description": ev.description,
                    "location": ev.location,
                    "date": ev.date.isoformat() if getattr(ev, "date", None) else None,
                    "latitud": str(ev.latitud) if ev.latitud else None,
                    "longitud": str(ev.longitud) if ev.longitud else None,
                    "distancia": int(getattr(ev, "distance", None)) if getattr(ev, "distance", None) is not None else None,
                    "category_id": ev.category_id,
                    "category_name": (
                        ev.category.category if getattr(ev, "category", None) else None
                    ),
                    "owner_id": ev.owner_id,
                    "owner_username": (
                        ev.owner.username if getattr(ev, "owner", None) else None
                    ),
                    "subscription_count": ev.attendees.count(),
                    "photo": ev.photo.url if ev.photo else None,
                }
            )
        
        response = {"events": events_data, "options": options}
        return JsonResponse(response, status=200)
   
    #Obtener eventos
    else:

        categorias = Category.objects.all()
        context = {        
            'categorias': categorias,
        }

        return render(request, 'events/event_list.html', context)
      

# @login_required(login_url='/users/login/')
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
                        "No se pudo geocodificar la dirección. Se guardará sin coordenadas (no se verá en el mapa).",
                    )

            ev.save()
            
            # **NUEVO: Suscribir automáticamente al creador del evento**
            HasSubs.objects.create(
                username=request.user,
                name=ev
            )
            
            messages.success(request, "Evento creado correctamente.")
            return redirect("events:event_detail", event_id=ev.id)
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
    isAuthenticated = request.user.is_authenticated
    subscribedEventIds = list(HasSubs.objects.filter(username=request.user).values_list('name_id', flat=True)) if isAuthenticated else []
    # **NUEVO: Verificar si el usuario está suscrito y si es el owner**
    is_subscribed = False
    is_owner = False
    if request.user.is_authenticated:
        is_subscribed = HasSubs.objects.filter(
            username=request.user,
            name=evento
        ).exists()
        is_owner = evento.owner == request.user

    context = {
        "evento": evento,
        "imagenes_adicionales": imagenes_adicionales,
        "isAuthenticated": isAuthenticated,
        "subscribed_event_ids": subscribedEventIds,
        "is_subscribed": is_subscribed,
        "is_owner": is_owner,
        "subscriber_count": evento.attendees.count(),
    }

    return render(request, "events/event_detail.html", context)


@login_required
def subscribe(request):
    """Procesa la suscripción de un usuario a un evento.

    Se espera un POST con `event_id`. Si la suscripción ya existe, muestra
    un mensaje informativo; si se crea correctamente, muestra éxito.
    Redirige a la página desde la que vino el request (HTTP_REFERER) o a
    la lista de eventos como fallback.
    """
    if request.method != 'POST':
        return redirect('events:event_list')
    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "JSON inválido"}, status=400)

    event_id = data.get('event_id')
    if not event_id:
        return JsonResponse({'status': 'error', 'message': 'ID de evento faltante.'}, status=400)

    try:
        evento = Event.objects.get(id=int(event_id))
    except (Event.DoesNotExist, ValueError):
        return JsonResponse({'status': 'error', 'message': 'Evento no encontrado.'}, status=404)

    # Intentar crear la suscripción, respetando la unicidad definida en HasSubs
    sub, created = HasSubs.objects.get_or_create(username=request.user, name=evento)
    message = f'Te has suscrito a "{evento.name}".' if created else f'Ya estás suscrito a "{evento.name}".'

    # Si la petición es AJAX, responder JSON para permitir actualización en página
    return JsonResponse({
        'status': 'success' if created else 'info',
        'message': message,
        'subscribed': True,
        'event_id': evento.id,
        'subscription_count': evento.attendees.count(),
    })


@login_required
def unsubscribe(request):
    """Procesa la desuscripción de un usuario a un evento (POST).

    Responde JSON si la petición es AJAX, o redirect si es una petición normal.
    """
    if request.method != 'POST':
        return redirect('events:event_list')
    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "JSON inválido"}, status=400)

    event_id = data.get('event_id')
    if not event_id:
        return JsonResponse({'status': 'error', 'message': 'ID de evento faltante.'}, status=400)
    try:
        evento = Event.objects.get(id=int(event_id))
    except (Event.DoesNotExist, ValueError):
        return JsonResponse({'status': 'error', 'message': 'Evento no encontrado.'}, status=404)    
    
    deleted, _ = HasSubs.objects.filter(username=request.user, name=evento).delete()
    if deleted:
        message = f'Te has desuscrito de "{evento.name}".'
    else:
        message = f'No estabas suscrito a "{evento.name}".'

   
    return JsonResponse({
        'status': 'success' if deleted else 'info',
        'message': message,
        'subscribed': False,
        'event_id': evento.id,
        'subscription_count': evento.attendees.count(),
    })

@login_required
def calendar_view(request):
    """Vista de calendario interactivo con eventos suscritos del usuario"""
    # Obtener todos los eventos a los que el usuario está suscrito
    suscripciones = HasSubs.objects.filter(username=request.user).select_related('name')
    eventos_suscritos = [sub.name for sub in suscripciones]
    
    # Agrupar eventos por mes
    eventos_por_mes = {}
    for evento in eventos_suscritos:
        fecha = evento.date
        mes_key = f"{fecha.year}-{fecha.month:02d}"
        if mes_key not in eventos_por_mes:
            eventos_por_mes[mes_key] = []
        eventos_por_mes[mes_key].append({
            'id': evento.id,
            'name': evento.name,
            'date': evento.date.isoformat(),
            'date_formatted': evento.date.strftime('%d de %B de %Y'),
            'time_formatted': evento.date.strftime('%H:%M'),
            'location': evento.location,
            'category': evento.category.category if evento.category else 'Sin categoría',
            'organizer': evento.owner.username,
        })
    
    # Obtener el mes actual
    from datetime import datetime
    hoy = datetime.now()
    mes_actual = f"{hoy.year}-{hoy.month:02d}"
    
    # Convertir a JSON string para el template
    eventos_por_mes_json = json.dumps(eventos_por_mes)
    
    context = {
        'eventos_suscritos': eventos_suscritos,
        'eventos_por_mes': eventos_por_mes_json,
        'mes_actual': mes_actual,
    }
    
    return render(request, 'events/calendar.html', context)

def about(request):
    return render(request, 'events/about.html')

