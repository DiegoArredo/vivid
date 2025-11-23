function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

document.addEventListener('DOMContentLoaded', () => {
  function updateButtonState(button, subscribed) {
    if (subscribed) {
      button.classList.add('subscribed');
      button.textContent = 'Ya suscrito';
    } else {
      button.classList.remove('subscribed');
      button.textContent = 'Suscribirme 🚀';
    }
  }

  // Attach to all subscribe forms
  document.querySelectorAll('.subscribe-form').forEach(form => {
    const btn = form.querySelector('button[type="submit"]');
    const msgContainer = form.querySelector('.card-msg');
    const subscribeUrl = form.dataset.subscribeUrl;
    const unsubscribeUrl = form.dataset.unsubscribeUrl;
    const eventId = form.dataset.eventId;

    // Hover behaviour: if subscribed, show "Desuscribirse" on hover
    btn.addEventListener('mouseenter', () => {
      if (btn.classList.contains('subscribed')) {
        btn.dataset.orig = btn.textContent;
        btn.textContent = 'Desuscribirse';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.classList.contains('subscribed') && btn.dataset.orig) {
        btn.textContent = btn.dataset.orig;
        delete btn.dataset.orig;
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // determine action: unsubscribe if currently subscribed
      const currentlySubscribed = btn.classList.contains('subscribed');
      const targetUrl = currentlySubscribed ? unsubscribeUrl : subscribeUrl;
      const csrftoken = getCookie('csrftoken');
      const body = new FormData();
      body.append('event_id', eventId);

      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrftoken
          },
          body
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
