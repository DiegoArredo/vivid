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
    """
    Vista principal para listar y filtrar eventos.
    
    Maneja dos tipos de peticiones:
    - GET: Renderiza la página de lista de eventos con todas las categorías.
    - POST: Procesa filtros y búsquedas, devolviendo eventos en formato JSON.
    
    Filtros disponibles (POST):
        - searchValue: Búsqueda de texto en nombre, descripción, ubicación y tags.
        - categoryId: Filtrado por categoría específica.
        - filterType: Tipo de ordenamiento aplicado:
            * 'recientes': Ordena por fecha más próxima.
            * 'populares': Ordena por número de asistentes (mayor a menor).
            * 'cercanos': Ordena por distancia geográfica desde la ubicación del usuario.
                         Requiere userLat y userLng en la petición.
            * 'all' o default: Sin ordenamiento especial.
    
    Parámetros POST esperados:
        filterType (str): Tipo de filtro ('recientes', 'populares', 'cercanos', 'all').
        searchValue (str, opcional): Texto de búsqueda.
        categoryId (int, opcional): ID de la categoría para filtrar.
        userLat (float, opcional): Latitud del usuario (para filtro 'cercanos').
        userLng (float, opcional): Longitud del usuario (para filtro 'cercanos').
    
    Returns:
        GET: Renderiza 'events/event_list.html' con el contexto de categorías.
        POST: JsonResponse con:
            - events: Lista de eventos serializados con toda su información.
            - options: Información del usuario (isAuthenticated, subscribedEventIds).
    """

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
      

@login_required(login_url='/users/login/')
def event_create(request):
    """
    Vista para la creación de nuevos eventos.
    
    Permite a los usuarios autenticados crear eventos mediante un formulario.
    Si las coordenadas geográficas no se proporcionan, intenta geocodificar
    automáticamente la dirección ingresada en el campo 'location'.
    
    Al crear un evento exitosamente:
    - Se asigna automáticamente el usuario actual como propietario (owner).
    - El creador se suscribe automáticamente al evento mediante HasSubs.
    - Se intenta geocodificar la ubicación si no tiene coordenadas.
    
    Args:
        request: Objeto HttpRequest de Django.
    
    Returns:
        GET: Renderiza 'events/event_create.html' con formulario vacío.
        POST: Redirige a 'events:event_detail' si tiene éxito, o re-renderiza
              el formulario con errores si la validación falla.
    
    Decoradores:
        @login_required: Requiere que el usuario esté autenticado.
    """
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


def event_detail(request, event_id):
    """
    Vista de detalle que muestra toda la información de un evento específico.
    
    Args:
        request: Objeto HttpRequest de Django.
        event_id (int): ID del evento a mostrar.
    
    Returns:
        HttpResponse: Renderiza 'events/event_detail.html' con el siguiente contexto:
            - evento: Objeto Event con toda la información del evento.
            - imagenes_adicionales: QuerySet de EventImage relacionadas.
            - isAuthenticated: Boolean indicando si el usuario está autenticado.
            - subscribed_event_ids: Lista de IDs de eventos a los que está suscrito.
            - is_subscribed: Boolean indicando si está suscrito a este evento.
            - is_owner: Boolean indicando si el usuario es el organizador.
            - subscriber_count: Número total de suscriptores del evento.

    """
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
    """
    Procesa la suscripción de un usuario a un evento.
    
    Permite a usuarios autenticados suscribirse a eventos. Si ya están suscritos,
    retorna un mensaje informativo.
    
    Args:
        request: Objeto HttpRequest de Django.
    
    Parámetros esperados (POST JSON):
        event_id (int): ID del evento al que suscribirse.
    
    Returns:
        JsonResponse con:
            - status (str): 'success' si se creó la suscripción, 'info' si ya existía,
                           'error' si hubo un problema.
            - message (str): Mensaje descriptivo del resultado.
            - subscribed (bool): True indicando que el usuario está suscrito.
            - event_id (int): ID del evento.
            - subscription_count (int): Número actualizado de suscriptores.
    
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
    """
    Procesa la desuscripción de un usuario de un evento.
    
    Elimina la suscripción existente entre el usuario autenticado y el evento
    especificado. Si no existe una suscripción previa, retorna un mensaje informativo.
    
    Args:
        request: Objeto HttpRequest de Django.
    
    Parámetros esperados (POST JSON):
        event_id (int): ID del evento del que desuscribirse.
    
    Returns:
        JsonResponse con:
            - status (str): 'success' si se eliminó la suscripción, 'info' si no existía,
                           'error' si hubo un problema.
            - message (str): Mensaje descriptivo del resultado.
            - subscribed (bool): False indicando que el usuario no está suscrito.
            - event_id (int): ID del evento.
            - subscription_count (int): Número actualizado de suscriptores.
    
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
    """
    Vista de calendario interactivo que muestra los eventos suscritos del usuario.
    
    Presenta un calendario visual con todos los eventos a los que el usuario está
    suscrito, agrupados por mes para facilitar la navegación temporal. Cada evento
    incluye información detallada como nombre, fecha formateada, ubicación,
    categoría y organizador.
    
    Args:
        request: Objeto HttpRequest de Django.
    
    Returns:
        HttpResponse: Renderiza 'events/calendar.html' con el siguiente contexto:
            - eventos_suscritos: Lista de objetos Event del usuario.
            - eventos_por_mes: String JSON con eventos agrupados por mes (YYYY-MM).
                              Cada evento incluye:
                              * id: ID del evento
                              * name: Nombre del evento
                              * date: Fecha ISO format
                              * date_formatted: Fecha legible (ej. "15 de Enero de 2025")
                              * time_formatted: Hora legible (ej. "18:30")
                              * location: Ubicación del evento
                              * category: Nombre de la categoría o 'Sin categoría'
                              * organizer: Username del organizador
            - mes_actual: String con el mes actual en formato 'YYYY-MM'.
    
    """
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
    """
    Vista simple que renderiza la página 'Acerca de' o 'About'.
    
    Muestra información general sobre la aplicación, sus características,
    equipo de desarrollo u otra información corporativa.
    
    Args:
        request: Objeto HttpRequest de Django.
    
    Returns:
        HttpResponse: Renderiza 'events/about.html' sin contexto adicional.
    """
    return render(request, 'events/about.html')

