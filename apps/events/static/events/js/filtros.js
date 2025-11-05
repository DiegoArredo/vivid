/**
 * filtros.js - Maneja la funcionalidad de filtros y búsqueda
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.querySelector('.clear-search');
    const eventsList = document.getElementById('eventos-list');
    const categorySelect = document.getElementById('category-select');
    
    // Función para obtener parámetros de URL
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            filter: params.get('filter') || 'all',
            search: params.get('search') || '',
            category: params.get('category') || ''
        };
    }
    
    // Función para actualizar la URL sin recargar la página
    function updateURL(params) {
        const url = new URL(window.location);
        
        // Actualizar o eliminar parámetros
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        
        // Actualizar la URL sin recargar
        window.history.pushState({}, '', url);
        
        // Recargar la página para aplicar los filtros
        window.location.reload();
    }
    
    // Función para solicitar ubicación del usuario
    function getUserLocation(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    callback({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                error => {
                    console.warn('No se pudo obtener la ubicación:', error);
                    callback(null);
                }
            );
        } else {
            console.warn('Geolocalización no soportada');
            callback(null);
        }
    }
    
    // Manejar clicks en botones de filtro
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            const currentParams = getUrlParams();
            
            // Remover clase active de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Si es filtro "cercanos", solicitar ubicación
            if (filterType === 'cercanos') {
                getUserLocation(location => {
                    const params = {
                        filter: filterType,
                        search: currentParams.search,
                        category: currentParams.category
                    };
                    
                    if (location) {
                        params.lat = location.lat;
                        params.lng = location.lng;
                    }
                    
                    updateURL(params);
                });
            } else {
                // Actualizar URL con el nuevo filtro
                updateURL({
                    filter: filterType,
                    search: currentParams.search,
                    category: currentParams.category
                });
            }
        });
    });
    
    // Manejar búsqueda en tiempo real (con debounce)
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                const searchValue = this.value.trim();
                const currentParams = getUrlParams();
                
                updateURL({
                    filter: currentParams.filter,
                    search: searchValue,
                    category: currentParams.category
                });
            }, 500); // Esperar 500ms después de que el usuario deje de escribir
        });
        
        // Establecer el valor inicial del input desde los parámetros de URL
        const params = getUrlParams();
        if (params.search) {
            searchInput.value = params.search;
        }
    }
    
    // Manejar botón de limpiar búsqueda
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                const currentParams = getUrlParams();
                
                updateURL({
                    filter: currentParams.filter,
                    search: '',
                    category: currentParams.category
                });
            }
        });
    }
    
    // Manejar cambio de categoría
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const categoryValue = this.value;
            const currentParams = getUrlParams();
            
            updateURL({
                filter: currentParams.filter,
                search: currentParams.search,
                category: categoryValue
            });
        });
    }
    
    // Activar el botón de filtro correcto al cargar la página
    const currentParams = getUrlParams();
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === currentParams.filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Manejar clicks en tarjetas de eventos
    const eventCards = document.querySelectorAll('.event-card-link');
    eventCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Si el click fue en un botón o enlace interno, no hacer nada
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            
            const eventId = this.getAttribute('data-event-id');
            if (eventId) {
                window.location.href = `/evento/${eventId}/`;
            }
        });
    });
    
    // Animación de carga para los eventos
    if (eventsList) {
        eventsList.style.opacity = '0';
        setTimeout(() => {
            eventsList.style.transition = 'opacity 0.3s ease';
            eventsList.style.opacity = '1';
        }, 100);
    }
});

// Función para mostrar mensaje de "sin resultados"
function showNoResults() {
    const eventsList = document.getElementById('eventos-list');
    if (eventsList && eventsList.children.length === 0) {
        eventsList.innerHTML = `
            <div class="no-results" style="padding: 20px; text-align: center; color: #7f8c8d;">
                <p>🔍 No se encontraron eventos con los criterios seleccionados.</p>
                <p style="font-size: 14px; margin-top: 10px;">
                    Intenta ajustar los filtros o la búsqueda.
                </p>
            </div>
        `;
    }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', showNoResults);
