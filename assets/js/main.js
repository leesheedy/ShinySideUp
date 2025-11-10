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

  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  if (serviceParam) {
    const contactSection = document.getElementById('contact-form');
    if (contactSection) {
      const normalized = serviceParam.toLowerCase().replace(/[^a-z]/g, '');
      const serviceMap = {
        residential: 'residential cleaning',
        house: 'residential cleaning',
        commercial: 'commercial cleaning',
        office: 'commercial cleaning',
        endoflease: 'end of lease',
        endlease: 'end of lease',
        bond: 'end of lease',
      };

      const desiredOption = serviceMap[normalized];
      if (desiredOption) {
        const select = contactSection.querySelector('select[name="service"]');
        if (select) {
          const match = Array.from(select.options).find(
            (option) => option.textContent.trim().toLowerCase() === desiredOption
          );
          if (match) {
            match.selected = true;
            select.dispatchEvent(new Event('change'));
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
  }

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
