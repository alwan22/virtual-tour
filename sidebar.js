/**
 * ATLAS ARCADIA — Minimal Explorer sidebar
 *
 * Integration contract (3DVista):
 *   window.AtlasTourManifest.scenes -> [{ index, id, title, group }]
 *   window.AtlasTourBridge -> navigateTo, getActiveSceneIndex,
 *                             getMuted, setMuted, getGyroscopeEnabled,
 *                             setGyroscopeEnabled
 *   events: atlas-tour:manifest-ready, atlas-tour:ready, hashchange
 *
 * UI rules:
 *   - One accordion expanded at a time. Spots are flat within each zone.
 *   - The active spot follows the ACTUAL player scene, not a click alone.
 *   - Desktop (>= 1024px) is a nonmodal floating overlay, initially open.
 *   - Tablet/mobile (< 1024px) use a modal-style drawer with a backdrop;
 *     selecting a spot closes it without changing the panorama viewport.
 *   - Only the navigation list scrolls; header and footer stay visible.
 */
(function () {
  'use strict';

  const config = window.ATLAS_TOUR_CONFIG || {};
  const brand = typeof config.brand === 'string' ? config.brand : 'Atlas Arcadia';
  const mobileQuery = window.matchMedia('(max-width: 1023px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const zones = [
    { id: 'aerial', label: 'Aerial' },
    { id: 'ground', label: 'Ground View' },
    { id: 'interior', label: 'Interior' }
  ];

  const icons = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
    arrowUpRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.6-3.8a9 9 0 1 1 3.4 2.9L3 21Z"/><path d="M8.8 9.2c.1 3 3.1 6 6.2 6.1l1.6-1.4-2.2-1.2-1 1-3.1-3.1.9-1-1.2-2.1-1.2 1.7Z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    brochure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M6 4v16l14-8L6 4Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 17v3a2 2 0 0 1-2.2 2A19.7 19.7 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 2.1L7.6 10a16 16 0 0 0 6.4 6.4l1.4-1.3a2 2 0 0 1 2.1-.6l2.8.5A2 2 0 0 1 22 17Z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3zM16 9c2 2 2 4 0 6m3-9c4 4 4 8 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3zM16.5 9.5l5 5m0-5-5 5"/></svg>',
    gyro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="8" y="4" width="8" height="16" rx="2" transform="rotate(-18 12 12)"/><path d="M4 5a8 8 0 0 0-2 6m20 2a8 8 0 0 1-2 6"/></svg>'
  };

  let root = null;
  let isOpen = !mobileQuery.matches;
  let expandedGroup = null;
  let currentIndex = null;
  let pendingIndex = null;
  let pendingTimer = null;
  let currentScenes = [];
  let previousFocus = null;
  let noticeTimer = null;

  const get = (name) => document.getElementById(name);
  const bridge = () => window.AtlasTourBridge;
  const count = (number) => String(number).padStart(2, '0');

  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof content === 'string') node.textContent = content;
    return node;
  }

  function urlIfSafe(value) {
    if (typeof value !== 'string' || !value) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function validContacts() {
    return (config.marketingContacts || []).map((contact) => {
      const number = String(contact.number || '').replace(/\D/g, '').replace(/^0/, '62');
      return /^62\d{8,13}$/.test(number)
        ? { name: String(contact.name || 'Marketing'), number, display: String(contact.number) }
        : null;
    }).filter(Boolean);
  }

  function notice(message) {
    let toast = get('ql-tour-toast');
    if (!toast) {
      toast = el('div', 'ql-toast-notice');
      toast.id = 'ql-tour-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => toast.classList.remove('is-visible'), 3800);
  }

  function focusElement(element) {
    if (element && typeof element.focus === 'function') element.focus({ preventScroll: true });
  }

  /** Only on small screens does the drawer behave as a modal overlay. */
  function setOpen(open, options = {}) {
    if (!root) return;
    const opening = Boolean(open);
    if (opening && !isOpen && mobileQuery.matches) previousFocus = document.activeElement;
    isOpen = opening;
    root.classList.toggle('is-open', opening);
    root.inert = !opening;

    const backdrop = get('ql-sidebar-backdrop');
    const trigger = get('ql-sidebar-toggle');
    const close = get('ql-collapse-toggle');
    const overlay = mobileQuery.matches && opening;
    backdrop.hidden = !overlay;
    trigger.setAttribute('aria-expanded', String(opening));
    trigger.setAttribute('aria-label', opening ? 'Tutup navigasi' : 'Buka navigasi');
    trigger.tabIndex = opening ? -1 : 0;
    close.setAttribute('aria-expanded', String(opening));
    root.setAttribute('aria-hidden', String(!opening));
    // Use dialog semantics only when the drawer is actually modal.
    root.setAttribute('role', overlay ? 'dialog' : 'complementary');
    if (overlay) root.setAttribute('aria-modal', 'true');
    else root.removeAttribute('aria-modal');
    document.body.classList.toggle('ql-drawer-open', overlay);

    if (opening) {
      if (mobileQuery.matches && options.focus !== false) focusElement(close);
      scrollToActive();
    } else if (options.restoreFocus) {
      focusElement(previousFocus && previousFocus.isConnected && previousFocus !== close
        ? previousFocus : trigger);
    }
  }

  function onViewportChange() {
    // Breakpoint change only; ordinary resize does not reset a manual toggle.
    setOpen(!mobileQuery.matches, { focus: false });
  }

  function onKeydown(event) {
    if (!isOpen || !root) return;
    const dialog = get('ql-explore-dialog');
    if (dialog && dialog.open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false, { restoreFocus: true });
      return;
    }
    if (!mobileQuery.matches || event.key !== 'Tab') return;

    const candidates = [...root.querySelectorAll('button:not([disabled]), a[href]')]
      .filter((item) => !item.closest('[inert]') && item.getClientRects().length);
    if (!candidates.length) return;
    const first = candidates[0];
    const last = candidates[candidates.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      focusElement(last);
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      focusElement(first);
    }
  }

  /** Accordion selection does not navigate to a different panorama. */
  function setExpandedGroup(group) {
    expandedGroup = group;
    root.querySelectorAll('.ql-zone-block').forEach((block) => {
      const expanded = block.dataset.zoneId === group;
      block.classList.toggle('open', expanded);
      block.querySelector('.ql-zone-header').setAttribute('aria-expanded', String(expanded));
      const list = block.querySelector('.ql-zone-points');
      list.hidden = !expanded;
      list.inert = !expanded;
    });
  }

  function scrollToActive() {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const active = root.querySelector('.ql-point-item.active');
      if (active && active.getClientRects().length) {
        active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
    });
  }

  function makeSpotButton(scene) {
    const button = el('button', 'ql-point-item');
    button.type = 'button';
    button.dataset.mediaIndex = String(scene.index);
    button.dataset.sceneId = String(scene.id || '');
    button.title = scene.title;
    button.innerHTML = '<span class="ql-point-dot" aria-hidden="true"></span>';
    button.appendChild(el('span', 'ql-point-name', scene.title));
    button.addEventListener('click', () => go(scene.index));
    return button;
  }

  function makeZone(zone, scenes) {
    const block = el('section', 'ql-zone-block');
    block.dataset.zoneId = zone.id;
    const header = el('button', 'ql-zone-header');
    header.type = 'button';
    header.setAttribute('aria-controls', 'ql-zone-' + zone.id);
    header.setAttribute('aria-expanded', 'false');
    const chevron = el('span', 'ql-chevron');
    chevron.innerHTML = icons.chevron;
    header.appendChild(chevron);
    header.appendChild(el('span', 'ql-zone-name', zone.label));
    header.appendChild(el('span', 'ql-zone-count', '(' + count(scenes.length) + ')'));
    header.addEventListener('click', () => {
      setExpandedGroup(expandedGroup === zone.id ? null : zone.id);
    });
    const list = el('div', 'ql-zone-points');
    list.id = 'ql-zone-' + zone.id;
    list.hidden = true;
    list.inert = true;
    scenes.forEach((scene) => list.appendChild(makeSpotButton(scene)));
    block.appendChild(header);
    block.appendChild(list);
    return block;
  }

  function renderManifest() {
    const manifest = window.AtlasTourManifest;
    if (!manifest || !Array.isArray(manifest.scenes) || !manifest.scenes.length) return;
    if (currentScenes === manifest.scenes) return;

    currentScenes = manifest.scenes;
    const list = get('ql-zone-list');
    list.replaceChildren();
    zones.forEach((zone) => {
      const scenes = currentScenes.filter((scene) => scene.group === zone.id);
      if (scenes.length) list.appendChild(makeZone(zone, scenes));
    });
    const extras = currentScenes.filter((scene) => !zones.some((zone) => zone.id === scene.group));
    if (extras.length) list.appendChild(makeZone({ id: 'other', label: 'Lainnya' }, extras));

    const tour = bridge();
    const index = tour && tour.getActiveSceneIndex();
    const activeScene = currentScenes.find((scene) => Number(scene.index) === Number(index) && index != null);
    const initialZone = (activeScene && activeScene.group) ||
      (currentScenes.some((scene) => scene.group === 'ground') ? 'ground' : currentScenes[0].group);
    setExpandedGroup(initialZone);
    get('ql-total-spots-label').textContent = currentScenes.length + ' Spots';
    get('ql-sidebar-status').textContent = currentScenes.length + ' panorama tersedia';
    currentIndex = null; // Refresh active indicators after regenerating the list.
    if (index != null) setActive(index);
    root.classList.add('is-ready');
  }

  function clearPending() {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingIndex = null;
    root.querySelectorAll('.ql-point-item.is-loading').forEach((node) => {
      node.classList.remove('is-loading');
      node.removeAttribute('aria-busy');
    });
  }

  function go(index) {
    const tour = bridge();
    if (!tour || typeof tour.navigateTo !== 'function' || !tour.navigateTo(index)) {
      notice('Panorama belum siap. Coba kembali setelah tur selesai dimuat.');
      return;
    }

    clearPending();
    if (Number(index) !== currentIndex) {
      pendingIndex = Number(index);
      const button = root.querySelector('[data-media-index="' + String(index) + '"]');
      if (button) {
        button.classList.add('is-loading');
        button.setAttribute('aria-busy', 'true');
      }
      pendingTimer = setTimeout(() => {
        if (pendingIndex != null) {
          clearPending();
          notice('Perpindahan panorama belum terkonfirmasi. Coba pilih spot kembali.');
        }
      }, 12000);
    }
    if (mobileQuery.matches) setOpen(false, { restoreFocus: true });
    setTimeout(syncFromTour, 200);
  }

  /** Only the 3DVista bridge can confirm which panorama is active. */
  function setActive(index) {
    if (index == null || Number(index) === currentIndex) return;
    const number = Number(index);
    const scene = currentScenes.find((item) => Number(item.index) === number);
    if (!scene) return;

    currentIndex = number;
    clearPending();
    root.querySelectorAll('.ql-point-item').forEach((button) => {
      const active = Number(button.dataset.mediaIndex) === number;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
    root.querySelectorAll('.ql-zone-block').forEach((block) => {
      block.classList.toggle('has-active-scene', block.dataset.zoneId === scene.group);
    });
    setExpandedGroup(scene.group);
    const zone = zones.find((item) => item.id === scene.group);
    get('ql-sidebar-status').textContent = (zone ? zone.label : 'Lainnya') + ' · ' + scene.title;
    scrollToActive();
  }

  function syncFromTour() {
    const tour = bridge();
    if (!tour) return;
    if (!currentScenes.length) renderManifest();
    if (typeof tour.getActiveSceneIndex === 'function') setActive(tour.getActiveSceneIndex());

    if (typeof tour.getMuted === 'function') {
      const muted = tour.getMuted();
      if (muted !== null && muted !== undefined) {
        const button = get('ql-btn-sound');
        button.classList.toggle('active', muted);
        button.setAttribute('aria-pressed', String(muted));
        button.querySelector('.ql-control-icon').innerHTML = muted ? icons.mute : icons.sound;
        button.title = muted ? 'Nyalakan suara' : 'Matikan suara';
        button.setAttribute('aria-label', button.title);
      }
    }
    if (typeof tour.getGyroscopeEnabled === 'function') updateGyroscope(tour.getGyroscopeEnabled());
  }

  function updateGyroscope(enabled) {
    const button = get('ql-btn-gyro');
    button.hidden = enabled == null;
    if (button.hidden) return;
    button.classList.toggle('active', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? 'Matikan giroskop' : 'Aktifkan giroskop';
    button.setAttribute('aria-label', button.title);
  }

  function toggleGyroscope() {
    const tour = bridge();
    const enabled = tour && typeof tour.getGyroscopeEnabled === 'function' ? tour.getGyroscopeEnabled() : null;
    if (enabled == null || !tour.setGyroscopeEnabled(!enabled)) {
      notice('Giroskop belum dapat digunakan pada perangkat ini.');
      return;
    }
    syncFromTour();
  }

  function toggleSound() {
    const tour = bridge();
    const muted = tour && typeof tour.getMuted === 'function' ? tour.getMuted() : null;
    if (muted == null || !tour.setMuted(!muted)) {
      notice('Pengaturan suara belum tersedia sebelum tur dimuat.');
      return;
    }
    syncFromTour();
  }

  function toggleFullscreen() {
    const action = document.fullscreenElement
      ? document.exitFullscreen()
      : (document.documentElement.requestFullscreen && document.documentElement.requestFullscreen());
    if (action && typeof action.catch === 'function') {
      action.catch(() => notice('Browser membatasi akses fullscreen.'));
    }
  }

  function updateFullscreen() {
    const full = Boolean(document.fullscreenElement);
    const button = get('ql-btn-fullscreen');
    button.classList.toggle('active', full);
    button.setAttribute('aria-pressed', String(full));
    button.title = full ? 'Keluar fullscreen' : 'Fullscreen';
    button.setAttribute('aria-label', button.title);
  }

  // Existing project dialogs are retained and restyled, not replaced by links.
  function showMap(body) {
    const note = el('p', 'ql-explore-note');
    note.innerHTML = '<strong>Atlas Arcadia Ledug</strong><br>Jl. Senopati No. 22 Dukuhwaluh, Kec. Kembaran, Kab. Banyumas, Jawa Tengah';
    body.appendChild(note);

    const directUrl = config.directMapUrl || 'https://www.google.com/maps/search/?api=1&query=ATLAS+ARCADIA+LEDUG';
    const embedUrl = urlIfSafe(config.mapUrl);

    if (embedUrl) {
      const map = el('iframe', 'ql-location-map');
      map.title = 'Peta lokasi Atlas Arcadia';
      map.loading = 'lazy';
      map.referrerPolicy = 'no-referrer-when-downgrade';
      map.allowFullscreen = true;
      map.src = embedUrl;
      body.appendChild(map);
    }

    const actions = el('div', 'ql-map-actions');
    const link = el('a', 'ql-download-btn', 'Buka di Google Maps ↗');
    link.href = directUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    actions.appendChild(link);
    body.appendChild(actions);
  }

  function showVideo(body) {
    const url = urlIfSafe(config.videoUrl);
    if (!url) return body.appendChild(el('p', 'ql-explore-note', 'Video preview belum tersedia.'));
    const video = el('video', 'ql-preview-video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', 'Video Preview Atlas Arcadia');
    video.src = url;
    video.addEventListener('error', () => {
      if (body.contains(video)) body.replaceChildren(el('p', 'ql-explore-note', 'Video preview belum tersedia.'));
    });
    body.appendChild(video);
    if (config.videoIsPlaceholder) body.appendChild(el('p', 'ql-explore-note', 'Preview sementara. Video resmi menyusul.'));
  }

  function showBrochure(body) {
    const pages = el('div', 'ql-brochure-pages');
    (config.brochurePages || []).forEach((page) => {
      const url = urlIfSafe(page.url);
      if (!url) return;
      const link = el('a', 'ql-brochure-page');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const img = el('img');
      img.alt = page.label || 'Halaman brosur';
      img.loading = 'lazy';
      img.src = url;
      link.appendChild(el('span', 'ql-brochure-label', page.label || 'Halaman brosur'));
      link.appendChild(img);
      pages.appendChild(link);
    });
    const url = urlIfSafe(config.brochureUrl);
    if (url) {
      const link = el('a', 'ql-download-btn', 'Buka brosur digital');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      pages.appendChild(link);
    }
    body.appendChild(pages.childElementCount ? pages : el('p', 'ql-explore-note', 'E-Brosur belum tersedia.'));
  }

  function showContacts(body) {
    body.appendChild(el('p', 'ql-contact-pitch',
      'Jadwalkan kunjungan privat atau konsultasikan ketersediaan unit bersama konsultan Atlas Arcadia.'));
    const links = el('div', 'ql-contact-links');
    validContacts().forEach((contact) => {
      const link = el('a', 'ql-contact-link');
      link.href = 'https://wa.me/' + contact.number;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'WhatsApp ' + contact.name + ' ' + contact.display);
      const label = el('span', 'ql-contact-info');
      label.appendChild(el('strong', 'ql-contact-name', contact.name));
      label.appendChild(el('span', 'ql-contact-number', contact.display));
      const arrow = el('span', 'ql-contact-icon');
      arrow.innerHTML = icons.arrowUpRight;
      link.appendChild(label);
      link.appendChild(arrow);
      links.appendChild(link);
    });
    body.appendChild(links);
  }

  function mountDialogs() {
    const dialog = el('dialog', 'ql-modal-card');
    dialog.id = 'ql-explore-dialog';
    dialog.setAttribute('aria-labelledby', 'ql-explore-title');
    dialog.innerHTML = '<header class="ql-modal-header"><div class="ql-modal-title-group">'
      + '<h2 class="ql-modal-title" id="ql-explore-title"></h2></div>'
      + '<form method="dialog"><button class="ql-modal-close" type="submit">Tutup</button></form></header>'
      + '<div class="ql-modal-body"></div>';
    document.body.appendChild(dialog);
    const title = get('ql-explore-title');
    const body = dialog.querySelector('.ql-modal-body');
    dialog.addEventListener('close', () => {
      body.replaceChildren();
      if (mobileQuery.matches && !isOpen) focusElement(get('ql-sidebar-toggle'));
    });

    function openDialog(label, renderer) {
      title.textContent = label;
      body.replaceChildren();
      renderer(body);
      if (mobileQuery.matches) setOpen(false, { focus: false });
      dialog.showModal();
    }

    const items = [
      { label: 'Map Lokasi', icon: icons.map, render: showMap },
      { label: 'E-Brosur', icon: icons.brochure, render: showBrochure }
    ];
    if (urlIfSafe(config.videoUrl)) items.push({ label: 'Video Preview', icon: icons.video, render: showVideo });

    items.forEach((item) => {
      const button = el('button', 'ql-explore-item');
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', dialog.id);
      const icon = el('span', 'ql-explore-icon');
      icon.innerHTML = item.icon;
      const arrow = el('span', 'ql-explore-arrow');
      arrow.innerHTML = icons.arrowUpRight;
      button.appendChild(icon);
      button.appendChild(el('span', 'ql-explore-name', item.label));
      button.appendChild(arrow);
      button.addEventListener('click', () => openDialog(item.label, item.render));
      get('ql-explore-links').appendChild(button);
    });

    const cta = get('ql-marketing-cta');
    cta.hidden = !validContacts().length;
    cta.setAttribute('aria-haspopup', 'dialog');
    cta.setAttribute('aria-controls', dialog.id);
    cta.addEventListener('click', () => openDialog('Hubungi Marketing', showContacts));
  }

  function mount() {
    if (get('ql-sidebar-container')) return;

    const backdrop = el('div', 'ql-sidebar-backdrop');
    backdrop.id = 'ql-sidebar-backdrop';
    backdrop.hidden = true;
    backdrop.addEventListener('click', () => setOpen(false, { restoreFocus: true }));
    document.body.appendChild(backdrop);

    const trigger = el('button', 'ql-sidebar-toggle');
    trigger.id = 'ql-sidebar-toggle';
    trigger.type = 'button';
    trigger.setAttribute('aria-controls', 'ql-sidebar-container');
    trigger.innerHTML = icons.menu + '<span>Jelajahi Spot</span>';
    trigger.addEventListener('click', () => setOpen(true));
    document.body.appendChild(trigger);

    root = el('aside', 'ql-sidebar');
    root.id = 'ql-sidebar-container';
    root.setAttribute('aria-label', 'Navigasi virtual tour 360 derajat');
    root.innerHTML = `
      <header class="ql-sidebar-header">
        <div class="ql-brand" aria-label="Atlas Arcadia">
          <span class="ql-brand-kicker">ATLAS</span>
          <span class="ql-brand-name" id="ql-brand-text">ARCADIA</span>
        </div>
        <button class="ql-close-btn" id="ql-collapse-toggle" type="button"
          aria-label="Tutup navigasi" aria-controls="ql-sidebar-container" aria-expanded="true">
          ${icons.close}
        </button>
      </header>
      <nav class="ql-sidebar-nav" aria-label="Daftar panorama">
        <div class="ql-section-head">
          <h2 class="ql-section-title">Explore Locations</h2>
          <span class="ql-section-count" id="ql-total-spots-label">— Spots</span>
        </div>
        <div class="ql-zone-list" id="ql-zone-list">
          <p class="ql-empty-message" id="ql-empty-message">Memuat daftar panorama...</p>
        </div>
        <p id="ql-sidebar-status" class="ql-sr-only" role="status" aria-live="polite">Memuat daftar panorama...</p>
      </nav>
      <footer class="ql-sidebar-footer">
        <div class="ql-explore-links" id="ql-explore-links"></div>
        <button class="ql-marketing-cta" id="ql-marketing-cta" type="button">
          <span class="ql-cta-icon">${icons.whatsapp}</span>
          <span class="ql-cta-label">Hubungi Marketing</span>
          <span class="ql-cta-arrow">${icons.arrowRight}</span>
        </button>
      </footer>`;
    document.body.appendChild(root);

    // Fullscreen in top-right corner
    const fullscreen = el('button', 'ql-control-btn ql-top-fullscreen');
    fullscreen.id = 'ql-btn-fullscreen';
    fullscreen.type = 'button';
    fullscreen.setAttribute('aria-pressed', 'false');
    fullscreen.setAttribute('aria-label', 'Fullscreen');
    fullscreen.title = 'Fullscreen';
    fullscreen.innerHTML = `<span class="ql-control-icon">${icons.fullscreen}</span>`;
    fullscreen.hidden = !document.fullscreenEnabled;
    fullscreen.addEventListener('click', toggleFullscreen);
    document.body.appendChild(fullscreen);

    // Simple panorama controls in bottom-center
    const panoramaControls = el('div', 'ql-panorama-controls');
    panoramaControls.id = 'ql-panorama-controls';
    panoramaControls.setAttribute('role', 'group');
    panoramaControls.setAttribute('aria-label', 'Kontrol panorama');
    panoramaControls.innerHTML = `
      <button id="ql-btn-sound" class="ql-control-btn" type="button" aria-pressed="false" aria-label="Suara" title="Suara"><span class="ql-control-icon">${icons.sound}</span></button>
      <button id="ql-btn-gyro" class="ql-control-btn" type="button" aria-pressed="false" aria-label="Giroskop" title="Giroskop" hidden><span class="ql-control-icon">${icons.gyro}</span></button>`;
    document.body.appendChild(panoramaControls);

    // Official brand logo asset in sidebar menu header
    const logoSrc = config.logoUrl || 'arcadia.logo.png';
    if (logoSrc) {
      const image = el('img', 'ql-brand-image');
      image.alt = brand;
      image.hidden = true;
      image.addEventListener('load', () => {
        image.hidden = false;
        root.classList.add('has-logo');
      });
      image.addEventListener('error', () => image.remove());
      const brandContainer = root.querySelector('.ql-brand');
      if (brandContainer) {
        brandContainer.appendChild(image);
      }
      image.src = logoSrc;
    }

    get('ql-collapse-toggle').addEventListener('click', () => setOpen(false, { restoreFocus: true }));
    get('ql-btn-sound').addEventListener('click', toggleSound);
    get('ql-btn-gyro').addEventListener('click', toggleGyroscope);
    document.addEventListener('fullscreenchange', updateFullscreen);
    document.addEventListener('keydown', onKeydown);
    mobileQuery.addEventListener('change', onViewportChange);
    window.addEventListener('atlas-tour:manifest-ready', renderManifest);
    window.addEventListener('atlas-tour:ready', syncFromTour);
    window.addEventListener('hashchange', syncFromTour);
    mountDialogs();
    setOpen(!mobileQuery.matches, { focus: false });
    renderManifest();
    syncFromTour();

    // 3DVista hotspot navigation does not necessarily emit our custom events.
    // Poll a small bridge state snapshot to keep UI and panorama synchronized.
    setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        if (!currentScenes.length) renderManifest();
        syncFromTour();
      }
    }, 850);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
