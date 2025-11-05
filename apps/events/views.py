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
    Soporta filtros: cercanos, recientes, populares, búsqueda y categorías
    """
    from django.db.models import Count, Q
    from decimal import Decimal
    import math
    
    # Obtener parámetros de filtrado
    filter_type = request.GET.get('filter', 'all')
    search_query = request.GET.get('search', '').strip()
    category_id = request.GET.get('category', None)
    
    # Query base
    eventos = Event.objects.all().select_related('owner', 'category')
    
    # Aplicar búsqueda por texto
    if search_query:
        eventos = eventos.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(location__icontains=search_query) |
            Q(tags__icontains=search_query)
        )
    
    # Aplicar filtro por categoría
    if category_id:
        try:
            eventos = eventos.filter(category_id=category_id)
        except ValueError:
            pass
    
    # Aplicar ordenamiento según el filtro
    if filter_type == 'recientes':
        # Ordenar por fecha más reciente
        eventos = eventos.order_by('-date')
        
    elif filter_type == 'populares':
        # Ordenar por número de asistentes (popularidad)
        eventos = eventos.annotate(
            num_attendees=Count('attendees')
        ).order_by('-num_attendees', '-date')
        
    elif filter_type == 'cercanos':
        # Ordenar por cercanía
        # Filtrar eventos con coordenadas
        eventos_con_coords = eventos.filter(
            latitud__isnull=False,
            longitud__isnull=False
        )
        
        # Intentar obtener la ubicación del usuario desde los parámetros
        user_lat = request.GET.get('lat')
        user_lng = request.GET.get('lng')
        
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
            # Sin ubicación del usuario, mostrar eventos con coordenadas ordenados por fecha
            eventos = eventos_con_coords.order_by('-date')
    else:
        # Filtro "all" o por defecto
        eventos = eventos.order_by('-date')
    
    # Obtener todas las categorías para el filtro
    from .models import Category
    categorias = Category.objects.all()
    
    context = {
        'eventos': eventos,
        'categorias': categorias,
        'filter_active': filter_type,
        'search_query': search_query,
        'category_selected': category_id,
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