function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function updateButtonState(button, subscribed) {
  if (subscribed) {
    button.classList.add('subscribed');
    button.textContent = 'Ya suscrito';
  } else {
    button.classList.remove('subscribed');
    button.innerHTML = 'Suscribirme <img src="/static/events/images/icons/assist-rocket.svg" alt="" class="btn-icon">';
  }
}

function updateSuvscribersCount(eventId, newCount) {
  const countSpan = document.getElementById(`subscribers-count-${eventId}`);
  if (countSpan) {
    countSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" fill="#6c757d"><path d="M9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/></svg> ${newCount} suscriptor${newCount !== 1 ? 'es' : ''}`;
  }
}

// Variable para rastrear si ya se inicializó el event delegation
let subscriptionDelegationInitialized = false;

// Función para inicializar los listeners de suscripción usando EVENT DELEGATION
function initSubscriptionListeners() {
  console.log('🔧 initSubscriptionListeners llamado');
  
  // Si ya se inicializó el event delegation, no hacerlo de nuevo
  if (subscriptionDelegationInitialized) {
    console.log('⏭️ Event delegation ya inicializado, saltando...');
    return;
  }
  
  subscriptionDelegationInitialized = true;
  console.log('✅ Inicializando EVENT DELEGATION para botones de suscripción');
  
  // Usar event delegation en el documento completo
  // Esto funciona incluso para botones creados dinámicamente
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('.attend-btn');
    
    // Si el click no fue en un botón .attend-btn, ignorar
    if (!button) return;
    
    // Si es un enlace (no autenticado), dejar que funcione normalmente
    if (button.tagName === 'A') return;
    
    console.log('🖱️ Click detectado en botón de suscripción:', button);
    e.stopPropagation();
    e.preventDefault();
    
    const subscribeUrl = button.dataset.subscribeurl;
    const unsubscribeUrl = button.dataset.unsubscribeurl;
    const eventId = button.dataset.eventid;
    
    console.log(`📝 Data attributes:`, { subscribeUrl, unsubscribeUrl, eventId });
    
    if (!subscribeUrl || !unsubscribeUrl || !eventId) {
      console.warn('⚠️ Botón sin data attributes necesarios');
      return;
    }
    
    const currentlySubscribed = button.classList.contains('subscribed');
    const targetUrl = currentlySubscribed ? unsubscribeUrl : subscribeUrl;
    const csrftoken = getCookie('csrftoken');
    const messagesDiv = document.getElementById('messagesDiv');
  // Limpiar mensajes previos
    if (messagesDiv) {
      messagesDiv.innerHTML = '';
    }
    //<div class="alert alert-{{ status }}">{{ message }}</div>

    
    console.log(`📤 Haciendo ${currentlySubscribed ? 'UNSUBSCRIBE' : 'SUBSCRIBE'} a:`, targetUrl);
    
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ event_id: eventId })
      });
      
      const data = await res.json();
      console.log('📥 Respuesta del servidor:', data);
      
      if (!res.ok) {
        console.error('❌ Error en la respuesta:', data);
        messagesDiv.innerHTML = `<div class="alert alert-danger">${data.message || 'Error al procesar la solicitud'}</div>`;
        setTimeout(() => messagesDiv.innerHTML = '', 5000);
        // alert(data.message || 'Error al procesar la solicitud');
        return;
      }
      
      // Update button state based on response
      const subscribed = !!data.subscribed;
      updateButtonState(button, subscribed);
      // Update subscribers count if provided
      if (data.subscription_count !== undefined) {
        updateSuvscribersCount(eventId, data.subscription_count);
      }

      

      console.log(`✅ Estado actualizado: ${subscribed ? 'SUSCRITO' : 'NO SUSCRITO'}`);
      console.log('Nuevo conteo de suscriptores:', data.subscription_count);
      if (messagesDiv) {
        if (subscribed) {
          messagesDiv.innerHTML = `<div class="alert alert-success">${data.message || 'Suscrito exitosamente'}</div>`;
        } else {
          messagesDiv.innerHTML = `<div class="alert alert-warning">${data.message || 'Desuscrito exitosamente'}</div>`;
        // messagesDiv.innerHTML = `<div class="alert alert-success">${data.message || (subscribed ? 'Suscrito exitosamente' : 'Desuscrito exitosamente')}</div>`;
        }
        setTimeout(() => messagesDiv.innerHTML = '', 6000);
      }
      // alert(data.message || (subscribed ? 'Suscrito exitosamente' : 'Desuscrito exitosamente'));      
    } catch (err) {
      console.error('❌ Error de red:', err);
      if (messagesDiv) {
        messagesDiv.innerHTML = `<div class="alert alert-danger">Error de red al procesar la solicitud</div>`;
        setTimeout(() => messagesDiv.innerHTML = '', 6000);
      }
      // alert('Error de red al procesar la solicitud');
    }
  });
  
  // También manejar hover con event delegation
  document.addEventListener('mouseenter', (e) => {
    const button = e.target.closest('.attend-btn');
    if (!button || button.tagName === 'A') return;
    
    if (button.classList.contains('subscribed')) {
      button.dataset.orig = button.textContent;
      button.textContent = 'Desuscribirse';
    }
  }, true);
  
  document.addEventListener('mouseleave', (e) => {
    const button = e.target.closest('.attend-btn');
    if (!button || button.tagName === 'A') return;
    
    if (button.classList.contains('subscribed') && button.dataset.orig) {
      button.textContent = button.dataset.orig;
      delete button.dataset.orig;
    }
  }, true);
}

// Inicializar cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM cargado, inicializando subscriptions.js...');
  initSubscriptionListeners();
});

// Exponer la función globalmente para que filter.js pueda llamarla
window.initSubscriptionListeners = initSubscriptionListeners;
console.log('✅ subscriptions.js cargado, función expuesta globalmente');