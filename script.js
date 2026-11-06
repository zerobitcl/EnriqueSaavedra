(function () {
  'use strict';

  var WA_PHONE = '56958737727';

  function scheduleIdle(fn) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(fn, { timeout: 1200 });
    } else {
      setTimeout(fn, 1);
    }
  }

  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function initNav() {
    var navToggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('nav');
    if (!navToggle || !nav) return;

    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav--open');
    }, { passive: true });

    nav.addEventListener('click', function (e) {
      var link = e.target.closest('.nav__link');
      if (!link) return;
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('nav--open');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (nav.classList.contains('nav--open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('nav--open');
        navToggle.focus();
      }
    });
  }

  function initHeaderScroll() {
    var header = document.getElementById('header');
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle('header--scrolled', window.scrollY > 20);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  function setFieldError(input, errorEl, message) {
    if (!input || !errorEl) return;
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  function validateNombre(value) {
    var v = value.trim();
    if (v.length < 2) return 'Ingrese su nombre completo (mín. 2 caracteres).';
    if (v.length > 80) return 'El nombre es demasiado largo.';
    return '';
  }

  function validateEmpresa(value) {
    var v = value.trim();
    if (v.length < 2) return 'Indique el nombre de su empresa.';
    if (v.length > 100) return 'El nombre de empresa es demasiado largo.';
    return '';
  }

  function validateEmail(value) {
    var v = value.trim();
    if (!v) return 'Ingrese un email corporativo.';
    // Validación ligera — no bloquea el hilo con regex complejo
    if (v.indexOf('@') < 1 || v.indexOf('.') < 3 || v.length > 120) {
      return 'Ingrese un email válido (ej. nombre@empresa.cl).';
    }
    return '';
  }

  function validateMensaje(value) {
    var v = value.trim();
    if (v.length < 20) return 'Describa brevemente su necesidad (mín. 20 caracteres).';
    if (v.length > 800) return 'El mensaje supera el límite de 800 caracteres.';
    return '';
  }

  function buildWhatsAppUrl(data) {
    var lines = [
      'Hola, solicito asesoría legal para mi empresa.',
      '',
      'Nombre: ' + data.nombre,
      'Empresa: ' + data.empresa,
      'Email: ' + data.email,
      'Servicio: ' + data.servicio,
      '',
      'Detalle:',
      data.mensaje
    ];
    return 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var fields = {
      nombre: {
        input: document.getElementById('nombre'),
        error: document.getElementById('error-nombre'),
        validate: validateNombre
      },
      empresa: {
        input: document.getElementById('empresa'),
        error: document.getElementById('error-empresa'),
        validate: validateEmpresa
      },
      email: {
        input: document.getElementById('email'),
        error: document.getElementById('error-email'),
        validate: validateEmail
      },
      mensaje: {
        input: document.getElementById('mensaje'),
        error: document.getElementById('error-mensaje'),
        validate: validateMensaje
      }
    };

    var servicioEl = document.getElementById('servicio');
    var statusEl = document.getElementById('form-status');
    var submitBtn = document.getElementById('contact-submit');

    function clearStatus() {
      if (!statusEl) return;
      statusEl.hidden = true;
      statusEl.textContent = '';
      statusEl.className = 'contact-form__status';
    }

    function showStatus(type, message) {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = message;
      statusEl.className = 'contact-form__status contact-form__status--' + type;
    }

    // Validación en blur — diferida para no competir con paint
    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.input) return;

      field.input.addEventListener('blur', function () {
        scheduleIdle(function () {
          var msg = field.validate(field.input.value);
          setFieldError(field.input, field.error, msg);
        });
      });

      field.input.addEventListener('input', function () {
        if (field.input.classList.contains('is-invalid')) {
          scheduleIdle(function () {
            var msg = field.validate(field.input.value);
            setFieldError(field.input, field.error, msg);
          });
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearStatus();

      var firstInvalid = null;
      var valid = true;

      Object.keys(fields).forEach(function (key) {
        var field = fields[key];
        if (!field.input) return;
        var msg = field.validate(field.input.value);
        setFieldError(field.input, field.error, msg);
        if (msg) {
          valid = false;
          if (!firstInvalid) firstInvalid = field.input;
        }
      });

      if (!valid) {
        showStatus('error', 'Revise los campos marcados e intente nuevamente.');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var payload = {
        nombre: fields.nombre.input.value.trim(),
        empresa: fields.empresa.input.value.trim(),
        email: fields.email.input.value.trim(),
        servicio: servicioEl ? servicioEl.value : 'Diagnóstico general',
        mensaje: fields.mensaje.input.value.trim()
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Abriendo WhatsApp…';
      }

      showStatus('success', 'Datos validados. Redirigiendo a WhatsApp…');
      trackLead('whatsapp', 'formulario', payload.servicio);

      // Diferir navegación un frame — libera el hilo principal del submit
      requestAnimationFrame(function () {
        var url = buildWhatsAppUrl(payload);
        window.open(url, '_blank', 'noopener,noreferrer');

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar y abrir WhatsApp';
        }
      });
    });
  }

  function serviceLine() {
    var path = window.location.pathname || '/';
    var file = path.split('/').pop();
    if (!file || file === 'index.html') return 'home';
    return file.replace(/\.html$/, '');
  }

  function ctaLocation(el) {
    if (el.closest('.wa-float')) return 'flotante';
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    var section = el.closest('section');
    if (section && section.id) return section.id;
    return 'cuerpo';
  }

  var lastLeadKey = '';
  var lastLeadAt = 0;

  function trackLead(method, location, label) {
    if (typeof window.gtag !== 'function') return;
    var key = method + '|' + location + '|' + (label || '');
    var now = Date.now();
    if (key === lastLeadKey && now - lastLeadAt < 800) return;
    lastLeadKey = key;
    lastLeadAt = now;

    window.gtag('event', 'generate_lead', {
      method: method,
      cta_location: location,
      service_line: serviceLine(),
      cta_label: (label || '').slice(0, 80),
      transport_type: 'beacon'
    });
  }

  function initLeadTracking() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      var method = '';
      if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) method = 'whatsapp';
      else if (href.indexOf('tel:') === 0) method = 'phone';
      else return;
      var label = (link.textContent || '').replace(/\s+/g, ' ').trim();
      trackLead(method, ctaLocation(link), label);
    }, true);
  }

  function boot() {
    initYear();
    initNav();
    initHeaderScroll();
    initLeadTracking();
    // Formulario en idle: no compite con LCP/FCP
    scheduleIdle(initContactForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
