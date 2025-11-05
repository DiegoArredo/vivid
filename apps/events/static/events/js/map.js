/**
 * map.js - Inicialización del mapa con MapLibre GL JS
 * Incluye manejo de errores y fallbacks
 */

// Verificar que MapLibre GL JS está cargado
if (typeof maplibregl === 'undefined') {
    console.error('MapLibre GL JS no está cargado. Verifica que base.html incluye el script.');
}

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el contenedor del mapa
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
        console.error('Contenedor del mapa (#map) no encontrado');
        return;
    }

    // Verificar que maplibregl está disponible
    if (typeof maplibregl === 'undefined') {
        mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #e74c3c;">Error: MapLibre GL JS no está cargado. Verifica la conexión a internet.</div>';
        return;
    }

    // Obtener datos de eventos desde el script JSON
    let eventosData = [];
    try {
        const dataScript = document.getElementById('eventos-data');
        if (dataScript) {
            eventosData = JSON.parse(dataScript.textContent);
            console.log('Eventos cargados:', eventosData.length);
        } else {
            console.warn('No se encontró el script #eventos-data');
        }
    } catch (e) {
        console.error('Error parseando datos de eventos:', e);
    }

    // Configuración del mapa
    // Centro por defecto: Santiago de Chile
    const defaultCenter = [-70.6693, -33.4489];
    const defaultZoom = 12;

    // Si hay eventos con coordenadas, centrar en el primero
    let mapCenter = defaultCenter;
    const eventosConCoords = eventosData.filter(e => e.lat && e.lng);
    
    if (eventosConCoords.length > 0) {
        const firstEvent = eventosConCoords[0];
        mapCenter = [firstEvent.lng, firstEvent.lat];
        console.log('Centrando mapa en primer evento:', firstEvent.name);
    }

    // Inicializar el mapa
    let map;
    try {
        map = new maplibregl.Map({
            container: 'map',
            style: 'https://demotiles.maplibre.org/style.json',
            center: mapCenter,
            zoom: defaultZoom,
            attributionControl: true
        });

        console.log('Mapa inicializado correctamente');

        // Agregar controles de navegación
        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Esperar a que el mapa cargue completamente
        map.on('load', function() {
            console.log('Mapa cargado completamente');
            
            // Agregar marcadores para cada evento
            eventosConCoords.forEach(function(evento) {
                // Crear el marcador
                const marker = new maplibregl.Marker({
                    color: '#FF7B54' // Color naranja de Vivid
                })
                    .setLngLat([evento.lng, evento.lat])
                    .addTo(map);

                // Crear popup con información del evento
                const popup = new maplibregl.Popup({
                    offset: 25,
                    closeButton: false
                }).setHTML(`
                    <div style="font-family: Arial, sans-serif; padding: 5px;">
                        <strong style="color: #2c3e50; font-size: 14px;">${evento.name}</strong>
                        <br>
                        <a href="/evento/${evento.id}/" 
                           style="color: #FF7B54; text-decoration: none; font-size: 12px; margin-top: 5px; display: inline-block;">
                            Ver detalles →
                        </a>
                    </div>
                `);

                marker.setPopup(popup);

                // Hacer el marcador clickeable
                marker.getElement().style.cursor = 'pointer';
                marker.getElement().addEventListener('click', function() {
                    // Scroll a la tarjeta del evento en la lista
                    scrollToEvent(evento.id);
                });
            });

            console.log(`${eventosConCoords.length} marcadores agregados al mapa`);

            // Si hay múltiples eventos, ajustar el zoom para mostrarlos todos
            if (eventosConCoords.length > 1) {
                const bounds = new maplibregl.LngLatBounds();
                eventosConCoords.forEach(evento => {
                    bounds.extend([evento.lng, evento.lat]);
                });
                map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 14
                });
            }
        });

        // Manejar errores del mapa
        map.on('error', function(e) {
            console.error('Error en el mapa:', e);
        });

    } catch (error) {
        console.error('Error inicializando el mapa:', error);
        mapContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #e74c3c;">
                <p>Error al cargar el mapa</p>
                <p style="font-size: 12px; color: #7f8c8d;">${error.message}</p>
            </div>
        `;
    }

    // Función para hacer scroll a un evento específico en la lista
    window.scrollToEvent = function(eventId) {
        const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventCard) {
            eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Resaltar temporalmente la tarjeta
            eventCard.style.transition = 'background-color 0.3s ease';
            eventCard.style.backgroundColor = 'rgba(255, 123, 84, 0.1)';
            
            setTimeout(() => {
                eventCard.style.backgroundColor = '';
            }, 2000);
        }
    };

    // Función para mostrar un evento específico en el mapa
    window.showEventOnMap = function(eventId, lat, lng) {
        if (!map) {
            console.warn('Mapa no disponible');
            return;
        }

        if (lat && lng) {
            map.flyTo({
                center: [lng, lat],
                zoom: 15,
                duration: 1000
            });
        }
    };
});

// Función de utilidad para verificar el estado del mapa (debugging)
window.checkMapStatus = function() {
    console.log('=== Estado del Mapa ===');
    console.log('MapLibre GL cargado:', typeof maplibregl !== 'undefined');
    console.log('Contenedor #map existe:', !!document.getElementById('map'));
    console.log('Script #eventos-data existe:', !!document.getElementById('eventos-data'));
    
    const dataScript = document.getElementById('eventos-data');
    if (dataScript) {
        try {
            const data = JSON.parse(dataScript.textContent);
            console.log('Eventos en datos:', data.length);
            console.log('Eventos con coordenadas:', data.filter(e => e.lat && e.lng).length);
        } catch (e) {
            console.error('Error parseando datos:', e);
        }
    }
};
