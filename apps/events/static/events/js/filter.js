// ===============================
// CSRF y utils básicos
// ===============================

// Funcion para obtener valores de parametros de cookies. Especialmente CSRFToken
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Revisa si esta cookie es la que buscamos
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// Obtenemos el token CSRF
const csrftoken = getCookie('csrftoken');

// ===============================
// Geolocalización + distancias
// ===============================

let currentUserLocation = null;

/**
 * Distancia Haversine en metros entre dos puntos lat/lng
 */
function distanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // metros
    const toRad = deg => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formato bonito de la distancia
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} M`;
    }
    return `${(meters / 1000).toFixed(1)} KM`;
}

/**
 * Recorre las .event-card y actualiza el span [data-distance]
 * usando la ubicación del usuario
 */
function updateEventDistancesForCards(userLat, userLng) {
    if (typeof userLat !== 'number' || typeof userLng !== 'number') {
        console.warn('[distance] userLat/userLng inválidos:', userLat, userLng);
        return;
    }

    const cards = document.querySelectorAll('.event-card[data-lat][data-lng]');
    console.log('[distance] Actualizando distancias. Cards encontradas:', cards.length);

    cards.forEach(card => {
        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);

        if (isNaN(lat) || isNaN(lng)) {
            console.warn('[distance] Card sin coords válidas, se salta:', card.dataset.id);
            return;
        }

        const meters = distanceInMeters(userLat, userLng, lat, lng);
        const span = card.querySelector('[data-distance]');

        if (span) {
            span.textContent = formatDistance(meters);
            card.dataset.distanceMeters = meters.toFixed(0);
            // console.log('[distance] Distancia card', card.dataset.id, ':', meters, 'm');
        } else {
            console.warn('[distance] No hay span [data-distance] en card', card.dataset.id);
        }
    });
}

/**
 * Pide la ubicación del usuario (si no la teníamos) y llama a callback
 * con {lat, lng} o null si falla / deniega permiso.
 */
function getUserLocation(callback) {
    // Si ya tenemos la ubicación en caché, usarla directamente
    if (currentUserLocation) {
        console.log('Usando ubicación en caché:', currentUserLocation);
        callback(currentUserLocation);
        return;
    }

    if (!navigator.geolocation) {
        console.error('❌ Geolocalización no soportada en este navegador');
        alert('Tu navegador no soporta geolocalización. Por favor, actualiza tu navegador.');
        callback(null);
        return;
    }

    console.log('🔍 Solicitando ubicación al usuario...');
    
    navigator.geolocation.getCurrentPosition(
        position => {
            currentUserLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            window.currentUserLocation = currentUserLocation;
            console.log('[geo] ubicación obtenida:', currentUserLocation);

            // Si ya hay cards en pantalla, intenta actualizar distancias
            updateEventDistancesForCards(currentUserLocation.lat, currentUserLocation.lng);

            callback(currentUserLocation);
        },
        error => {
            console.warn('No se pudo obtener la ubicación:', error);
            callback(null);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// ===============================
// Filtro vía POST
// ===============================

/**
 * Funcion de filtro de eventos que envia el tipo de filtro, valor y categoria (si aplica) por POST.
 * Ahora también puede enviar la ubicación del usuario si se la pasamos.
 */
const applyfilter = (filterType, searchValue = null, categoryId = null, userLocation = null) => {
    const url = new URL(window.location);

    // Cuerpo básico del POST
    const bodyData = {
        filterType: filterType,
        searchValue: searchValue,
        categoryId: categoryId
    };

    // Si tenemos ubicación de usuario, la agregamos al body
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
        bodyData.userLat = userLocation.lat;
        bodyData.userLng = userLocation.lng;
    }

    fetch(url, {
        method: "POST",
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
    })
        .then(response => response.json())
        .then(data => {
            console.log("Datos recibidos: " + JSON.stringify(data));
            try {
                const eventosList = document.getElementById('eventos-list');
                if (!eventosList) {
                    console.warn('No se encontró #eventos-list para vaciarlo.');
                    return;
                }

                // Vaciar contenedor de cards
                eventosList.innerHTML = '';
                console.log('El contenedor #eventos-list fue vaciado.');

                // Si la respuesta tiene eventos, crear las cards y añadirlas
                const events = (data && data.events)
                    ? data.events
                    : (data && data.body && data.body.events ? data.body.events : null);

                if (Array.isArray(events) && events.length > 0) {

                    // 👉 Si el filtro es "cercanos" y tenemos ubicación, ordenamos por distancia
                    if (filterType === 'cercanos' && currentUserLocation) {
                        events.sort((a, b) => {
                            const latA = parseFloat(a.latitud);
                            const lngA = parseFloat(a.longitud);
                            const latB = parseFloat(b.latitud);
                            const lngB = parseFloat(b.longitud);

                            // Si alguna coordenada es inválida, las dejamos al mismo nivel
                            if (
                                isNaN(latA) || isNaN(lngA) ||
                                isNaN(latB) || isNaN(lngB)
                            ) {
                                return 0;
                            }

                            const dA = distanceInMeters(
                                currentUserLocation.lat,
                                currentUserLocation.lng,
                                latA,
                                lngA
                            );
                            const dB = distanceInMeters(
                                currentUserLocation.lat,
                                currentUserLocation.lng,
                                latB,
                                lngB
                            );

                            return dA - dB; // menor distancia primero
                        });
                    }

                    const fragment = document.createDocumentFragment();
                    events.forEach(ev => {
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = createEventCardHTML(ev).trim();
                        const card = wrapper.firstChild;
                        if (card) fragment.appendChild(card);
                    });
                    eventosList.appendChild(fragment);


                    // Que el mapa se encargue de los clics en las cards
                    if (typeof window.attachCardClickListeners === 'function') {
                        window.attachCardClickListeners();
                    }

                    // Actualizar marcadores del mapa
                    if (typeof window.updateMapMarkers === 'function') {
                        window.updateMapMarkers();
                    }

                    console.log('Se agregaron', events.length, 'cards al DOM.');

                    // 👉 Actualizar distancias si ya tenemos ubicación del usuario
                    if (currentUserLocation) {
                        updateEventDistancesForCards(
                            currentUserLocation.lat,
                            currentUserLocation.lng
                        );
                    }
                } else {
                    console.log('No hay events en la respuesta para renderizar cards.');
                }

            } catch (err) {
                console.error('Error vaciando/creando cards en #eventos-list:', err);
                // Reinicializar los listeners de suscripción para los nuevos botones
                if (typeof window.initSubscriptionListeners === 'function') {
                    window.initSubscriptionListeners();
                }

                console.log('Se agregaron', events.length, 'cards al DOM.');
            }
        });
};

// ===============================
// Helpers para leer estado actual de filtros
// ===============================

const getActiveCategory = () => {
    const categorySelect = document.getElementById('category-select');
    return categorySelect ? categorySelect.value : null;
};

const getActiveFilter = () => {
    const activeFilterButton = document.querySelector('.filter-btn.active');
    return activeFilterButton ? activeFilterButton.dataset.filter : null;
};

const getActiveSearchValue = () => {
    const searchInput = document.getElementById('search-input');
    return searchInput ? searchInput.value.trim() : '';
};

// ===============================
// Listeners de filtros/búsqueda
// ===============================

document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categorySelect = document.getElementById('category-select');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.querySelector('.clear-search');

    // --- Botones de filtro (Todo, Cercanos, Recientes, Populares) ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const activeFilterButton = document.querySelector('.filter-btn.active');
            if (activeFilterButton) {
                activeFilterButton.classList.remove('active');
            }
            button.classList.add('active');

            const filter = button.dataset.filter;
            const categoryId = getActiveCategory();
            const searchValue = getActiveSearchValue();

            console.log("Filtro seleccionado:", filter);
            console.log("Categoría seleccionada:", categoryId);
            console.log("Valor de búsqueda:", searchValue);

            if (filter === 'cercanos') {
                // Mostrar feedback visual
                button.innerHTML = '📍 Obteniendo ubicación...';
                button.disabled = true;
                
                getUserLocation((location) => {
                    // Restaurar botón
                    button.innerHTML = 'Más Cercanos';
                    button.disabled = false;
                    
                    if (!location) {
                        console.warn('No hay ubicación de usuario, mostrando todos los eventos');
                        alert('No se pudo obtener tu ubicación. Mostrando todos los eventos.');
                        // Cambiar al filtro "all"
                        button.classList.remove('active');
                        const allButton = document.querySelector('.filter-btn[data-filter="all"]');
                        if (allButton) allButton.classList.add('active');
                        applyfilter('all', searchValue, categoryId, null);
                        return;
                    }

                    console.log('Ubicación de usuario:', location);
                    applyfilter(filter, searchValue, categoryId, location);

                    // Centrar mapa en la ubicación del usuario si está disponible
                    if (typeof window.centerMapOnUserLocation === 'function') {
                        window.centerMapOnUserLocation(location);
                    } else {
                        console.warn('[map] centerMapOnUserLocation no está definido');
                    }
                });
            } else {
                applyfilter(filter, searchValue, categoryId, null);
            }
        });
    });

    // --- Cambio en el select de categorías ---
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            const categoryId = categorySelect.value;
            const filter = getActiveFilter();
            const searchValue = getActiveSearchValue();

            const filterSection = document.getElementById('filter-section')
                || document.querySelector('.filter-section');
            const existingPill = document.querySelector('.filter-pill');

            if (categoryId === "") {
                existingPill?.remove();
                // Si el filtro activo es "cercanos", reusar ubicación si ya la tenemos
                if (filter === 'cercanos') {
                    applyfilter(filter, searchValue, categoryId, currentUserLocation);
                } else {
                    applyfilter(filter, searchValue, categoryId, null);
                }
                return;
            }

            // Crear/actualizar pill de categoría
            if (existingPill) {
                existingPill.remove();
            }

            const spanClear = document.createElement('span');
            spanClear.className = "clear-category";
            spanClear.innerText = "✕";

            const categoryPill = document.createElement('button');
            categoryPill.className = "filter-pill active";
            categoryPill.innerHTML =
                categorySelect.options[categorySelect.selectedIndex].text +
                spanClear.outerHTML;

            categoryPill.addEventListener('click', () => {
                categorySelect.value = "";
                categoryPill.remove();
                const filterNow = getActiveFilter();
                const searchNow = getActiveSearchValue();
                if (filterNow === 'cercanos') {
                    applyfilter(filterNow, searchNow, null, currentUserLocation);
                } else {
                    applyfilter(filterNow, searchNow, null, null);
                }
            });

            try {
                filterSection?.appendChild(categoryPill);
            } catch (err) {
                console.error('Error al obtener filterSection:', err);
            }

            console.log("Categoría seleccionada:", categoryId);
            console.log("Valor de búsqueda:", searchValue);
            console.log("Botón de filtro activo:", filter);

            if (filter === 'cercanos') {
                if (currentUserLocation) {
                    applyfilter(filter, searchValue, categoryId, currentUserLocation);
                } else {
                    getUserLocation(loc => applyfilter(filter, searchValue, categoryId, loc));
                }
            } else {
                applyfilter(filter, searchValue, categoryId, null);
            }
        });
    }

    // --- Búsqueda con debounce ---
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                const filter = getActiveFilter();
                const categoryId = getActiveCategory();
                const searchValue = this.value.trim();

                console.log("Valor de búsqueda:", searchValue);
                console.log("Categoría seleccionada:", categoryId);
                console.log("Botón de filtro activo:", filter);

                if (filter === 'cercanos') {
                    if (currentUserLocation) {
                        applyfilter(filter, searchValue, categoryId, currentUserLocation);
                    } else {
                        getUserLocation(loc => applyfilter(filter, searchValue, categoryId, loc));
                    }
                } else {
                    applyfilter(filter, searchValue, categoryId, null);
                }
            }, 700); // Esperar 700ms después de que el usuario deje de escribir
        });
    }

    // --- Botón para limpiar búsqueda ---
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            const filter = getActiveFilter();
            const categoryId = getActiveCategory();
            const searchValue = '';

            if (filter === 'cercanos') {
                if (currentUserLocation) {
                    applyfilter(filter, searchValue, categoryId, currentUserLocation);
                } else {
                    getUserLocation(loc => applyfilter(filter, searchValue, categoryId, loc));
                }
            } else {
                applyfilter(filter, searchValue, categoryId, null);
            }
        });
    }
});

// ===============================
// Helpers para crear cards y listeners
// ===============================

// Crea el HTML de una card a partir del objeto evento (respuesta del servidor)
const createEventCardHTML = (ev) => {
    const id = ev.id ?? '';
    const name = ev.name ?? '';
    const description = ev.description ?? '';
    const location = ev.location ?? '';
    const owner = ev.owner_username ?? 'Organizador desconocido';

    const dateObj = ev.date ? new Date(ev.date) : null;
    const dateText = dateObj
        ? dateObj.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : '';

    const lat = ev.latitud != null ? ev.latitud : '';
    const lng = ev.longitud != null ? ev.longitud : '';

    const distancia = ev.distancia != null ? ev.distancia : null;

    const tags = Array.isArray(ev.tags)
        ? ev.tags
        : (typeof ev.tags === 'string'
            ? ev.tags.split(/\s+/).filter(Boolean)
            : []);

    const photo = ev.photo ?? '';

    return `
<div class="event-card"
     data-id="${escapeHtml(id)}"
     data-lat="${escapeHtml(lat)}"
     data-lng="${escapeHtml(lng)}"
     data-location="${escapeHtml(location)}"
     style="cursor:pointer;">

  <div class="event-image">
    ${
        photo
            ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}">`
            : `<div class="default-image">
                 <div class="cloud cloud1"></div>
                 <div class="cloud cloud2"></div>
                 <div class="hill"></div>
               </div>`
        }
  </div>

  <div class="event-details">

    <h3 class="event-title">${escapeHtml(name)}</h3>

   <div class="event-meta">
    <span>
    📍
    <span class="event-distance" data-distance>
      ${distancia != null
            ? escapeHtml(String(distancia)) + ' M'
            : '-- M'
        }
    </span>
  </span>
  <span class="event-datetime">• ${escapeHtml(dateText)}</span>
</div>

    <p class="event-location">${escapeHtml(location)}</p>
    <p class="event-organizer">de: ${escapeHtml(owner)}</p>

    ${
        lat !== '' && lng !== ''
            ? `<div class="event-meta">
                 <span>
                   📍 ${escapeHtml(String(lat))},
                   ${escapeHtml(String(lng))}
                 </span>
               </div>`
            : ''
    }

    <p class="event-description">
      ${escapeHtml(description)}
    </p>

    <div class="event-tags">
      ${
        tags
            .map(t => `<span class="tag">${escapeHtml(String(t))}</span>`)
            .join(' ')
      }
    </div>

    <div class="event-actions" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <button class="attend-btn"
              data-subscribeurl="/subscribe/"
              data-unsubscribeurl="/unsubscribe/"
              data-eventid="${escapeHtml(id)}">
        Suscribirme 🚀
      </button>

      <!-- Botón Ver detalles -->
      <a href="/evento/${escapeHtml(id)}/"
         class="details-btn"
         onclick="event.stopPropagation();">
        🔍Ver detalles
      </a>
    </div>

  </div>
</div>`;
};

// Escape básico
const escapeHtml = (str) => String(str == null ? '' : str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
