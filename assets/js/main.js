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

  const navToggle = document.querySelector('[data-nav-toggle]');
  const navGroup = document.querySelector('[data-nav-group]');
  const navOverlay = document.querySelector('[data-nav-overlay]');
  const siteHeader = document.querySelector('.site-header');

  if (siteHeader) {
    const updateStickyState = (isStuck) => {
      siteHeader.classList.toggle('is-stuck', isStuck);
    };

    if ('IntersectionObserver' in window) {
      const sentinel = document.createElement('span');
      sentinel.setAttribute('data-header-sentinel', '');
      siteHeader.parentNode.insertBefore(sentinel, siteHeader);

      const observer = new IntersectionObserver(
        ([entry]) => {
          updateStickyState(!entry.isIntersecting);
        },
        { rootMargin: '-1px 0px 0px 0px' }
      );

      observer.observe(sentinel);
    } else {
      const handleScroll = () => {
        updateStickyState(window.scrollY > 4);
      };
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  if (navToggle && navGroup) {
    const FOCUSABLE_SELECTOR = 'a[href], button:not([tabindex="-1"])';

    const openNav = () => {
      navGroup.classList.add('is-open');
      document.body.classList.add('nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
      const firstLink = navGroup.querySelector('a');
      if (firstLink) {
        window.requestAnimationFrame(() => firstLink.focus());
      }
    };

    const closeNav = () => {
      navGroup.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    const toggleNav = () => {
      if (navGroup.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    };

    navToggle.addEventListener('click', toggleNav);

    if (navOverlay) {
      navOverlay.addEventListener('click', () => {
        closeNav();
        navToggle.focus();
      });
    }

    navGroup.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (navGroup.classList.contains('is-open')) {
          closeNav();
          navToggle.focus();
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navGroup.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
        return;
      }

      if (event.key === 'Tab' && navGroup.classList.contains('is-open')) {
        const focusable = Array.from(navGroup.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
          (el) => !el.hasAttribute('disabled')
        );
        if (!focusable.length) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    });

    const handleResize = () => {
      if (window.innerWidth > 960 && navGroup.classList.contains('is-open')) {
        closeNav();
      }
    };

    window.addEventListener('resize', handleResize);
  }

  const forms = document.querySelectorAll('[data-form]');

  const setupBookingForm = (form) => {
    const steps = Array.from(form.querySelectorAll('.form-step'));
    if (!steps.length) {
      return;
    }

    const stepperItems = Array.from(form.querySelectorAll('[data-stepper-item]'));
    const nextBtn = form.querySelector('[data-next]');
    const prevBtn = form.querySelector('[data-prev]');
    const submitBtn = form.querySelector('[data-submit]');
    const summaryRoot = form.closest('.booking-grid')?.querySelector('[data-booking-summary]') || null;
    const summaryNodes = summaryRoot ? Array.from(summaryRoot.querySelectorAll('[data-summary-value]')) : [];
    const summaryDefaults = summaryNodes.reduce((acc, node) => {
      acc[node.dataset.summaryValue] = node.textContent.trim();
      return acc;
    }, {});
    const summaryMap = summaryNodes.reduce((acc, node) => {
      acc[node.dataset.summaryValue] = node;
      return acc;
    }, {});

    const summaryFormatters = {
      date: (value) => {
        if (!value) return '';
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
          return value;
        }
        return parsed.toLocaleDateString('en-AU', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
        });
      },
      time: (value) => {
        const labels = {
          any: 'Any time',
          morning: 'Morning (8am–11am)',
          midday: 'Midday (11am–2pm)',
          afternoon: 'Afternoon (2pm–5pm)',
        };
        return labels[value] || value;
      },
      contact: (value) => {
        const labels = {
          phone: 'Phone call',
          sms: 'SMS',
          email: 'Email',
        };
        return labels[value] || value;
      },
    };

    const setSummary = (key, value, input) => {
      if (!summaryMap[key]) {
        return;
      }

      let formatted = '';
      if (Array.isArray(value)) {
        formatted = value.length ? value.join(', ') : '';
      } else if (value && summaryFormatters[key]) {
        formatted = summaryFormatters[key](value, input);
      } else if (value && input && input.tagName === 'SELECT') {
        const option = input.options[input.selectedIndex];
        formatted = option ? option.textContent.trim() : value;
      } else if (value && input && input.type === 'radio') {
        const label = input.closest('label');
        const strong = label ? label.querySelector('strong') : null;
        formatted = strong ? strong.textContent.trim() : value;
      } else if (typeof value === 'string') {
        formatted = value.trim();
      }

      const fallback = summaryDefaults[key] || '';
      summaryMap[key].textContent = formatted || fallback;
    };

    const resetSummaries = () => {
      Object.entries(summaryMap).forEach(([key, node]) => {
        node.textContent = summaryDefaults[key] || '';
      });
    };

    const extrasInputs = Array.from(form.querySelectorAll('input[name="extras"]'));
    const updateExtrasSummary = () => {
      const selected = extrasInputs
        .filter((input) => input.checked)
        .map((input) => {
          const label = input.closest('label');
          const span = label ? label.querySelector('span') : null;
          return span ? span.textContent.trim() : input.value;
        });
      setSummary('extras', selected);
    };

    const contactFields = {
      name: form.querySelector('input[name="fullName"]'),
      phone: form.querySelector('input[name="phone"]'),
      email: form.querySelector('input[name="email"]'),
    };

    const updateContactDetailsSummary = () => {
      const pieces = [];
      if (contactFields.name && contactFields.name.value.trim()) {
        pieces.push(contactFields.name.value.trim());
      }
      if (contactFields.phone && contactFields.phone.value.trim()) {
        pieces.push(contactFields.phone.value.trim());
      }
      if (contactFields.email && contactFields.email.value.trim()) {
        pieces.push(contactFields.email.value.trim());
      }
      setSummary('contactDetails', pieces.join(' • '));
    };

    const propertyDescription = form.querySelector('[data-property-description]');
    const bedroomGroup = form.querySelector('[data-bedroom-group]');
    const floorAreaGroup = form.querySelector('[data-floorarea-group]');
    const extrasGroup = form.querySelector('[data-extras-group]');
    const extrasLegend = extrasGroup ? extrasGroup.querySelector('legend') : null;
    const extrasHint = extrasGroup ? extrasGroup.querySelector('.extras__hint') : null;

    const propertyDefaults = {
      description: propertyDescription ? propertyDescription.textContent.trim() : '',
      extrasLegend: extrasLegend ? extrasLegend.textContent.trim() : '',
      extrasHint: extrasHint ? extrasHint.textContent.trim() : '',
      showBedrooms: true,
      showFloorArea: false,
    };

    const propertyConfig = {
      home_maintenance: {
        description: 'Let us know the bedrooms and bathrooms so we can match the right team size.',
        extrasLegend: 'Popular add-ons',
        extrasHint: 'Select the extras you’d like included in your quote (optional).',
        showBedrooms: true,
        showFloorArea: false,
      },
      deep_clean: {
        description: 'Bedrooms and bathrooms help us plan the detail work for a full reset.',
        extrasLegend: 'Deep clean favourites',
        extrasHint: 'Choose the areas you want us to focus on during your deep clean.',
        showBedrooms: true,
        showFloorArea: false,
      },
      end_of_lease: {
        description: 'We’ll follow your agent checklist — share the room count so nothing gets missed.',
        extrasLegend: 'Bond clean add-ons',
        extrasHint: 'Tick any extras you need for your handover (windows, oven, carpets, etc.).',
        showBedrooms: true,
        showFloorArea: false,
      },
      commercial: {
        description: 'Tell us the approximate size or number of zones so we can tailor the crew and equipment.',
        extrasLegend: 'Spaces to prioritise',
        extrasHint: 'Optional: highlight areas like kitchens, meeting rooms, or high-traffic zones.',
        showBedrooms: false,
        showFloorArea: true,
      },
      builders: {
        description: 'Share the size of the build and surfaces that need detail so we can schedule enough time.',
        extrasLegend: 'Areas to detail',
        extrasHint: 'Select zones that need special attention after construction dust.',
        showBedrooms: false,
        showFloorArea: true,
      },
      custom: {
        description: 'Tell us a bit about the space so we can prepare an accurate checklist.',
        extrasLegend: propertyDefaults.extrasLegend,
        extrasHint: propertyDefaults.extrasHint,
        showBedrooms: false,
        showFloorArea: false,
      },
    };

    const applyPropertyConfig = (value) => {
      const config = propertyConfig[value] || propertyDefaults;
      const hasSelection = Boolean(value && propertyConfig[value]);

      if (propertyDescription) {
        propertyDescription.textContent = config.description || propertyDefaults.description;
      }

      if (extrasLegend && config.extrasLegend) {
        extrasLegend.textContent = config.extrasLegend;
      }

      if (extrasHint && config.extrasHint) {
        extrasHint.textContent = config.extrasHint;
      }

      if (bedroomGroup) {
        bedroomGroup.hidden = !config.showBedrooms;
        bedroomGroup.setAttribute('aria-hidden', config.showBedrooms ? 'false' : 'true');
        if (!config.showBedrooms) {
          setSummary('bedrooms', hasSelection ? 'Not required' : '');
          setSummary('bathrooms', hasSelection ? 'Not required' : '');
        } else {
          setSummary('bedrooms', '');
          setSummary('bathrooms', '');
        }
      }

      if (floorAreaGroup) {
        floorAreaGroup.hidden = !config.showFloorArea;
        floorAreaGroup.setAttribute('aria-hidden', config.showFloorArea ? 'false' : 'true');
        if (!config.showFloorArea) {
          setSummary('floorArea', hasSelection ? 'Not required' : '');
        } else {
          setSummary('floorArea', '');
        }
      }
    };

    const serviceOptions = Array.from(form.querySelectorAll('[data-service-option]'));
    serviceOptions.forEach((option) => {
      option.addEventListener('change', () => {
        if (!option.checked) {
          return;
        }
        const label = option.closest('label');
        const labelText = label ? label.textContent.trim() : option.value;
        setSummary('service', labelText, option);
        applyPropertyConfig(option.value);
      });
    });

    const summaryInputs = Array.from(form.querySelectorAll('[data-step-summary]'));
    summaryInputs.forEach((input) => {
      const handler = () => {
        if (input.name === 'extras') {
          updateExtrasSummary();
          return;
        }

        if (input.name === 'fullName' || input.name === 'phone' || input.name === 'email') {
          updateContactDetailsSummary();
        }

        setSummary(input.dataset.stepSummary, input.value, input);
      };

      const eventName = input.type === 'text' || input.type === 'tel' || input.type === 'email' ? 'input' : 'change';
      input.addEventListener(eventName, handler);
    });

    extrasInputs.forEach((input) => {
      input.addEventListener('change', updateExtrasSummary);
    });

    if (contactFields.name) {
      contactFields.name.addEventListener('input', updateContactDetailsSummary);
    }
    if (contactFields.phone) {
      contactFields.phone.addEventListener('input', updateContactDetailsSummary);
    }
    if (contactFields.email) {
      contactFields.email.addEventListener('input', updateContactDetailsSummary);
    }

    let currentStepIndex = 0;

    const updateStepState = () => {
      steps.forEach((step, index) => {
        step.classList.toggle('is-active', index === currentStepIndex);
      });
      stepperItems.forEach((item, index) => {
        item.classList.toggle('is-active', index === currentStepIndex);
      });

      if (prevBtn) {
        prevBtn.disabled = currentStepIndex === 0;
      }

      if (nextBtn) {
        nextBtn.hidden = currentStepIndex === steps.length - 1;
        nextBtn.textContent = currentStepIndex === steps.length - 2 ? 'Review details' : 'Next step';
      }

      if (submitBtn) {
        submitBtn.hidden = currentStepIndex !== steps.length - 1;
      }
    };

    const validateStep = () => {
      const activeStep = steps[currentStepIndex];
      if (!activeStep) {
        return true;
      }

      const inputs = Array.from(activeStep.querySelectorAll('input, select, textarea')).filter((input) => {
        if (input.closest('[hidden]')) {
          return false;
        }
        return !input.disabled;
      });

      for (const input of inputs) {
        if (!input.checkValidity()) {
          input.reportValidity();
          return false;
        }
      }

      return true;
    };

    nextBtn?.addEventListener('click', () => {
      if (!validateStep()) {
        return;
      }
      currentStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      updateStepState();
    });

    prevBtn?.addEventListener('click', () => {
      currentStepIndex = Math.max(currentStepIndex - 1, 0);
      updateStepState();
    });

    form.addEventListener('reset', () => {
      window.requestAnimationFrame(() => {
        currentStepIndex = 0;
        resetSummaries();
        applyPropertyConfig('');
        updateExtrasSummary();
        updateContactDetailsSummary();
        updateStepState();
      });
    });

    applyPropertyConfig('');
    resetSummaries();
    updateExtrasSummary();
    updateContactDetailsSummary();
    updateStepState();
  };

  forms.forEach((form) => {
    const alertEl = form.querySelector('.alert');
    const isBookingForm = form.hasAttribute('data-booking-form');

    if (isBookingForm) {
      setupBookingForm(form);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
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

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('data-back-to-top', '');
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(backToTop);

  const updateBackToTopVisibility = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const maxScrollable = Math.max(scrollHeight - clientHeight, 1);
    const progress = scrollTop / maxScrollable;
    const isVisible = progress > 0.35;
    backToTop.classList.toggle('is-visible', isVisible);
  };

  updateBackToTopVisibility();

  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });

  backToTop.addEventListener('click', () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});
