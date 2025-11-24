
function updateButtonState(button, subscribed) {
  if (subscribed) {
    button.classList.add('subscribed');
    button.textContent = 'Ya suscrito';
  } else {
    button.classList.remove('subscribed');
    button.textContent = 'Suscribirme 🚀';
  }
document.addEventListener('DOMContentLoaded', () => {
  

  // Attach to all subscribe forms
  document.querySelectorAll('.attend-btn').forEach(subButton => {
    const msgContainer = subButton.querySelector('.messages');
    const subscribeUrl = subButton.dataset.subscribeurl;
    const unsubscribeUrl = subButton.dataset.unsubscribeurl;
    const eventId = subButton.dataset.eventid;


    // Hover behaviour: if subscribed, show "Desuscribirse" on hover
    subButton.addEventListener('mouseenter', () => {
        console.log('mouseenter');
      if (subButton.classList.contains('subscribed')) {
        subButton.dataset.orig = subButton.textContent;
        subButton.textContent = 'Desuscribirse';
      }
    });
    subButton.addEventListener('mouseleave', () => {
      if (subButton.classList.contains('subscribed') && subButton.dataset.orig) {
        subButton.textContent = subButton.dataset.orig;
        delete subButton.dataset.orig;
      }
    });

    subButton.addEventListener('click', async (e) => {
      // determine action: unsubscribe if currently subscribed
      const currentlySubscribed = subButton.classList.contains('subscribed');
      const targetUrl = currentlySubscribed ? unsubscribeUrl : subscribeUrl;
      const csrftoken = getCookie('csrftoken');

      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body : JSON.stringify({ event_id: eventId })
        });
        const data = await res.json();
        if (!res.ok) {
          // show error
          if (msgContainer) msgContainer.innerHTML = `<div class="alert alert-error">${data.message || 'Error'}</div>`;
          return;
        }

        // Update button state based on response
        const subscribed = !!data.subscribed;
        updateButtonState(btn, subscribed);
        if (msgContainer) msgContainer.innerHTML = `<div class="alert alert-${data.status}">${data.message}</div>`;
        // hide message after 3.5s
        setTimeout(() => { if (msgContainer) msgContainer.innerHTML = ''; }, 3500);
      } catch (err) {
        console.error(err);
        if (msgContainer) msgContainer.innerHTML = `<div class="alert alert-error">Error de red</div>`;
      }
    });
  });

});
}