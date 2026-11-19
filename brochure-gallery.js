(function () {
  'use strict';

  function mount(body, pages) {
    const gallery = document.createElement('section');
    gallery.className = 'brochure-gallery';
    gallery.setAttribute('aria-label', 'Galeri e-brosur');
    gallery.innerHTML = `
      <button class="brochure-close" type="button" data-action="close" aria-label="Tutup e-brosur" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <div class="brochure-toolbar">
        <button class="brochure-pages-toggle" type="button" data-action="pages" aria-expanded="false" aria-controls="brochure-thumbnails">Halaman</button>
        <div class="brochure-navigation" role="group" aria-label="Navigasi halaman">
          <button type="button" data-action="previous" aria-label="Halaman sebelumnya">&#8592;</button>
          <span class="brochure-counter" aria-live="polite" aria-atomic="true"></span>
          <button type="button" data-action="next" aria-label="Halaman berikutnya">&#8594;</button>
        </div>
        <div class="brochure-zoom" role="group" aria-label="Zoom brosur">
          <button type="button" data-action="zoom-out" aria-label="Perkecil brosur">&#8722;</button>
          <button type="button" data-action="reset" aria-label="Sesuaikan halaman ke layar">100%</button>
          <button type="button" data-action="zoom-in" aria-label="Perbesar brosur">+</button>
        </div>
      </div>
      <div class="brochure-stage" tabindex="0" role="group" aria-label="Halaman brosur. Geser untuk pindah halaman, atau gunakan panah kiri dan kanan. Gunakan plus dan minus untuk zoom.">
        <div class="brochure-canvas"><img class="brochure-image" alt="" draggable="false"></div>
      </div>
      <div class="brochure-caption"><strong class="brochure-page-label"></strong><span class="brochure-status" role="status"></span></div>
      <div class="brochure-thumbnails" id="brochure-thumbnails" role="group" aria-label="Pilih halaman brosur" hidden></div>`;
    body.appendChild(gallery);
    const stage = gallery.querySelector('.brochure-stage');
    const canvas = gallery.querySelector('.brochure-canvas');
    const image = gallery.querySelector('.brochure-image');
    const counter = gallery.querySelector('.brochure-counter');
    const label = gallery.querySelector('.brochure-page-label');
    const status = gallery.querySelector('.brochure-status');
    const thumbnails = gallery.querySelector('.brochure-thumbnails');
    const button = (action) => gallery.querySelector('[data-action="' + action + '"]');
    let index = 0;
    let zoom = 1;
    let baseWidth = 0;
    let baseHeight = 0;
    let loaded = false;
    let disposed = false;
    let touchStart = null;
    let pinch = null;
    let drag = null;

    function setThumbnailsOpen(open) {
      thumbnails.hidden = !open;
      button('pages').setAttribute('aria-expanded', String(open));
      if (open) thumbnails.children[index].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }

    function layout() {
      if (!loaded || !stage.clientWidth || !stage.clientHeight) return;
      const fit = Math.min((stage.clientWidth - 24) / image.naturalWidth, (stage.clientHeight - 24) / image.naturalHeight);
      baseWidth = image.naturalWidth * fit;
      baseHeight = image.naturalHeight * fit;
      image.style.width = baseWidth * zoom + 'px';
      image.style.height = baseHeight * zoom + 'px';
      canvas.style.width = Math.max(stage.clientWidth, baseWidth * zoom + 24) + 'px';
      canvas.style.height = Math.max(stage.clientHeight, baseHeight * zoom + 24) + 'px';
    }

    function setZoom(value) {
      const previous = zoom;
      zoom = Math.max(1, Math.min(4, value));
      const previousLeft = (Math.max(stage.clientWidth, baseWidth * previous + 24) - baseWidth * previous) / 2;
      const previousTop = (Math.max(stage.clientHeight, baseHeight * previous + 24) - baseHeight * previous) / 2;
      const centerX = (stage.scrollLeft + stage.clientWidth / 2 - previousLeft) / (baseWidth * previous || 1);
      const centerY = (stage.scrollTop + stage.clientHeight / 2 - previousTop) / (baseHeight * previous || 1);
      layout();
      const nextLeft = (Math.max(stage.clientWidth, baseWidth * zoom + 24) - baseWidth * zoom) / 2;
      const nextTop = (Math.max(stage.clientHeight, baseHeight * zoom + 24) - baseHeight * zoom) / 2;
      stage.scrollLeft = zoom === 1 ? 0 : centerX * baseWidth * zoom + nextLeft - stage.clientWidth / 2;
      stage.scrollTop = zoom === 1 ? 0 : centerY * baseHeight * zoom + nextTop - stage.clientHeight / 2;
      stage.classList.toggle('is-zoomed', zoom > 1);
      button('reset').textContent = Math.round(zoom * 100) + '%';
      button('zoom-out').disabled = zoom <= 1 || !loaded;
      button('zoom-in').disabled = zoom >= 4 || !loaded;
      button('reset').disabled = !loaded;
    }

    function showPage(next) {
      if (next < 0 || next >= pages.length) return;
      index = next;
      loaded = false;
      touchStart = pinch = drag = null;
      image.hidden = true;
      stage.setAttribute('aria-busy', 'true');
      status.textContent = 'Memuat halaman…';
      label.textContent = pages[index].label;
      counter.textContent = (index + 1) + ' / ' + pages.length;
      button('previous').disabled = index === 0;
      button('next').disabled = index === pages.length - 1;
      [...thumbnails.children].forEach((thumb, number) => {
        thumb.setAttribute('aria-pressed', String(number === index));
        if (number === index && !thumbnails.hidden) thumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      });
      setZoom(1);
      image.alt = pages[index].label + ', halaman ' + (index + 1);
      image.src = pages[index].url;
    }

    pages.forEach((page, number) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'brochure-thumbnail';
      thumb.setAttribute('aria-label', 'Halaman ' + (number + 1) + ': ' + page.label);
      const preview = document.createElement('img');
      preview.alt = '';
      preview.loading = 'lazy';
      preview.draggable = false;
      preview.src = page.url;
      const numberLabel = document.createElement('span');
      numberLabel.textContent = number + 1;
      thumb.append(preview, numberLabel);
      thumb.addEventListener('click', () => {
        showPage(number);
        setThumbnailsOpen(false);
        button('pages').focus({ preventScroll: true });
      });
      thumbnails.appendChild(thumb);
    });

    image.addEventListener('load', () => {
      if (disposed) return;
      loaded = true;
      image.hidden = false;
      stage.setAttribute('aria-busy', 'false');
      status.textContent = '';
      setZoom(1);
    });
    image.addEventListener('error', () => {
      if (disposed) return;
      stage.setAttribute('aria-busy', 'false');
      status.textContent = 'Halaman tidak dapat dimuat. Pilih halaman lain atau buka kembali e-brosur.';
    });
    button('previous').addEventListener('click', () => showPage(index - 1));
    button('pages').addEventListener('click', () => setThumbnailsOpen(thumbnails.hidden));
    button('close').addEventListener('click', () => body.closest('dialog').close());
    button('next').addEventListener('click', () => showPage(index + 1));
    button('zoom-out').addEventListener('click', () => setZoom(zoom - .5));
    button('zoom-in').addEventListener('click', () => setZoom(zoom + .5));
    button('reset').addEventListener('click', () => setZoom(1));
    stage.addEventListener('dblclick', () => { if (loaded) setZoom(zoom > 1 ? 1 : 2); });
    gallery.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' && zoom === 1) showPage(index - 1);
      else if (event.key === 'ArrowRight' && zoom === 1) showPage(index + 1);
      else if (event.key === '+' || event.key === '=') setZoom(zoom + .5);
      else if (event.key === '-') setZoom(zoom - .5);
      else if (event.key === '0') setZoom(1);
      else return;
      event.preventDefault();
      event.stopPropagation();
    });
    const distance = (touches) => Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
    stage.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2 && loaded) {
        pinch = { distance: distance(event.touches), zoom };
        touchStart = null;
      } else if (event.touches.length === 1 && zoom === 1) {
        touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    }, { passive: true });
    stage.addEventListener('touchmove', (event) => {
      if (pinch && event.touches.length === 2) {
        event.preventDefault();
        setZoom(pinch.zoom * distance(event.touches) / (pinch.distance || 1));
      } else if (touchStart && event.touches.length === 1) {
        const dx = Math.abs(event.touches[0].clientX - touchStart.x);
        const dy = Math.abs(event.touches[0].clientY - touchStart.y);
        if (dx > dy && dx > 8) event.preventDefault();
      }
    }, { passive: false });
    stage.addEventListener('touchend', (event) => {
      if (pinch) { if (!event.touches.length) pinch = null; return; }
      if (!touchStart || event.touches.length) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      touchStart = null;
      if (zoom === 1 && Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) showPage(index + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('touchcancel', () => { touchStart = pinch = null; });
    stage.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || zoom <= 1) return;
      drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop };
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
      event.preventDefault();
    });
    stage.addEventListener('pointermove', (event) => {
      if (!drag) return;
      stage.scrollLeft = drag.left - (event.clientX - drag.x);
      stage.scrollTop = drag.top - (event.clientY - drag.y);
    });
    stage.addEventListener('lostpointercapture', () => { drag = null; stage.classList.remove('is-dragging'); });
    stage.addEventListener('pointerup', () => { drag = null; stage.classList.remove('is-dragging'); });

    const resize = new ResizeObserver(() => { layout(); });
    resize.observe(stage);
    showPage(0);
    return () => { disposed = true; resize.disconnect(); };
  }

  window.AtlasBrochureGallery = { mount };
})();
