/* =========================================================
   FÉNIX GYM — APP.JS (v2 Pro)
   - Scroll progress + Sticky inteligente (con menú abierto safe)
   - Menú móvil con focus-trap + body scroll lock + click outside
   - Section Spy
   - Reveal on scroll
   - Parallax sutil (pausa en pestaña oculta)
   - Contadores animados
   - Tema dark/light persistente + sync SO + toggle accesible
   - Smooth anchors (click + hashchange) con offset dinámico
   - Validación + toasts (ARIA fix)
   - Prefetch con hover intent (same-origin + dedupe)
   - Micro-interacciones tarjetas
   - Carrusel reseñas: offsetLeft + resize + visibilitychange
   ========================================================= */

/* ---------------- Helpers ---------------- */
const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const isReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const rafThrottle = (fn) => {
  let running = false;
  return (...args) => {
    if (running) return;
    running = true;
    requestAnimationFrame(() => { fn(...args); running = false; });
  };
};
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/* ---------------- Globals ---------------- */
const header      = $('[data-sticky]');
const progressBar = $('.progress__bar');
const navToggle   = $('.nav__toggle');
const menu        = $('#menu');
const themeToggle = $('#themeToggle');

/* ---------------- Scroll Progress + Sticky ---------------- */
(() => {
  if (!progressBar || !header) return;
  let lastY = window.scrollY;

  const onScroll = rafThrottle(() => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || window.scrollY;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    progressBar.style.width = ((scrollTop / max) * 100).toFixed(2) + '%';

    header.style.boxShadow = scrollTop > 4 ? '0 10px 30px rgba(2,6,23,.25)' : 'none';

    // No ocultar header si menú móvil está abierto
    const menuOpen = menu?.getAttribute('aria-expanded') === 'true';
    if (!menuOpen) {
      const dy = scrollTop - lastY;
      const goingDown = dy > 2 && scrollTop > header.offsetHeight;
      header.style.transform = goingDown ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastY = scrollTop;
  });

  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------------- Mobile Nav + Focus Trap + Outside Click ---------------- */
(() => {
  if (!navToggle || !menu) return;

  const html = document.documentElement;
  const focusable = () =>
    $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', menu);

  const onKey = (e) => {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key !== 'Tab') return;
    const f = focusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const onOutside = (e) => {
    if (menu.contains(e.target) || navToggle.contains(e.target)) return;
    setOpen(false);
  };

  const setOpen = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-expanded', String(open));
    // bloquear scroll del body cuando el menú está abierto
    html.style.overflow = open ? 'hidden' : '';
    if (open) {
      const f = focusable();
      f[0]?.focus();
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onOutside);
    } else {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onOutside);
      navToggle.focus();
    }
  };

  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    setOpen(!open);
  });

  menu.addEventListener('click', (e) => {
    if (e.target.matches('.menu__link')) setOpen(false);
  });
})();

/* ---------------- Section Spy ---------------- */
(() => {
  const links = $$('.menu__link[href^="#"]');
  if (!links.length) return;
  const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const map = new Map();
  targets.forEach(el => map.set(el.id, links.find(a => a.getAttribute('href') === `#${el.id}`)));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const link = map.get(e.target.id);
      if (!link) return;
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0.01 });

  targets.forEach(t => io.observe(t));
})();

/* ---------------- Reveal on scroll ---------------- */
(() => {
  const els = $$('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  els.forEach(el => io.observe(el));
})();

/* ---------------- Parallax sutil (pausable) ---------------- */
(() => {
  if (isReduced()) return;
  const els = $$('[data-parallax]');
  if (!els.length) return;
  els.forEach(el => el.style.willChange = 'transform');

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;
    els.forEach(el => {
      const v = clamp(y * 0.04, -12, 12);
      el.style.transform = `translateY(${v}px)`;
    });
  });

  const onVis = () => {
    if (document.hidden) document.removeEventListener('scroll', onScroll);
    else document.addEventListener('scroll', onScroll, { passive: true });
  };

  onVis(); onScroll();
  document.addEventListener('visibilitychange', onVis);
})();

/* ---------------- Contadores animados ---------------- */
(() => {
  const nums = $$('.stat__num');
  if (!nums.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      const end = Number(target.dataset.count);
      const isFloat = String(target.dataset.count).includes('.');
      const duration = 1200;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const val = end * (1 - Math.pow(1 - p, 3));
        target.textContent = isFloat ? val.toFixed(1) : Math.floor(val);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(target);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
})();

/* ---------------- Tema persistente + sync SO ---------------- */
(() => {
  const root = document.documentElement;
  const key = 'fenix-theme';
  const mq = matchMedia('(prefers-color-scheme: dark)');

  const apply = (mode) => {
    root.dataset.theme = mode;           // usa [data-theme="dark|light"] en CSS si lo deseas
    localStorage.setItem(key, mode);
    themeToggle?.setAttribute('aria-pressed', String(mode === 'dark'));
  };

  const getInitial = () => localStorage.getItem(key) || (mq.matches ? 'dark' : 'light');

  // init
  apply(getInitial());

  // toggle
  themeToggle?.addEventListener('click', () => {
    apply(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  // sync con el sistema si el usuario no ha forzado manualmente
  mq.addEventListener?.('change', (e) => {
    const manual = localStorage.getItem(key);
    if (!manual) apply(e.matches ? 'dark' : 'light');
  });
})();

/* ---------------- Smooth anchors (click + hashchange) con offset dinámico ---------------- */
(() => {
  const links = $$('a[href^="#"]');
  if (!links.length) return;

  // offset dinámico si cambia altura del header
  let headerH = header?.offsetHeight || 0;
  if (header) {
    const ro = new ResizeObserver(() => headerH = header.offsetHeight);
    ro.observe(header);
  }

  const scrollToId = (hash, push = false) => {
    if (!hash || hash === '#') return;
    const target = $(hash);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - (headerH + 8);
    if (isReduced()) window.scrollTo(0, y);
    else window.scrollTo({ top: y, behavior: 'smooth' });
    if (push) history.pushState(null, '', hash);
  };

  links.forEach(a => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;
      e.preventDefault();
      scrollToId(hash, true);
    });
  });

  // al cargar con hash
  if (location.hash) setTimeout(() => scrollToId(location.hash), 0);

  // al usar atrás/adelante
  window.addEventListener('hashchange', () => scrollToId(location.hash));
})();

/* ---------------- Dialogs ---------------- */
(() => {
  const openers = $$('[data-open-modal]');
  const closers = $$('[data-close-modal]');
  if (!openers.length) return;
  const lastFocus = new WeakMap();

  openers.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-modal');
      const dlg = document.querySelector(id);
      if (!dlg || typeof dlg.showModal !== 'function') return;
      lastFocus.set(dlg, document.activeElement);
      document.documentElement.style.overflow = 'hidden';
      dlg.showModal();
      dlg.querySelector('h3, h2, [role="heading"], button, a')?.focus();
    });
  });

  closers.forEach(btn => {
    btn.addEventListener('click', () => {
      const dlg = btn.closest('dialog');
      dlg?.close();
      document.documentElement.style.overflow = '';
      lastFocus.get(dlg)?.focus?.();
    });
  });

  $$('dialog').forEach(dlg => {
    dlg.addEventListener('click', (e) => {
      const r = dlg.getBoundingClientRect();
      const inside = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
      if (!inside) { dlg.close(); document.documentElement.style.overflow = ''; }
    });
    dlg.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      lastFocus.get(dlg)?.focus?.();
    });
  });
})();

/* ---------------- Formularios + Toasts ---------------- */
(() => {
  const forms = $$('form[data-validate]');
  if (!forms.length) return;

  forms.forEach(form => {
    const status = $('.form__status', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        status.textContent = 'Revisa los campos resaltados.';
        status.style.color = 'var(--warn)';
        form.reportValidity();
        toast('Revisa los campos.', { icon: '⚠️' });
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      submitBtn?.setAttribute('disabled', 'true');
      status.textContent = 'Enviando…';
      status.style.color = 'var(--muted)';

      // Simulación
      await new Promise(r => setTimeout(r, 900));

      status.textContent = '¡Listo! Te responderemos en breve.';
      status.style.color = 'var(--ok)';
      toast('Formulario enviado ✅', { icon: '📨' });
      form.reset();
      submitBtn?.removeAttribute('disabled');
    });
  });
})();

/* ---------------- Back-to-top (tecla Home) ---------------- */
(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Home') {
      e.preventDefault();
      $('#inicio')?.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth' });
    }
  });
})();

/* ---------------- Prefetch con hover-intent (same-origin + dedupe) ---------------- */
(() => {
  const seen = new Set();
  let t;
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const url = a.getAttribute('href');
    if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return;

    // sólo mismo origen
    const u = new URL(url, location.href);
    if (u.origin !== location.origin) return;
    if (seen.has(u.href)) return;

    clearTimeout(t);
    t = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = u.href;
      document.head.appendChild(link);
      seen.add(u.href);
    }, 120); // hover intent
  }, { passive: true });
})();

/* ---------------- Toaster (ARIA fix) ---------------- */
function toast(message, opts = {}) {
  const { icon = '✨', timeout = 2600 } = opts;
  let host = $('#toaster');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toaster';
    host.style.position = 'fixed';
    host.style.insetInlineEnd = '12px';
    host.style.insetBlockStart = '12px';
    host.style.display = 'grid';
    host.style.gap = '8px';
    host.style.zIndex = '1000';
    document.body.appendChild(host);
  }

  const card = document.createElement('div');
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.style.background = 'linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05))';
  card.style.border = '1px solid var(--border)';
  card.style.borderRadius = '12px';
  card.style.padding = '.6rem .8rem';
  card.style.boxShadow = '0 10px 30px rgba(2,6,23,.35)';
  card.style.backdropFilter = 'blur(6px)';
  card.style.display = 'grid';
  card.style.gridAutoFlow = 'column';
  card.style.alignItems = 'center';
  card.style.gap = '.6rem';
  card.style.transform = 'translateY(-6px)';
  card.style.opacity = '0';
  card.style.transition = 'opacity .25s cubic-bezier(.16,1,.3,1), transform .25s cubic-bezier(.16,1,.3,1)';

  const ic = document.createElement('span'); ic.textContent = icon;
  const msg = document.createElement('div'); msg.textContent = message;

  const close = document.createElement('button');
  close.type = 'button'; close.textContent = '✕';
  close.setAttribute('aria-label', 'Cerrar aviso');
  close.style.border = '1px solid var(--border)';
  close.style.background = 'transparent';
  close.style.borderRadius = '8px';
  close.style.padding = '.2rem .4rem'; close.style.cursor = 'pointer';

  close.addEventListener('click', () => {
    card.style.opacity = '0'; card.style.transform = 'translateY(-6px)';
    setTimeout(() => card.remove(), 220);
  });

  card.append(ic, msg, close); host.appendChild(card);
  requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
  setTimeout(() => close.click(), timeout);
}

/* ---------------- Preload primeras imágenes lazy ---------------- */
(() => {
  const imgs = $$('img[loading="lazy"]');
  imgs.slice(0, 3).forEach(img => {
    const href = img.currentSrc || img.src;
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'preload'; link.as = 'image'; link.href = href;
    document.head.appendChild(link);
  });
})();

/* ---------------- Focus ring sólo con teclado ---------------- */
(() => {
  const html = document.documentElement;
  function onFirstTab(e) {
    if (e.key === 'Tab') {
      html.classList.add('user-tabbing');
      window.removeEventListener('keydown', onFirstTab);
      window.addEventListener('mousedown', onMouseDownOnce);
    }
  }
  function onMouseDownOnce() {
    html.classList.remove('user-tabbing');
    window.removeEventListener('mousedown', onMouseDownOnce);
    window.addEventListener('keydown', onFirstTab);
  }
  window.addEventListener('keydown', onFirstTab);
})();

/* ---------------- Copiar teléfono/WhatsApp (contextmenu) ---------------- */
(() => {
  const tel = $$('a[href^="tel:"], a[href*="wa.me"]');
  tel.forEach(a => {
    a.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      navigator.clipboard?.writeText(a.href.replace(/^tel:/, '')).then(() => {
        toast('Número copiado al portapapeles', { icon: '📋' });
      });
    });
  });
})();

/* ---------------- Hover intent en tarjetas ---------------- */
(() => {
  const cards = $$('.card');
  if (!cards.length || isReduced()) return;
  const move = (e, card) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.transform = `translateY(-4px) perspective(600px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 3}deg)`;
  };
  const reset = (card) => card.style.transform = '';
  cards.forEach(card => {
    let id;
    card.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(id);
      id = requestAnimationFrame(() => move(e, card));
    });
    card.addEventListener('mouseleave', () => reset(card));
  });
})();

/* ---------------- Reviews carousel (capturas Google) — alineación sólida ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.reviews');
  if (!root) return;

  const track   = root.querySelector('.reviews__track');
  const slides  = [...root.querySelectorAll('.reviews__slide')];
  const prev    = root.querySelector('.reviews__btn--prev');
  const next    = root.querySelector('.reviews__btn--next');
  const dotsWrap= root.querySelector('.reviews__dots');

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ir a la reseña ${i+1}`);
    b.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(b);
  });

  let index = 0;
  let timer = null;

  const updateDots = () => {
    dotsWrap.querySelectorAll('button').forEach((b, i) =>
      b.setAttribute('aria-current', i === index ? 'true' : 'false')
    );
  };

  const scrollToSlide = (i) => {
    const target = slides[i]; if (!target) return;
    track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
  };

  const goTo = (i, user = false) => {
    index = (i + slides.length) % slides.length;
    scrollToSlide(index);
    updateDots();
    if (user) restartAutoplay();
  };
  const nextSlide = () => goTo(index + 1);
  const prevSlide = () => goTo(index - 1);

  prev?.addEventListener('click', () => goTo(index - 1, true));
  next?.addEventListener('click', () => goTo(index + 1, true));

  const startAutoplay = () => (timer = setInterval(nextSlide, 5000));
  const stopAutoplay  = () => (timer && clearInterval(timer));
  const restartAutoplay = () => { stopAutoplay(); startAutoplay(); };

  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);

  // Recolocar en resize y al volver la pestaña a visible
  const recenter = () => requestAnimationFrame(() => scrollToSlide(index));
  window.addEventListener('resize', recenter);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recenter(); });

  // Gestos táctiles
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive:true });
  track.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) (dx < 0 ? goTo(index + 1, true) : goTo(index - 1, true));
  }, { passive:true });

  updateDots(); startAutoplay(); scrollToSlide(0);
});

// ===== Marquee LOOP infinito sin deriva =====
(() => {
  const marquee = document.querySelector('.marquee.marquee--loop');
  if (!marquee) return;

  const viewport = marquee.querySelector('.marquee__viewport');
  const inner    = marquee.querySelector('.marquee__inner');
  const track    = marquee.querySelector('.marquee__track');

  // px/seg deseados (ajusta a tu gusto)
  const PX_PER_SECOND = 70;

  function buildLoop() {
    // Limpia clones previos
    [...inner.querySelectorAll('.marquee__track[aria-hidden="true"]')].forEach(n => n.remove());

    // Ancho de una pista (sin transform)
    const prev = inner.style.transform;
    inner.style.transform = 'none';
    const trackW = track.scrollWidth;
    const viewW  = viewport.clientWidth;
    inner.style.transform = prev;

    // Duplica la pista las veces necesarias para cubrir viewport + una extra (para el loop)
    while (inner.scrollWidth < viewW + trackW) {
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      inner.appendChild(clone);
    }

    // Define distancia exacta de animación (ancho de UNA pista)
    inner.style.setProperty('--track-w', trackW + 'px');

    // Velocidad según distancia (para que el ritmo sea constante)
    const speed = Math.max(8, Math.min(60, trackW / PX_PER_SECOND));
    inner.style.setProperty('--marquee-speed', speed + 's');

    // Si todo cabe en viewport, desactiva animación
    if (trackW <= viewW) {
      inner.style.animation = 'none';
      // Centrado estático
      inner.style.justifyContent = 'center';
    } else {
      inner.style.animation = '';              // usa la @keyframes
      inner.style.justifyContent = '';
    }
  }

  // Recalcula en resize y al cargar
  const ro = new ResizeObserver(buildLoop);
  ro.observe(viewport);
  ro.observe(track);
  window.addEventListener('load', buildLoop);
})();
