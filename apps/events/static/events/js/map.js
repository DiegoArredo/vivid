// Configuración del mapa con MapLibre GL JS
let map;
let markers = [];

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Leer datos de eventos
    const eventosDataElement = document.getElementById('eventos-data');
    
    if (!eventosDataElement) {
        console.warn('No se encontró el elemento eventos-data');
        return;
    }
    
    let eventosData = [];
    try {
        eventosData = JSON.parse(eventosDataElement.textContent);
    } catch (e) {
        console.error('Error al parsear datos de eventos:', e);
        return;
    }
    
    // Inicializar mapa
    initMap(eventosData);
    
    // Configurar clicks en event cards
    setupEventCardClicks();
});

function initMap(eventosData) {
    try {
        // Verificar que maplibregl esté disponible
        if (typeof maplibregl === 'undefined') {
            console.error('MapLibre GL no está cargado');
            return;
        }
        
        // Inicializar mapa centrado en Santiago, Chile
        map = new maplibregl.Map({
            container: 'map',
            style: 'https://demotiles.maplibre.org/style.json',
            center: [-70.6643, -33.4569], // [lng, lat]
            zoom: 13
        });

        // Cuando el mapa termine de cargar
        map.on('load', function() {
            console.log('✅ Mapa cargado correctamente');
            
            // Agregar controles de navegación
            map.addControl(new maplibregl.NavigationControl(), 'top-right');
            
            // Agregar marcadores de eventos
            addEventMarkers(eventosData);
        });
        
        // Manejar errores del mapa
        map.on('error', function(e) {
            console.error('Error del mapa:', e);
        });
        
    } catch (error) {
        console.error('Error al inicializar el mapa:', error);
    }
}

function addEventMarkers(eventos) {
    eventos.forEach(evento => {
        if (evento.lat && evento.lng) {
            // Crear elemento del marcador personalizado
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.backgroundColor = '#FF7B54';
            el.style.border = '3px solid white';
            el.style.borderRadius = '50%';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            el.style.transition = 'transform 0.3s';
            
            // Efecto hover
            el.addEventListener('mouseenter', function() {
                el.style.transform = 'scale(1.2)';
            });
            
            el.addEventListener('mouseleave', function() {
                el.style.transform = 'scale(1)';
            });

            // Crear marcador
            const marker = new maplibregl.Marker({element: el})
                .setLngLat([evento.lng, evento.lat])
                .addTo(map);

            // Crear popup con información del evento
            const popup = new maplibregl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false
            }).setHTML(`
                <div style="padding: 10px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">${evento.name}</h4>
                    <button 
                        onclick="scrollToEvent(${evento.id})"
                        style="
                            background: #FF7B54;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 20px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 600;
                        "
                    >
                        Ver evento
                    </button>
                </div>
            `);

            marker.setPopup(popup);

            // Click en marcador muestra popup
            el.addEventListener('click', function() {
                marker.togglePopup();
            });

            // Guardar referencia del marcador
            markers.push({
                id: evento.id,
                marker: marker,
                popup: popup
            });
        }
    });

    // Si hay eventos, ajustar la vista del mapa
    if (eventos.length > 0) {
        const validEvents = eventos.filter(e => e.lat && e.lng);
        
        if (validEvents.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            validEvents.forEach(evento => {
                bounds.extend([evento.lng, evento.lat]);
            });
            
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15
                });
            }
        }
    }
}

// Función para mostrar evento en el mapa
function showEventOnMap(eventoId) {
    const markerData = markers.find(m => m.id === eventoId);
    
    if (markerData) {
        const lngLat = markerData.marker.getLngLat();
        
        // Centrar el mapa en el marcador
        map.flyTo({
            center: [lngLat.lng, lngLat.lat],
            zoom: 16,
            duration: 1000
        });
        
        // Mostrar el popup
        setTimeout(() => {
            markerData.marker.togglePopup();
        }, 1000);
    }
}

// Función para hacer scroll a un evento específico
function scrollToEvent(eventoId) {
    const eventCard = document.querySelector(`[data-event-id="${eventoId}"]`);
    
    if (eventCard) {
        eventCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Resaltar la tarjeta temporalmente
        eventCard.classList.add('highlighted');
        setTimeout(() => {
            eventCard.classList.remove('highlighted');
        }, 2000);
    }
}

// Configurar clicks en las tarjetas de eventos
function setupEventCardClicks() {
    const eventCards = document.querySelectorAll('.event-card');
    
    eventCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // No hacer nada si se hizo click en el botón
            if (e.target.closest('.attend-btn')) {
                return;
            }
            
            const eventId = parseInt(this.dataset.eventId);
            if (eventId) {
                showEventOnMap(eventId);
            }
        });
        
        // Cursor pointer para indicar que es clickeable
        card.style.cursor = 'pointer';
    });
}