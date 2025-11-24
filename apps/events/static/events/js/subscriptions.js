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
    button.textContent = 'Suscribirme 🚀';
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
        alert(data.message || 'Error al procesar la solicitud');
        return;
      }
      
      // Update button state based on response
      const subscribed = !!data.subscribed;
      updateButtonState(button, subscribed);
      console.log(`✅ Estado actualizado: ${subscribed ? 'SUSCRITO' : 'NO SUSCRITO'}`);
      
      // Mostrar mensaje de éxito
      alert(data.message || (subscribed ? 'Suscrito exitosamente' : 'Desuscrito exitosamente'));
      
    } catch (err) {
      console.error('❌ Error de red:', err);
      alert('Error de red al procesar la solicitud');
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