function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {
  const yearEl = document.querySelector('[data-current-year]');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const forms = document.querySelectorAll('[data-form]');
  forms.forEach((form) => {
    const alertEl = form.querySelector('.alert');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (alertEl) {
        alertEl.textContent = form.dataset.successMessage || 'Thanks! We\'ll be in touch shortly.';
        alertEl.classList.remove('error');
        alertEl.classList.add('success');
      }
      form.reset();
    });
  });

  const track = document.querySelector('[data-testimonial-track]');
  if (track) {
    let index = 0;
    const cards = Array.from(track.children);
    if (cards.length > 1) {
      setInterval(() => {
        index = (index + 1) % cards.length;
        const offset = cards[0].offsetWidth + 24;
        track.scrollTo({ left: offset * index, behavior: 'smooth' });
      }, 6000);
    }
  }

  // Placeholder for live chat integration
  const chatToggle = document.querySelector('[data-chat-toggle]');
  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      alert('Live chat is coming soon. Reach out via 1300 555 010 in the meantime!');
    });
  }
});
