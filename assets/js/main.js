document.documentElement.classList.add('js-enabled');

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

  const modalControllers = new Map();
  const MODAL_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const createModalController = (modal) => {
    if (!(modal instanceof HTMLElement)) {
      return null;
    }

    const closeButtons = Array.from(modal.querySelectorAll('[data-modal-close]'));
    const messageEl = modal.querySelector('[data-modal-message]');
    const snapshotOpenedEl = modal.querySelector('[data-snapshot-status="opened"]');
    const snapshotBlockedEl = modal.querySelector('[data-snapshot-status="blocked"]');
    let lastFocusedElement = null;

    const setSnapshotStatus = (opened) => {
      if (snapshotOpenedEl) {
        snapshotOpenedEl.hidden = !opened;
      }
      if (snapshotBlockedEl) {
        snapshotBlockedEl.hidden = opened;
      }
    };

    const open = ({ message, snapshotOpened } = {}) => {
      lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (typeof message === 'string' && messageEl) {
        messageEl.textContent = message;
      }

      const shouldShowOpened = typeof snapshotOpened === 'boolean' ? snapshotOpened : true;
      setSnapshotStatus(shouldShowOpened);

      modal.classList.add('is-visible');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      const focusTarget =
        modal.querySelector('[data-modal-initial-focus]') ||
        modal.querySelector(MODAL_FOCUSABLE_SELECTOR);

      if (focusTarget instanceof HTMLElement) {
        window.requestAnimationFrame(() => focusTarget.focus());
      }
    };

    const close = () => {
      if (!modal.classList.contains('is-visible')) {
        return;
      }

      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');

      if (!document.querySelector('.modal.is-visible')) {
        document.body.classList.remove('modal-open');
      }

      if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      }
    };

    const handleKeydown = (event) => {
      if (!modal.classList.contains('is-visible')) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = Array.from(
          modal.querySelectorAll(MODAL_FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

        if (!focusable.length) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeydown);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        close();
      }
    });

    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        close();
      });
    });

    return {
      open,
      close,
    };
  };

  document.querySelectorAll('[data-success-modal]').forEach((modal) => {
    const key = modal.getAttribute('data-success-modal');
    const controller = createModalController(modal);
    if (key && controller) {
      modalControllers.set(key, controller);
    }
  });

  const forms = document.querySelectorAll('[data-form]');

  const EMAILJS_CONFIG = {
    serviceId: 'service_template_website',
    templateId: 'template_website',
    publicKey: 'Of49R5dVYZ12Ur3tc',
    fallbackEmail: 'info@shinysideup.au',
  };

  if (forms.length && window.emailjs?.init) {
    try {
      window.emailjs.init(EMAILJS_CONFIG.publicKey);
    } catch (error) {
      console.error('EmailJS initialisation failed:', error);
    }
  }

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

    form.__getBookingSnapshot = () =>
      summaryNodes.map((node) => {
        const key = node.dataset.summaryValue;
        const label = node.previousElementSibling ? node.previousElementSibling.textContent.trim() : key;
        return {
          key,
          label,
          value: node.textContent.trim(),
          defaultValue: summaryDefaults[key] || '',
        };
      });

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

  const placeholderPattern = /(Add |Pick |Optional|Phone or email)/i;

  const openSnapshotWindow = (snapshotEntries, submittedAt) => {
    if (!snapshotEntries.length) {
      return false;
    }

    const escapeHtml = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const snapshotWindow = window.open('', '_blank', 'noopener=yes');
    if (!snapshotWindow) {
      return false;
    }

    const rows = snapshotEntries
      .map((entry) => {
        const displayValue =
          !entry.value || (entry.value === entry.defaultValue && placeholderPattern.test(entry.defaultValue))
            ? '—'
            : entry.value;
        return `
          <tr>
            <th scope="row">${escapeHtml(entry.label)}</th>
            <td>${escapeHtml(displayValue)}</td>
          </tr>`;
      })
      .join('');

    const doc = snapshotWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Shiny Side Up booking snapshot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; color: #1a2a3a; }
      body { margin: 0; background: linear-gradient(180deg, #f7fbff 0%, #ffffff 65%); padding: 2.5rem 1.5rem; }
      .wrapper { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 24px 48px rgba(26, 42, 58, 0.12); overflow: hidden; border: 1px solid rgba(31, 122, 196, 0.1); }
      header { padding: 2.25rem 2.5rem 1.5rem; background: linear-gradient(135deg, rgba(31, 122, 196, 0.12), rgba(52, 177, 235, 0.18)); border-bottom: 1px solid rgba(31, 122, 196, 0.1); }
      header h1 { margin: 0 0 0.35rem; font-size: clamp(1.75rem, 4vw, 2.4rem); }
      header p { margin: 0; color: rgba(26, 42, 58, 0.72); font-size: 0.95rem; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; font-size: 0.9rem; font-weight: 600; padding: 1rem 2.5rem; background: rgba(247, 251, 255, 0.85); border-right: 1px solid rgba(31, 122, 196, 0.08); width: 35%; }
      td { padding: 1rem 2.5rem; font-size: 0.95rem; }
      tr + tr th, tr + tr td { border-top: 1px solid rgba(31, 122, 196, 0.08); }
      @media (max-width: 640px) {
        body { padding: 1.5rem 1rem; }
        header, th, td { padding-left: 1.5rem; padding-right: 1.5rem; }
        th { width: 45%; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <header>
        <h1>Booking snapshot</h1>
        <p>Submitted ${escapeHtml(submittedAt)}</p>
      </header>
      <table>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </body>
</html>`);
    doc.close();
    return true;
  };

  const getServiceLabel = (form, value) => {
    if (!value) {
      return '';
    }
    if (typeof CSS !== 'undefined' && CSS.escape) {
      const input = form.querySelector(`input[name="serviceType"][value="${CSS.escape(value)}"]`);
      if (input) {
        const label = input.closest('label');
        const strong = label ? label.querySelector('strong') : null;
        if (strong) {
          return strong.textContent.trim();
        }
      }
    }
    return value;
  };

  const buildTemplateParams = (form, snapshotEntries, submittedAt) => {
    const formData = new FormData(form);
    const pickValue = (...keys) => {
      for (const key of keys) {
        const raw = formData.get(key);
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (trimmed) {
            return trimmed;
          }
        }
      }
      return '';
    };

    const name = pickValue('name', 'fullName') || 'Website visitor';
    const email = pickValue('email') || EMAILJS_CONFIG.fallbackEmail;
    const phone = pickValue('phone');
    const contactMethod =
      pickValue('contactMethod', 'contactPreference') || (phone ? 'Phone' : email ? 'Email' : 'Not specified');

    const serviceValue = pickValue('helpType', 'service', 'serviceType');
    const helpType = getServiceLabel(form, serviceValue) || 'General enquiry';

    const message =
      pickValue('message', 'notes', 'details', 'address', 'accessInstructions') || '— No message provided —';

    const additionalInfoSections = [];

    const extras = formData.getAll('extras').filter(Boolean);
    const contextFields = [
      ['location', 'Location'],
      ['address', 'Address'],
      ['date', 'Preferred date'],
      ['time', 'Preferred time'],
      ['access', 'Access'],
      ['floorArea', 'Floor area'],
      ['bedrooms', 'Bedrooms'],
      ['bathrooms', 'Bathrooms'],
    ];

    contextFields.forEach(([key, label]) => {
      const value = pickValue(key);
      if (value) {
        additionalInfoSections.push(`${label}: ${value}`);
      }
    });

    if (extras.length) {
      additionalInfoSections.push(`Extras: ${extras.join(', ')}`);
    }

    if (snapshotEntries.length) {
      const formatted = snapshotEntries
        .map((entry) => {
          const showValue =
            entry.value && !(entry.value === entry.defaultValue && placeholderPattern.test(entry.defaultValue));
          const value = showValue ? entry.value : '—';
          return `${entry.label}: ${value}`;
        })
        .join('\n');
      additionalInfoSections.push('Booking snapshot:\n' + formatted);
    }

    if (window.location?.pathname) {
      additionalInfoSections.push(`Page: ${window.location.pathname}`);
    }

    if (submittedAt) {
      additionalInfoSections.push(`Submitted: ${submittedAt}`);
    }

    return {
      name,
      email,
      phone: phone || 'Not provided',
      contactMethod,
      helpType,
      message,
      additionalInfo: additionalInfoSections.join('\n') || 'No additional info provided.',
    };
  };

  const setSubmittingState = (form, isSubmitting) => {
    const submitButton = form.querySelector('[type="submit"]');
    if (!submitButton) {
      return;
    }
    if (isSubmitting) {
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = 'Sending…';
      submitButton.disabled = true;
    } else {
      submitButton.textContent = submitButton.dataset.originalText || submitButton.textContent;
      submitButton.disabled = false;
    }
  };

  forms.forEach((form) => {
    const alertEl = form.querySelector('.alert');
    const isBookingForm = form.hasAttribute('data-booking-form');
    const successTarget = form.getAttribute('data-success-target');
    const successModalController = successTarget ? modalControllers.get(successTarget) : null;

    if (isBookingForm) {
      setupBookingForm(form);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const snapshotEntries = typeof form.__getBookingSnapshot === 'function' ? form.__getBookingSnapshot() : [];
      let submittedAt = '';
      try {
        submittedAt = new Date().toLocaleString('en-AU', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZoneName: 'short',
        });
      } catch (error) {
        submittedAt = new Date().toLocaleString();
      }

      if (!window.emailjs?.send) {
        if (alertEl) {
          alertEl.textContent = 'Message failed: email service is unavailable. Please try again later.';
          alertEl.classList.add('error');
          alertEl.classList.remove('success');
        }
        return;
      }

      const templateParams = buildTemplateParams(form, snapshotEntries, submittedAt);
      const baseMessage = form.dataset.successMessage || 'Thank you! Your message has been sent.';
      let snapshotOpened = false;

      setSubmittingState(form, true);
      try {
        await window.emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          templateParams,
          EMAILJS_CONFIG.publicKey
        );

        if (snapshotEntries.length) {
          snapshotOpened = openSnapshotWindow(snapshotEntries, submittedAt);
        }

        let feedbackMessage = baseMessage;
        if (snapshotEntries.length) {
          feedbackMessage += snapshotOpened
            ? ' A booking snapshot has opened in a new tab for your records.'
            : ' Please allow pop-ups to view your booking snapshot.';
        }

        if (alertEl) {
          alertEl.textContent = feedbackMessage;
          alertEl.classList.remove('error');
          alertEl.classList.add('success');
        }

        if (successModalController) {
          successModalController.open({
            message: baseMessage,
            snapshotOpened: snapshotEntries.length ? snapshotOpened : undefined,
          });
        }

        form.reset();
      } catch (error) {
        console.error('Email send failed:', error);
        if (alertEl) {
          alertEl.textContent = 'We were unable to send your message. Please try again or call 1300 555 010.';
          alertEl.classList.add('error');
          alertEl.classList.remove('success');
        }
      } finally {
        setSubmittingState(form, false);
      }
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

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = reduceMotionQuery.matches;
  const animatedRegistry = new Set();
  let animationObserver = null;

  const revealAnimatedElement = (element) => {
    if (!element) {
      return;
    }
    element.classList.add('is-visible');
  };

  const initAnimationObserver = () => {
    if (animationObserver || prefersReducedMotion) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      animatedRegistry.forEach((element) => {
        revealAnimatedElement(element);
      });
      prefersReducedMotion = true;
      return;
    }

    animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealAnimatedElement(entry.target);
            animationObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.15,
      }
    );
  };

  const registerAnimatedElement = (element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    if (!element.dataset.animate) {
      return;
    }

    if (!animatedRegistry.has(element)) {
      animatedRegistry.add(element);
    }

    if (prefersReducedMotion) {
      revealAnimatedElement(element);
      return;
    }

    initAnimationObserver();
    if (animationObserver) {
      animationObserver.observe(element);
    }
  };

  const handleMotionPreferenceChange = (event) => {
    prefersReducedMotion = event.matches;
    if (prefersReducedMotion) {
      animatedRegistry.forEach((element) => {
        if (animationObserver) {
          animationObserver.unobserve(element);
        }
        revealAnimatedElement(element);
      });
    } else {
      animatedRegistry.forEach((element) => {
        if (!element.classList.contains('is-visible')) {
          registerAnimatedElement(element);
        }
      });
    }
  };

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleMotionPreferenceChange);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleMotionPreferenceChange);
  }

  const assignAnimationToElements = (selectorOrElements, animation = 'fade-up', options = {}) => {
    const elements =
      typeof selectorOrElements === 'string'
        ? document.querySelectorAll(selectorOrElements)
        : selectorOrElements;

    if (!elements) {
      return;
    }

    const delay = Number.parseFloat(options.delay || 0);
    const stagger = Number.parseFloat(options.stagger || 0);

    Array.from(elements).forEach((element, index) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (!element.dataset.animate) {
        element.dataset.animate = animation;
      }

      const existingDelay = element.style.getPropertyValue('--animate-delay');
      const nextDelay = delay + (stagger > 0 ? stagger * index : 0);
      if (!existingDelay && nextDelay > 0) {
        element.style.setProperty('--animate-delay', `${Math.round(nextDelay)}ms`);
      }

      registerAnimatedElement(element);
    });
  };

  const animationSpecs = [
    {
      selector: '.hero .hero-panel, .hero .hero-content > div',
      animation: 'fade-up',
      options: { stagger: 120 },
    },
    {
      selector: '.hero .hero-actions .btn, .hero .hero-highlight .btn',
      animation: 'fade-up',
      options: { stagger: 80, delay: 160 },
    },
    {
      selector: '.section > h2',
      animation: 'fade-up',
      options: { delay: 80 },
    },
    {
      selector: '.section > .subtitle, .section > p.subtitle',
      animation: 'fade-up',
      options: { delay: 160 },
    },
    {
      selector: '.section .card',
      animation: 'zoom-in',
      options: { stagger: 100 },
    },
    {
      selector: '.section .grid > *:not(.card)',
      animation: 'fade-up',
      options: { stagger: 100 },
    },
    {
      selector: '.testimonial',
      animation: 'fade-up',
      options: { stagger: 120 },
    },
    {
      selector: '.trust-badge',
      animation: 'fade-up',
      options: { stagger: 80 },
    },
    {
      selector: '.faq-item',
      animation: 'fade-up',
      options: { stagger: 80 },
    },
    {
      selector: '.info-item',
      animation: 'fade-up',
      options: { stagger: 90 },
    },
    {
      selector: '.gallery-grid > *',
      animation: 'zoom-in',
      options: { stagger: 80 },
    },
    {
      selector: '.footer-content > div, .footer-bottom',
      animation: 'fade-up',
      options: { stagger: 120 },
    },
    {
      selector: '.list li',
      animation: 'fade-up',
      options: { stagger: 36 },
    },
  ];

  animationSpecs.forEach((spec) => {
    assignAnimationToElements(spec.selector, spec.animation, spec.options);
  });

  document.querySelectorAll('[data-animate]').forEach((element) => {
    registerAnimatedElement(element);
  });

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
