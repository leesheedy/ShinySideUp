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

  const slideshows = document.querySelectorAll('[data-slideshow]');
  slideshows.forEach((slideshow) => {
    const slides = Array.from(slideshow.querySelectorAll('img'));
    if (slides.length <= 1) {
      return;
    }

    let currentIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (currentIndex < 0) {
      currentIndex = 0;
      slides[currentIndex].classList.add('is-active');
    }

    const dotsContainer = slideshow.querySelector('[data-slideshow-dots]');
    const dots = [];

    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index === currentIndex ? 'false' : 'true');
      if (dotsContainer) {
        if (index === 0) {
          dotsContainer.innerHTML = '';
          dotsContainer.setAttribute('role', 'tablist');
          if (!dotsContainer.hasAttribute('aria-label')) {
            dotsContainer.setAttribute('aria-label', 'Slideshow controls');
          }
        }
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slideshow-dot' + (index === currentIndex ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Show slide ${index + 1}`);
        dot.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
        dot.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
        dot.addEventListener('click', () => {
          setActiveSlide(index);
          resetTimer();
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      }
    });

    function setActiveSlide(nextIndex) {
      if (nextIndex === currentIndex) {
        return;
      }
      slides[currentIndex].classList.remove('is-active');
      slides[currentIndex].setAttribute('aria-hidden', 'true');
      if (dots[currentIndex]) {
        dots[currentIndex].classList.remove('is-active');
      }

      slides[nextIndex].classList.add('is-active');
      slides[nextIndex].setAttribute('aria-hidden', 'false');
      if (dots[nextIndex]) {
        dots[nextIndex].classList.add('is-active');
        dots[nextIndex].setAttribute('aria-selected', 'true');
        dots[nextIndex].setAttribute('tabindex', '0');
      }

      currentIndex = nextIndex;

      dots.forEach((dot, index) => {
        if (index !== currentIndex) {
          dot.setAttribute('aria-selected', 'false');
          dot.setAttribute('tabindex', '-1');
        }
      });
    }

    const interval = Number.parseInt(slideshow.dataset.interval, 10) || 5000;
    let timerId = window.setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      setActiveSlide(nextIndex);
    }, interval);

    function resetTimer() {
      if (timerId) {
        window.clearInterval(timerId);
      }
      timerId = window.setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        setActiveSlide(nextIndex);
      }, interval);
    }
  });

  // Placeholder for live chat integration
  const chatToggle = document.querySelector('[data-chat-toggle]');
  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      alert('Live chat is coming soon. Reach out via 1300 555 010 in the meantime!');
    });
  }
});
