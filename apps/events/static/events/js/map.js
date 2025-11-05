/**
 * map.js - Mapa con OpenFreeMap Liberty (muestra calles, edificios, etc.)
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Inicializando mapa...');
    
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
        console.error('❌ Contenedor del mapa (#map) no encontrado');
        return;
    }

    if (typeof maplibregl === 'undefined') {
        console.error('❌ MapLibre GL JS no está cargado');
        mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #e74c3c;">Error: MapLibre GL JS no está cargado.</div>';
        return;
    }

    console.log('✅ MapLibre GL JS cargado');

    // Obtener datos de eventos
    let eventosData = [];
    try {
        const dataScript = document.getElementById('eventos-data');
        if (dataScript) {
            eventosData = JSON.parse(dataScript.textContent);
            console.log('✅ Eventos cargados:', eventosData.length);
            
            const eventosConCoords = eventosData.filter(e => e.lat !== null && e.lng !== null);
            console.log('📍 Eventos con coordenadas:', eventosConCoords.length);
            
            if (eventosConCoords.length > 0) {
                console.log('Eventos con coordenadas:');
                eventosConCoords.forEach(e => {
                    console.log(`  - ${e.name}: (${e.lat}, ${e.lng})`);
                });
            }
        } else {
            console.warn('⚠️ No se encontró el script #eventos-data');
        }
    } catch (e) {
        console.error('❌ Error parseando datos de eventos:', e);
    }

    // Centro del mapa - Santiago, Chile por defecto
    const defaultCenter = [-70.6693, -33.4489];
    let mapCenter = defaultCenter;
    let mapZoom = 12;

    // Si hay eventos con coordenadas, centrar en el primero
    const eventosConCoords = eventosData.filter(e => e.lat !== null && e.lng !== null);
    
    if (eventosConCoords.length > 0) {
        const firstEvent = eventosConCoords[0];
        mapCenter = [parseFloat(firstEvent.lng), parseFloat(firstEvent.lat)];
        mapZoom = 13;
        console.log('✅ Centrando mapa en:', firstEvent.name, mapCenter);
    }

    // Inicializar el mapa con OpenFreeMap Liberty style
    let map;
    try {
        console.log('🔄 Creando instancia del mapa con OpenFreeMap Liberty...');
        
        map = new maplibregl.Map({
            container: 'map',
            style: 'https://tiles.openfreemap.org/styles/liberty', // ← ESTE es el estilo correcto
            center: mapCenter,
            zoom: mapZoom,
            attributionControl: true
        });

        console.log('✅ Mapa creado, esperando a que cargue...');

        // Agregar controles de navegación
        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Evento cuando el mapa termina de cargar
        map.on('load', function() {
            console.log('✅ Mapa completamente cargado');
            console.log('✅ Estilo OpenFreeMap Liberty aplicado correctamente');
            
            // Agregar marcadores para eventos
            if (eventosConCoords.length === 0) {
                console.warn('⚠️ No hay eventos con coordenadas para mostrar');
                return;
            }
            
            console.log('📍 Agregando marcadores...');
            
            let markersAdded = 0;
            eventosConCoords.forEach(function(evento, index) {
                try {
                    const lng = parseFloat(evento.lng);
                    const lat = parseFloat(evento.lat);
                    
                    if (isNaN(lng) || isNaN(lat)) {
                        console.warn(`⚠️ Coordenadas inválidas para evento ${evento.name}`);
                        return;
                    }
                    
                    console.log(`  ${index + 1}. Agregando marcador: ${evento.name} en [${lng}, ${lat}]`);
                    
                    // Crear el marcador
                    const marker = new maplibregl.Marker({
                        color: '#FF7B54', // Naranja de Vivid
                        scale: 1.2
                    })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    // Crear popup
                    const popup = new maplibregl.Popup({
                        offset: 25,
                        closeButton: true,
                        closeOnClick: false,
                        maxWidth: '300px'
                    }).setHTML(`
                        <div style="font-family: 'Arial', sans-serif; padding: 5px;">
                            <strong style="color: #2c3e50; font-size: 15px; display: block; margin-bottom: 8px;">
                                ${evento.name}
                            </strong>
                            <a href="/evento/${evento.id}/" 
                               style="color: #FF7B54; text-decoration: none; font-size: 13px; font-weight: 500;">
                                Ver detalles →
                            </a>
                        </div>
                    `);

                    marker.setPopup(popup);

                    // Click en el marcador para hacer scroll a la tarjeta
                    marker.getElement().style.cursor = 'pointer';
                    marker.getElement().addEventListener('click', function(e) {
                        e.stopPropagation();
                        scrollToEvent(evento.id);
                    });
                    
                    markersAdded++;
                    console.log(`  ✅ Marcador #${markersAdded} agregado: ${evento.name}`);
                    
                } catch (error) {
                    console.error(`❌ Error agregando marcador para ${evento.name}:`, error);
                }
            });

            console.log(`✅ Total: ${markersAdded} marcadores agregados exitosamente`);

            // Si hay múltiples eventos, ajustar el zoom para mostrarlos todos
            if (eventosConCoords.length > 1) {
                try {
                    const bounds = new maplibregl.LngLatBounds();
                    eventosConCoords.forEach(evento => {
                        const lng = parseFloat(evento.lng);
                        const lat = parseFloat(evento.lat);
                        if (!isNaN(lng) && !isNaN(lat)) {
                            bounds.extend([lng, lat]);
                        }
                    });
                    
                    map.fitBounds(bounds, {
                        padding: { top: 50, bottom: 50, left: 50, right: 50 },
                        maxZoom: 14,
                        duration: 1000
                    });
                    
                    console.log('✅ Zoom ajustado para mostrar todos los eventos');
                } catch (error) {
                    console.error('❌ Error ajustando bounds:', error);
                }
            }
        });

        // Manejar errores del mapa
        map.on('error', function(e) {
            console.error('❌ Error en el mapa:', e);
            if (e.error && e.error.message) {
                console.error('Mensaje de error:', e.error.message);
            }
        });

        // Evento cuando los tiles están cargando
        map.on('dataloading', function(e) {
            if (e.dataType === 'source') {
                console.log('🔄 Cargando tiles del mapa...');
            }
        });

        // Evento cuando todo está listo
        map.on('idle', function() {
            console.log('✅ Mapa en estado idle (todo cargado)');
        });

    } catch (error) {
        console.error('❌ Error inicializando el mapa:', error);
        mapContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #e74c3c;">
                <p><strong>Error al cargar el mapa</strong></p>
                <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">${error.message}</p>
                <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">
                    Verifica tu conexión a internet y recarga la página.
                </p>
            </div>
        `;
    }

    // Función global para hacer scroll a un evento específico en la lista
    window.scrollToEvent = function(eventId) {
        console.log('🔍 Buscando tarjeta del evento ID:', eventId);
        
        // Buscar por data-event-id
        let eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
        
        // Si no se encuentra, buscar por enlace
        if (!eventCard) {
            const link = document.querySelector(`a[href*="/evento/${eventId}/"]`);
            if (link) {
                eventCard = link.closest('.event-card') || link.closest('[class*="card"]');
            }
        }
        
        if (eventCard) {
            console.log('✅ Tarjeta encontrada, haciendo scroll');
            eventCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Resaltar temporalmente
            const originalBg = eventCard.style.backgroundColor;
            eventCard.style.transition = 'background-color 0.3s ease';
            eventCard.style.backgroundColor = 'rgba(255, 123, 84, 0.15)';
            
            setTimeout(() => {
                eventCard.style.backgroundColor = originalBg;
            }, 2000);
        } else {
            console.warn('⚠️ No se encontró la tarjeta del evento con ID:', eventId);
        }
    };

    // Función global para mostrar un evento específico en el mapa
    window.showEventOnMap = function(eventId, lat, lng) {
        if (!map) {
            console.warn('⚠️ Mapa no disponible');
            return;
        }

        if (lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
                console.log('🗺️ Volando a coordenadas:', latitude, longitude);
                map.flyTo({
                    center: [longitude, latitude],
                    zoom: 15,
                    duration: 1500,
                    essential: true
                });
            } else {
                console.warn('⚠️ Coordenadas inválidas:', lat, lng);
            }
        } else {
            console.warn('⚠️ Coordenadas no disponibles');
        }
    };

    // Función de debug para diagnosticar problemas
    window.debugMap = function() {
        console.log('═══════════════════════════════════════');
        console.log('DEBUG DEL MAPA');
        console.log('═══════════════════════════════════════');
        console.log('Mapa inicializado:', !!map);
        console.log('MapLibre disponible:', typeof maplibregl !== 'undefined');
        console.log('Contenedor #map existe:', !!document.getElementById('map'));
        console.log('Script #eventos-data existe:', !!document.getElementById('eventos-data'));
        console.log('Eventos totales:', eventosData.length);
        console.log('Eventos con coordenadas:', eventosConCoords.length);
        
        if (map) {
            console.log('Centro actual:', map.getCenter());
            console.log('Zoom actual:', map.getZoom());
            console.log('Estilo cargado:', map.isStyleLoaded());
            console.log('Estilo URL:', 'https://tiles.openfreemap.org/styles/liberty');
        }
        
        console.log('═══════════════════════════════════════');
        
        return {
            mapInitialized: !!map,
            eventsTotal: eventosData.length,
            eventsWithCoords: eventosConCoords.length,
            mapCenter: map ? map.getCenter() : null,
            mapZoom: map ? map.getZoom() : null
        };
    };
});
