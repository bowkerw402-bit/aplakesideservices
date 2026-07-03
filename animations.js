(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasAnime = typeof window.anime === 'function';

  const runtimeStyles = `
    .hero-ripple-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;mix-blend-mode:screen;opacity:.6}
    .js-anime-reveal{transition:none!important;will-change:transform,opacity}
    .tl-line{will-change:width}
    .movement,.pkg-card,.tier{transform-style:preserve-3d;will-change:transform}
    .pkg-card,.tier{position:relative;isolation:isolate}
    .card-border-draw{position:absolute;inset:0;z-index:5;pointer-events:none}
    .card-border-draw i{position:absolute;display:block;background:#B79B61;transform-origin:left center}
    .card-border-draw .edge-top,.card-border-draw .edge-bottom{left:0;width:100%;height:1px;transform:scaleX(0)}
    .card-border-draw .edge-top{top:0}.card-border-draw .edge-bottom{bottom:0;transform-origin:right center}
    .card-border-draw .edge-left,.card-border-draw .edge-right{top:0;width:1px;height:100%;transform:scaleY(0);transform-origin:center top}
    .card-border-draw .edge-left{left:0}.card-border-draw .edge-right{right:0;transform-origin:center bottom}
    .cursor-dot,.cursor-ring{position:fixed;left:0;top:0;pointer-events:none;z-index:10000;opacity:0;border-radius:50%;will-change:transform}
    .cursor-dot{width:8px;height:8px;margin:-4px 0 0 -4px;background:#B79B61;box-shadow:0 0 14px rgba(183,155,97,.48)}
    .cursor-ring{width:32px;height:32px;margin:-16px 0 0 -16px;border:1px solid rgba(183,155,97,.85);transition:width .22s ease,height .22s ease,margin .22s ease,background .22s ease}
    .cursor-ring.is-hovering{width:45px;height:45px;margin:-22.5px 0 0 -22.5px;background:rgba(183,155,97,.09)}
    .nav-emblem{display:block;transform-origin:center;will-change:transform}
    @media(prefers-reduced-motion:reduce){.hero-ripple-canvas,.cursor-dot,.cursor-ring{display:none!important}.js-anime-reveal{opacity:1!important;transform:none!important}}
  `;

  function injectRuntimeStyles() {
    if ($('#apl-animation-styles')) return;
    const style = document.createElement('style');
    style.id = 'apl-animation-styles';
    style.textContent = runtimeStyles;
    document.head.appendChild(style);
  }

  function showWithoutMotion(targets) {
    $$(targets).forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.classList.add('in');
    });
  }

  function initHeroEntrance() {
    const hero = $('.scene-arrival');
    if (!hero) return;

    const emblem = $('.arrival-emblem', hero);
    const kicker = $('.arrival-kicker', hero);
    const words = $$('.arrival-line .w', hero);
    const sub = $('.arrival-sub', hero);
    const cta = $('.arrival-cta', hero);
    const cue = $('.scroll-cue', hero);
    const targets = [emblem, kicker, ...words, sub, cta, cue].filter(Boolean);

    targets.forEach((target) => {
      target.style.animation = 'none';
      target.style.transition = 'none';
    });

    if (reducedMotion || !hasAnime) {
      targets.forEach((target) => {
        target.style.opacity = '1';
        target.style.transform = 'none';
      });
      return;
    }

    anime.set(emblem, { opacity: 0, translateY: -30, rotateY: 15, scale: 0.96 });
    anime.set(kicker, { opacity: 0, translateY: 18 });
    anime.set(words, { opacity: 0, translateY: 38 });
    anime.set([sub, cta], { opacity: 0, translateY: 22 });
    anime.set(cue, { opacity: 0, translateY: -8 });

    const timeline = anime.timeline({ easing: 'easeOutExpo' });
    if (emblem) timeline.add({ targets: emblem, opacity: 1, translateY: 0, rotateY: 0, scale: 1, duration: 800 });
    if (kicker) timeline.add({ targets: kicker, opacity: 1, translateY: 0, duration: 650 }, '-=430');
    if (words.length) {
      timeline.add({
        targets: words,
        opacity: 1,
        translateY: 0,
        duration: 900,
        delay: anime.stagger(135)
      }, '-=330');
    }
    if (sub) timeline.add({ targets: sub, opacity: 1, translateY: 0, duration: 700 }, '-=420');
    if (cta) timeline.add({ targets: cta, opacity: 1, translateY: 0, duration: 700 }, '-=540');
    if (cue) timeline.add({ targets: cue, opacity: 1, translateY: 0, duration: 650 }, '-=300');
  }

  function initWaterRipples() {
    const hero = $('.scene-arrival');
    if (!hero || reducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-ripple-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.appendChild(canvas);

    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time) => {
      if (!visible) return;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';
      const layers = [
        { y: 0.72, amp: 2.4, wave: 72, speed: 0.00038, alpha: 0.11 },
        { y: 0.79, amp: 1.8, wave: 96, speed: -0.00027, alpha: 0.08 },
        { y: 0.86, amp: 1.3, wave: 128, speed: 0.0002, alpha: 0.06 }
      ];

      layers.forEach((layer, layerIndex) => {
        context.beginPath();
        for (let x = -10; x <= width + 10; x += 5) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = height * layer.y
            + Math.sin(x / layer.wave + time * layer.speed + layerIndex) * layer.amp * envelope;
          if (x === -10) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(212,185,126,${layer.alpha})`;
        context.lineWidth = 1;
        context.stroke();
      });
      frame = requestAnimationFrame(draw);
    };

    const heroObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(draw);
    });

    resize();
    heroObserver.observe(hero);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden && hero.getBoundingClientRect().bottom > 0;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(draw);
    });
    frame = requestAnimationFrame(draw);
  }

  function initScrollReveals() {
    const reveals = $$('.reveal');
    if (!reveals.length) return;
    if (reducedMotion || !hasAnime) {
      reveals.forEach((element) => {
        element.style.opacity = '1';
        element.style.transform = 'none';
        element.classList.add('in');
      });
      return;
    }

    reveals.forEach((element) => {
      element.classList.remove('in');
      element.classList.add('js-anime-reveal');
      anime.set(element, { opacity: 0, translateY: 40 });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const delay = element.classList.contains('d3') ? 360
          : element.classList.contains('d2') ? 240
            : element.classList.contains('d1') ? 120 : 0;
        anime({
          targets: element,
          opacity: [0, 1],
          translateY: [40, 0],
          duration: 950,
          delay,
          easing: 'easeOutExpo',
          complete: () => element.classList.add('in')
        });
        observer.unobserve(element);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    reveals.forEach((element) => revealObserver.observe(element));
  }

  function initTimeline() {
    const line = $('#tl-line');
    const nodes = $$('.tl-node');
    const movements = $$('.movement-slides .movement');
    const track = $('.tl-track');
    if (!line || !nodes.length || !movements.length) return;

    const linePositions = [0, 50, 100];
    const AUTO_INTERVAL = 3800;
    let current = 0;
    let autoTimer = null;
    let userTookControl = false;

    function activateSlide(index) {
      current = index;

      movements.forEach((m, i) => {
        const on = i === index;
        m.classList.toggle('active', on);
        m.setAttribute('aria-hidden', on ? 'false' : 'true');
      });

      nodes.forEach((n, i) => n.classList.toggle('active', i === index));

      if (hasAnime && !reducedMotion) {
        anime({ targets: line, width: `${linePositions[index]}%`, duration: 600, easing: 'easeOutExpo' });
        const dot = $('.tl-dot', nodes[index]);
        if (dot) anime({ targets: dot, scale: [1, 1.3, 1], duration: 500, easing: 'easeOutElastic(1, .5)' });
      } else {
        line.style.width = `${linePositions[index]}%`;
      }
    }

    function startAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => {
        activateSlide((current + 1) % movements.length);
      }, AUTO_INTERVAL);
    }

    function stopAuto() {
      clearInterval(autoTimer);
      autoTimer = null;
    }

    nodes.forEach((node, i) => {
      node.addEventListener('click', () => {
        userTookControl = true;
        stopAuto();
        activateSlide(i);
      });
    });

    if (track) {
      let dragStartX = null;
      let dragStartIndex = null;

      const onDragStart = (e) => {
        userTookControl = true;
        stopAuto();
        dragStartX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        dragStartIndex = current;
      };

      const onDragEnd = (e) => {
        if (dragStartX === null) return;
        const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
        const delta = endX - dragStartX;
        const threshold = 40;
        if (delta < -threshold) activateSlide(Math.min(dragStartIndex + 1, movements.length - 1));
        else if (delta > threshold) activateSlide(Math.max(dragStartIndex - 1, 0));
        dragStartX = null;
      };

      track.addEventListener('mousedown', onDragStart);
      track.addEventListener('touchstart', onDragStart, { passive: true });
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchend', onDragEnd);
    }

    activateSlide(0);
    if (!reducedMotion) startAuto();
  }

  function attachTilt(element, options = {}) {
    if (!finePointer || reducedMotion || !element) return;
    const strength = options.strength || 5;
    const lift = options.lift || 8;
    let bounds;

    element.addEventListener('pointerenter', () => {
      bounds = element.getBoundingClientRect();
      if (hasAnime) {
        anime.remove(element);
        anime({
          targets: element,
          translateZ: lift,
          scale: options.scale || 1.01,
          duration: 360,
          easing: 'easeOutQuad'
        });
      }
    });

    element.addEventListener('pointermove', (event) => {
      bounds ||= element.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      if (hasAnime) {
        anime.remove(element);
        anime({
          targets: element,
          rotateY: x * strength,
          rotateX: y * -strength,
          translateZ: lift,
          scale: options.scale || 1.01,
          duration: 220,
          easing: 'easeOutQuad'
        });
      }
    });

    element.addEventListener('pointerleave', () => {
      bounds = null;
      if (hasAnime) {
        anime.remove(element);
        anime({
          targets: element,
          rotateX: 0,
          rotateY: 0,
          translateZ: 0,
          scale: 1,
          duration: 650,
          easing: 'easeOutElastic(1, .65)'
        });
      } else {
        element.style.transform = '';
      }
    });
  }

  function addCardBorder(card) {
    if ($('.card-border-draw', card)) return $('.card-border-draw', card);
    const border = document.createElement('span');
    border.className = 'card-border-draw';
    border.setAttribute('aria-hidden', 'true');
    border.innerHTML = '<i class="edge-top"></i><i class="edge-right"></i><i class="edge-bottom"></i><i class="edge-left"></i>';
    card.appendChild(border);
    return border;
  }

  function initCardEffects() {
    const cards = $$('.pkg-card, .tier');
    if (!cards.length) return;

    cards.forEach((card) => {
      if (card.classList.contains('featured')) {
        card.classList.add('stable-featured-card');
      } else {
        attachTilt(card, { strength: 7, lift: 20, scale: 1.015 });
      }
      addCardBorder(card);

      // Make entire card clickable via the inner CTA link
      const cta = $('.pkg-card-cta, .tier-cta', card);
      if (cta) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          if (e.target.closest('a')) return; // let real links handle themselves
          cta.click();
        });
      }
    });

    if (hasAnime && !reducedMotion) {
      const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const edges = $$('.card-border-draw i', entry.target);
          anime({
            targets: edges,
            scaleX: 1,
            scaleY: 1,
            duration: 720,
            delay: anime.stagger(120),
            easing: 'easeInOutSine'
          });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.25 });
      cards.forEach((card) => cardObserver.observe(card));

    }
  }

  function initMovementEffects() {
    // tilt disabled — movements are now a slideshow
  }

  function initParallax() {
    if (reducedMotion) return;
    const hero = $('.scene-arrival');
    const photo = $('.arrival-photo');
    const mist  = $('.arrival-mist');
    const text  = $('.arrival-text');
    if (!hero || !photo) return;

    // Scroll parallax — photo drifts up as user scrolls down
    const scrollLayers = $$('[data-plx]').map((el) => ({
      el, factor: Number(el.dataset.plx || 0.12), cur: 0, tgt: 0
    }));

    // Mouse parallax state
    let mx = 0, my = 0;   // normalised -1..1
    let pmx = 0, pmy = 0; // smoothed
    let heroVisible = true;

    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      my = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    });
    hero.addEventListener('mouseleave', () => { mx = 0; my = 0; });

    const observer = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; });
    observer.observe(hero);

    const tick = () => {
      // Scroll layers
      if (heroVisible) {
        scrollLayers.forEach((l) => {
          l.tgt = window.scrollY * l.factor;
          l.cur += (l.tgt - l.cur) * 0.08;
          l.el.style.transform = `translate3d(0, ${l.cur.toFixed(2)}px, 0)`;
        });
      }

      // Mouse layers — smooth lerp
      pmx += (mx - pmx) * 0.06;
      pmy += (my - pmy) * 0.06;

      // Photo drifts gently opposite to mouse
      photo.style.transform = `translate3d(${(-pmx * 14).toFixed(2)}px, ${(-pmy * 8).toFixed(2)}px, 0) scale(1.06)`;
      // Mist moves slightly faster in same direction for depth illusion
      if (mist) mist.style.transform = `translate3d(${(-pmx * 22).toFixed(2)}px, ${(-pmy * 12).toFixed(2)}px, 0)`;
      // Text floats opposite — parallax foreground feel
      if (text) {
        const floatY = parseFloat(getComputedStyle(text).getPropertyValue('--float-y') || 0);
        text.style.transform = `translate3d(${(pmx * 8).toFixed(2)}px, ${(pmy * 5).toFixed(2)}px, 0)`;
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initCursor() {
    if (!finePointer || reducedMotion) return;
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('has-custom-cursor');
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let shown = false;

    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!shown) {
        shown = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('pointerover', (event) => {
      if (event.target.closest('a,button,[role="button"],input,select,textarea,.pkg-card,.tier')) {
        ring.classList.add('is-hovering');
      }
    });
    document.addEventListener('pointerout', (event) => {
      if (event.target.closest('a,button,[role="button"],input,select,textarea,.pkg-card,.tier')) {
        ring.classList.remove('is-hovering');
      }
    });

    const tick = () => {
      ringX += (pointerX - ringX) * 0.12;
      ringY += (pointerY - ringY) * 0.12;
      dot.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
      ring.style.transform = `translate3d(${ringX}px,${ringY}px,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initNav() {
    const nav = $('#nav');
    const hero = $('.scene-arrival');
    if (!nav || !hero) return;
    let shown = false;

    const update = () => {
      const pastHero = hero.getBoundingClientRect().bottom <= nav.offsetHeight + 24;
      if (pastHero === shown) return;
      shown = pastHero;
      nav.classList.toggle('visible', shown);
      nav.classList.toggle('scrolled', shown);
      if (hasAnime && !reducedMotion && shown) {
        anime.remove(nav);
        anime({
          targets: nav,
          translateY: [-60, 0],
          opacity: [0, 1],
          duration: 400,
          easing: 'easeOutCubic'
        });
      } else if (!shown) {
        nav.style.opacity = '';
        nav.style.transform = '';
      }
    };

    const logo = $('.nav-emblem', nav) || $('.nav-mark svg', nav);
    if (logo && finePointer && hasAnime && !reducedMotion) {
      $('.nav-mark', nav)?.addEventListener('mouseenter', () => {
        anime.remove(logo);
        anime({ targets: logo, translateY: -2, scale: 1.06, duration: 280, easing: 'easeOutQuad' });
      });
      $('.nav-mark', nav)?.addEventListener('mouseleave', () => {
        anime.remove(logo);
        anime({ targets: logo, translateY: 0, scale: 1, duration: 240, easing: 'easeOutQuad' });
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function init() {
    injectRuntimeStyles();
    initHeroEntrance();
    initWaterRipples();
    initScrollReveals();
    initTimeline();
    initMovementEffects();
    initCardEffects();
    initParallax();
    initNav();
    initCursor();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
