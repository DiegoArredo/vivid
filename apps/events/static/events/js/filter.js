//Funcion para obtener valores de parametros de cookies. Especialmente CSRFToken
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
//Obtenemos el token CSRF
const csrftoken = getCookie('csrftoken');

//Evento que se ejecuta al cargar el DOM de prueba de envio POST
// document.addEventListener('DOMContentLoaded', function() {
//     const url = new URL(window.location);
//     fetch(url, {
//         method: "POST",
//         headers: {
//             'X-CSRFToken': csrftoken,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ message: 'prueba de envio' })
//     }).then(response => response.json())
//     .then(data => {
//         console.log("Datos recibidos: " + JSON.stringify(data));
//     });
// });

//Funcion de filtro de eventos que envia el tipo de filtro, valor y categoria (si aplica) por POST
const applyfilter = (filterType, searchValue = null, categoryId = null) => {
    const url = new URL(window.location);
    fetch(url, {
        method: "POST",
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filterType: filterType,
            searchValue: searchValue,
            categoryId: categoryId
        })
    }).then(response => response.json())
    .then(data => {
        console.log("Datos recibidos: " + JSON.stringify(data));
        // Para pruebas: dejar vacío el listado de eventos al recibir respuesta
        try {
            const eventosList = document.getElementById('eventos-list');
            if (!eventosList) {
                console.warn('No se encontró #eventos-list para vaciarlo.');
                return;
            }

            // Vaciar
            eventosList.innerHTML = '';
            console.log('El contenedor #eventos-list fue vaciado (modo prueba).');

            // Si la respuesta tiene eventos, crear las cards y añadirlas
            const events = (data && data.events) ? data.events : (data && data.body && data.body.events ? data.body.events : null);
            if (Array.isArray(events) && events.length > 0) {
                const fragment = document.createDocumentFragment();
                events.forEach(ev => {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = createEventCardHTML(ev).trim();
                    // append the card element (firstChild of wrapper)
                    const card = wrapper.firstChild;
                    if (card) fragment.appendChild(card);
                });
                eventosList.appendChild(fragment);
                // Re-asignar listeners a las nuevas cards
                attachEventCardListeners();
                console.log('Se agregaron', events.length, 'cards al DOM.');
                
                // Actualizar marcadores del mapa y listeners de click
                if (typeof window.updateMapMarkers === 'function') {
                    window.updateMapMarkers();
                }
                if (typeof window.attachCardClickListeners === 'function') {
                    window.attachCardClickListeners();
                }
            } else {
                console.log('No hay events en la respuesta para renderizar cards.');
            }

        } catch (err) {
            console.error('Error vaciando/creando cards en #eventos-list:', err);
        }
    });
}

//Funciones para obtener valores activos de filtros
const getActiveCategory = () => {
    const categorySelect = document.getElementById('category-select');
    return categorySelect.value;
}

const getActiveFilter = () => {
    const activeFilterButton = document.querySelector('.filter-btn.active');
    return activeFilterButton ? activeFilterButton.dataset.filter : null;
}

const getActiveSearchValue = () => {
    const searchInput = document.getElementById('search-input');
    return searchInput.value.trim();
}


//Evento que maneja los cambios en los filtros y realiza el envio POST
document.addEventListener('DOMContentLoaded', function() {
    const filterSection = document.querySelectorAll('.filter-btn');
    const categorySelect = document.getElementById('category-select');
    const searchInput = document.getElementById('search-input');
    
    // Manejar clicks en botones de filtro
    filterSection.forEach(button => {
        button.addEventListener('click', () => {

            const activeFilterButton = document.querySelector('.filter-btn.active');
            activeFilterButton.classList.remove('active');
            button.classList.add('active');
            // Obtener valores actuales de los filtros
            const filter = button.dataset.filter;
            const categoryId = getActiveCategory();
            const searchValue = getActiveSearchValue();
            
            console.log("Filtro seleccionado: " + filter);
            console.log("Categoría seleccionada: " + categoryId);
            console.log("Valor de búsqueda: " + searchValue);
            // Aplicar filtro con llamada POST
            applyfilter(filter, searchValue, categoryId);
        });
    });

    // Manejar cambios en el select de categorías
    categorySelect.addEventListener('change', () => {
        const filterSection = document.getElementById('filter-section');
        const categoryId = categorySelect.value;
        const filter = getActiveFilter();
        const searchValue = getActiveSearchValue();
        const existingPill = document.querySelector('.filter-pill');
        if (categoryId === "") {
            existingPill?.remove();
            applyfilter(filter, searchValue, categoryId);
            return;
        }
        if (existingPill) {
            existingPill.remove();
        }
        var spanClear = document.createElement('span');
        spanClear.className = "clear-category";
        spanClear.innerText = "✕";
            
        var categoryPill = document.createElement('button');
        categoryPill.className = "filter-pill active";
        categoryPill.innerHTML = categorySelect.options[categorySelect.selectedIndex].text + spanClear.outerHTML;
        categoryPill.addEventListener('click', () => {
            categorySelect.value = "";
            categoryPill.remove();
            applyfilter(filter, searchValue, null);
        });
        try {
        filterSection.appendChild(categoryPill);
        } catch (err) {
            console.error('Error al obtener filterSection:', err);
        }
        console.log("Categoría seleccionada: " + categoryId);
        console.log("Valor de búsqueda: " + searchValue);
        console.log("Botón de filtro activo: " + filter);
        
        applyfilter(filter, searchValue, categoryId);
    });

    // Manejar entrada en el campo de búsqueda con debounce
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);

        const categoryId = getActiveCategory();
        const filter = getActiveFilter();
        
        searchTimeout = setTimeout(() => {
            const searchValue = this.value.trim();
            console.log("Valor de búsqueda: " + searchValue);
            console.log("Categoría seleccionada: " + categoryId);
            console.log("Botón de filtro activo: " + filter);

            applyfilter(filter, searchValue, categoryId);
        }, 700); // Esperar 700ms después de que el usuario deje de escribir
    });
});

// ----------------------------
// Helpers para crear cards y listeners
// ----------------------------

// Crea el HTML de una card a partir del objeto evento (respuesta del servidor)
const createEventCardHTML = (ev) => {
        // Campos esperados: id, name, description, location, date, latitud, longitud, category_name, owner_username, photo
        const id = ev.id || '';
        const name = ev.name || '';
        const description = ev.description || '';
        const location = ev.location || '';
        const dateText = ev.date ? (new Date(ev.date)).toLocaleString('es-CL', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
        const lat = ev.latitud != null ? ev.latitud : '';
        const lng = ev.longitud != null ? ev.longitud : '';
        const owner = ev.owner_username || 'Organizador desconocido';
        const category = ev.category_name || 'Sin categoría';
        const photo = ev.photo || '';

        return `
            <div class="event-card" data-id="${escapeHtml(id)}" data-lat="${escapeHtml(lat)}" data-lng="${escapeHtml(lng)}" style="cursor:pointer;">
                <div class="event-image">
                    ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}">` : `<div class="default-image"><div class="cloud cloud1"></div><div class="cloud cloud2"></div><div class="hill"></div></div>`}
                </div>
                <div class="event-details">
                    <h3 class="event-title">${escapeHtml(name)}</h3>
                    <div class="event-meta"><span>📍 ${escapeHtml(location)}</span> • <span>${escapeHtml(dateText)}</span></div>
                    <p class="event-location">${escapeHtml(location)}</p>
                    <p class="event-organizer">de: ${escapeHtml(owner)}</p>
                    <p class="event-description">${escapeHtml(description)}</p>
                    <div class="event-actions" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <button class="attend-btn" onclick="event.stopPropagation(); alert('Funcionalidad de asistir próximamente');">Asistir 🚀</button>
                        <a href="/events/${escapeHtml(id)}/" class="details-btn" onclick="event.stopPropagation();">🔍Ver detalles</a>
                    </div>
                </div>
            </div>`;
}

// Añade listeners a las cards (click para seleccionar/centrar)
const attachEventCardListeners = () => {
        document.querySelectorAll('.event-card').forEach(card => {
                // evitar duplicar handlers: remover antes (si asignaste via dataset)
                card.replaceWith(card.cloneNode(true));
        });

        // volver a seleccionar y añadir handlers
        document.querySelectorAll('.event-card').forEach(card => {
                card.addEventListener('click', (ev) => {
                        if (ev.target.closest('.details-btn')) return;
                        document.querySelectorAll('.event-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        // posible hook para mapa: disparar evento global
                        const detail = { id: Number(card.dataset.id || card.dataset.eventId), lat: card.dataset.lat, lng: card.dataset.lng };
                        window.dispatchEvent(new CustomEvent('eventCard:selected', { detail }));
                });
        });
}

// Escape básico
const escapeHtml = (str) => String(str == null ? '' : str)
        .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
        .replaceAll('"','&quot;').replaceAll("'","&#039;");









