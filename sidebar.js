/**
 * Atlas Arcadia — navigasi eksternal untuk ekspor 3DVista.
 * Sumber data: AtlasTourManifest yang diturunkan dari script_general.js.
 * Perubahan panorama cukup dilakukan di sumber ekspor, bukan mengubah indeks sidebar.
 */
(function () {
  'use strict';

  var config = window.ATLAS_TOUR_CONFIG || {};
  var brand = config.brand || 'Atlas Arcadia';
  var zoneLabels = {
    aerial: 'Aerial',
    ground: 'Ground View',
    interior: 'Interior'
  };
  var mobileLayout = window.matchMedia('(max-width: 640px)');
  var icons = {
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 17v3a2 2 0 0 1-2.2 2A19.7 19.7 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 2.1L7.6 10a16 16 0 0 0 6.4 6.4l1.4-1.3a2 2 0 0 1 2.1-.6l2.8.5A2 2 0 0 1 22 17Z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h4l5-4v14l-5-4H3zM16 9c2 2 2 4 0 6m3-9c4 4 4 8 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h4l5-4v14l-5-4H3zM17 9l5 6m0-6-5 6"/></svg>'
  };
  var root;
  var currentScenes = [];
  var expandedGroup = null;
  var isCollapsed = mobileLayout.matches;
  var currentIndex = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }
  function id(name) { return document.getElementById(name); }
  function bridge() { return window.AtlasTourBridge; }
  function urlIfSafe(value) {
    if (!value || typeof value !== 'string') return null;
    try {
      var parsed = new URL(value, document.baseURI);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
    } catch (error) { return null; }
  }
  function notice(message) {
    var toast = id('ql-tour-toast');
    if (!toast) {
      toast = el('div', 'ql-toast-notice');
      toast.id = 'ql-tour-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3800);
  }
  function markCollapsed(collapsed) {
    isCollapsed = !!collapsed;
    root.classList.toggle('is-collapsed', isCollapsed);
    id('ql-sidebar-body').inert = isCollapsed;
    var toggle = id('ql-collapse-toggle');
    toggle.innerHTML = icons.chevron;
    toggle.title = isCollapsed ? 'Buka navigasi' : 'Tutup navigasi';
    toggle.setAttribute('aria-expanded', String(!isCollapsed));
    toggle.setAttribute('aria-label', toggle.title);
  }

  function createNavigationButton(scene) {
    var button = el('button', 'ql-nav-item ql-point-item');
    button.type = 'button';
    button.dataset.mediaIndex = String(scene.index);
    button.dataset.sceneId = scene.id;
    button.title = scene.title;
    var left = el('span', 'ql-item-left');
    var bullet = el('span', 'ql-point-bullet');
    bullet.appendChild(el('span', 'ql-bullet-ring'));
    left.appendChild(bullet);
    left.appendChild(el('span', 'ql-item-label', scene.title));
    button.appendChild(left);
    button.addEventListener('click', function () { go(scene.index); });
    return button;
  }
  function createZone(group, label, scenes) {
    var block = el('section', 'ql-zone-block');
    block.dataset.zoneId = group;
    var header = el('button', 'ql-nav-item ql-zone-header');
    header.type = 'button';
    header.setAttribute('aria-controls', 'ql-zone-' + group);
    var left = el('span', 'ql-item-left');
    var arrow = el('span', 'ql-chevron-left');
    arrow.innerHTML = icons.chevron;
    left.appendChild(arrow);
    left.appendChild(el('span', 'ql-item-label', label));
    header.appendChild(left);
    header.appendChild(el('span', 'ql-zone-badge', String(scenes.length)));
    header.addEventListener('click', function () { setExpandedGroup(expandedGroup === group ? null : group); });
    var points = el('div', 'ql-zone-points');
    points.id = 'ql-zone-' + group;
    scenes.forEach(function (scene) { points.appendChild(createNavigationButton(scene)); });
    block.appendChild(header);
    block.appendChild(points);
    return block;
  }
  function setExpandedGroup(group) {
    expandedGroup = group;
    root.querySelectorAll('.ql-zone-block').forEach(function (block) {
      var open = block.dataset.zoneId === group;
      block.classList.toggle('open', open);
      block.querySelector('.ql-zone-header').setAttribute('aria-expanded', String(open));
      // Inert prevents keyboard navigation into visually hidden accordion points.
      block.querySelector('.ql-zone-points').inert = !open;
    });
  }
  function showVideo(body) {
    var url = urlIfSafe(config.videoUrl);
    var unavailable = 'Video preview belum tersedia.';
    if (!url) {
      body.appendChild(el('p', 'ql-explore-note', unavailable));
      return;
    }
    var video = el('video', 'ql-preview-video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', 'Video Preview Atlas Arcadia');
    video.addEventListener('error', function () {
      if (body.contains(video)) body.replaceChildren(el('p', 'ql-explore-note', unavailable));
    });
    video.src = url;
    body.appendChild(video);
    if (config.videoIsPlaceholder) body.appendChild(el('p', 'ql-explore-note', 'Video sementara. Preview resmi menyusul.'));
  }
  function showMap(body) {
    var url = urlIfSafe(config.mapUrl);
    if (!url) {
      body.appendChild(el('p', 'ql-explore-note', 'Peta lokasi belum tersedia.'));
      return;
    }
    var map = el('iframe', 'ql-location-map');
    map.title = 'Peta lokasi Atlas Arcadia Ledug';
    map.loading = 'lazy';
    map.referrerPolicy = 'strict-origin-when-cross-origin';
    map.allowFullscreen = true;
    map.src = url;
    body.appendChild(map);
  }
  function showBrochure(body) {
    var gallery = el('div', 'ql-brochure-pages');
    (config.brochurePages || []).forEach(function (page) {
      var url = urlIfSafe(page.url);
      if (!url) return;
      var link = el('a', 'ql-brochure-page');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      var image = el('img');
      image.alt = '';
      image.loading = 'lazy';
      image.src = url;
      link.appendChild(el('span', 'ql-brochure-label', page.label));
      link.appendChild(image);
      gallery.appendChild(link);
    });
    var brochureUrl = urlIfSafe(config.brochureUrl);
    if (brochureUrl) {
      var brochure = el('a', 'ql-download-btn', 'Buka brosur digital');
      brochure.href = brochureUrl;
      brochure.target = '_blank';
      brochure.rel = 'noopener noreferrer';
      gallery.appendChild(brochure);
    }
    body.appendChild(gallery.childElementCount ? gallery : el('p', 'ql-explore-note', 'E-Brosur belum tersedia.'));
  }
  function mountExplore() {
    var dialog = el('dialog', 'ql-modal-card');
    dialog.id = 'ql-explore-dialog';
    dialog.setAttribute('aria-labelledby', 'ql-explore-title');
    dialog.innerHTML = '\
      <header class="ql-modal-header">\
        <h2 class="ql-modal-title" id="ql-explore-title"></h2>\
        <form method="dialog"><button class="ql-modal-close" type="submit" autofocus>Tutup</button></form>\
      </header>\
      <div class="ql-modal-body"></div>';
    document.body.appendChild(dialog);
    var title = id('ql-explore-title');
    var body = dialog.querySelector('.ql-modal-body');
    dialog.addEventListener('close', function () { if (!dialog.open) body.replaceChildren(); });

    var explore = id('ql-explore-links');
    [
      ['Video Preview', showVideo],
      ['Map Lokasi', showMap],
      ['E-Brosur', showBrochure]
    ].forEach(function (item) {
      if (item[1] === showVideo && !urlIfSafe(config.videoUrl)) return;
      var button = el('button', 'ql-nav-item ql-explore-item', item[0]);
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', dialog.id);
      button.addEventListener('click', function () {
        title.textContent = item[0];
        body.replaceChildren();
        item[1](body);
        dialog.showModal();
      });
      explore.appendChild(button);
    });
  }
  function mountContacts() {
    var links = id('ql-contact-links');
    (config.marketingContacts || []).forEach(function (contact) {
      var number = contact.number.replace(/\D/g, '').replace(/^0/, '62');
      if (!/^62\d{8,13}$/.test(number)) return;
      var link = el('a', 'ql-nav-item ql-contact-link');
      link.href = 'https://wa.me/' + number;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Buka WhatsApp ' + contact.name + ' ' + contact.number);
      var info = el('span', 'ql-contact-info');
      info.appendChild(el('span', 'ql-contact-name', contact.name));
      info.appendChild(el('span', 'ql-contact-number', contact.number));
      var icon = el('span', 'ql-contact-icon');
      icon.innerHTML = icons.phone;
      link.appendChild(info);
      link.appendChild(icon);
      links.appendChild(link);
    });
    id('ql-contact-section').hidden = !links.childElementCount;
  }
  function renderManifest() {
    var manifest = window.AtlasTourManifest;
    if (!manifest || !Array.isArray(manifest.scenes) || !manifest.scenes.length) return;
    if (currentScenes === manifest.scenes) return;
    currentScenes = manifest.scenes;
    var zones = id('ql-zone-list');
    zones.replaceChildren();
    var groups = Object.keys(zoneLabels);
    groups.forEach(function (group) {
      var scenes = currentScenes.filter(function (scene) { return scene.group === group; });
      if (scenes.length) zones.appendChild(createZone(group, zoneLabels[group], scenes));
    });
    var other = currentScenes.filter(function (scene) { return !groups.includes(scene.group); });
    if (other.length) zones.appendChild(createZone('other', 'Lainnya', other));
    setExpandedGroup(expandedGroup);
    id('ql-sidebar-status').textContent = currentScenes.length + ' panorama tersedia';
    root.classList.add('is-visible');
    syncFromTour();
  }
  function go(index) {
    var api = bridge();
    if (!api || !api.navigateTo(index)) {
      notice('Panorama belum siap. Pastikan data 3DVista berhasil dimuat.');
      return;
    }
    if (mobileLayout.matches) {
      markCollapsed(true);
      id('ql-collapse-toggle').focus({ preventScroll: true });
    }
    // Sinkronisasi definitif dilakukan dari media aktif, bukan dari tombol yang diklik.
    setTimeout(syncFromTour, 200);
  }
  function setActive(index) {
    if (index === currentIndex || index == null) return;
    currentIndex = index;
    root.querySelectorAll('[data-media-index]').forEach(function (button) {
      var active = Number(button.dataset.mediaIndex) === index;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
    var current = currentScenes.find(function (scene) { return scene.index === index; });
    root.querySelectorAll('.ql-zone-block').forEach(function (block) {
      block.classList.toggle('has-active-scene', Boolean(current && block.dataset.zoneId === current.group));
    });
    if (current) {
      if (expandedGroup !== null) setExpandedGroup(current.group);
      id('ql-sidebar-status').textContent = zoneLabels[current.group] + ' · ' + current.title;
    }
  }
  function syncFromTour() {
    var api = bridge();
    if (!api) return;
    if (!currentScenes.length) renderManifest();
    var index = api.getActiveSceneIndex();
    if (index !== null) setActive(index);
    var muted = api.getMuted();
    if (muted !== null) {
      var button = id('ql-btn-sound');
      button.classList.toggle('active', muted);
      button.setAttribute('aria-pressed', String(muted));
      button.querySelector('.ql-control-icon').innerHTML = muted ? icons.mute : icons.sound;
      button.querySelector('.ql-control-label').textContent = muted ? 'Muted' : 'Sound';
    }
  }
  function toggleFullscreen() {
    var action = document.fullscreenElement ? document.exitFullscreen() :
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    if (action && typeof action.catch === 'function') {
      action.catch(function () { notice('Mode fullscreen tidak diizinkan oleh browser.'); });
    }
  }
  function updateFullscreen() {
    var full = !!document.fullscreenElement;
    var button = id('ql-btn-fullscreen');
    button.setAttribute('aria-pressed', String(full));
    button.querySelector('.ql-control-label').textContent = full ? 'Exit' : 'Fullscreen';
  }
  function toggleSound() {
    var api = bridge();
    var muted = api && api.getMuted();
    if (!api || muted === null || !api.setMuted(!muted)) {
      notice('Pengaturan suara belum tersedia sebelum tur dimuat.');
      return;
    }
    syncFromTour();
  }
  function mount() {
    if (id('ql-sidebar-container')) return;
    root = el('aside', 'ql-sidebar');
    root.id = 'ql-sidebar-container';
    root.setAttribute('aria-label', 'Navigasi Virtual Tour');
    root.innerHTML = '\
      <button class="ql-toggle-btn" id="ql-collapse-toggle" type="button" aria-controls="ql-sidebar-body" aria-expanded="true"></button>\
      <header class="ql-sidebar-header">\
        <button class="ql-brand-link" id="ql-brand-btn" type="button" aria-label="Buka navigasi">\
          <span class="ql-brand-text" id="ql-brand-text"></span>\
        </button>\
      </header>\
      <nav class="ql-sidebar-body" id="ql-sidebar-body" aria-label="Daftar panorama">\
        <div class="ql-zone-section">\
          <div class="ql-sub-heading">Spot 360°</div>\
          <div id="ql-zone-list"></div>\
          <p id="ql-sidebar-status" class="ql-tour-status" role="status">Memuat daftar panorama...</p>\
        </div>\
        <div class="ql-explore-section">\
          <div class="ql-sub-heading">Jelajahi</div>\
          <div id="ql-explore-links"></div>\
        </div>\
        <section class="ql-contact-section" id="ql-contact-section" aria-labelledby="ql-contact-heading" hidden>\
          <div class="ql-sub-heading" id="ql-contact-heading">Kontak Marketing · WhatsApp</div>\
          <div class="ql-contact-links" id="ql-contact-links"></div>\
        </section>\
      </nav>\
      <footer class="ql-sidebar-footer">\
        <button class="ql-control-btn" id="ql-btn-fullscreen" type="button" aria-pressed="false">\
          <span class="ql-control-icon"></span><span class="ql-control-label">Fullscreen</span>\
        </button>\
        <button class="ql-control-btn" id="ql-btn-sound" type="button" aria-pressed="false">\
          <span class="ql-control-icon"></span><span class="ql-control-label">Sound</span>\
        </button>\
      </footer>';
    document.body.appendChild(root);
    mountExplore();
    mountContacts();
    id('ql-brand-text').textContent = brand;
    if (config.logoUrl) {
      var image = el('img');
      image.alt = brand;
      image.className = 'ql-brand-img';
      image.hidden = true;
      image.addEventListener('load', function () {
        image.hidden = false;
        root.classList.add('has-logo');
      });
      image.addEventListener('error', function () { image.remove(); });
      id('ql-brand-btn').insertBefore(image, id('ql-brand-text'));
      image.src = config.logoUrl;
    }
    id('ql-btn-sound').querySelector('.ql-control-icon').innerHTML = icons.sound;
    id('ql-btn-fullscreen').querySelector('.ql-control-icon').innerHTML = icons.fullscreen;
    id('ql-collapse-toggle').addEventListener('click', function () { markCollapsed(!isCollapsed); });
    id('ql-brand-btn').addEventListener('click', function () { if (isCollapsed) markCollapsed(false); });
    id('ql-btn-fullscreen').hidden = !document.fullscreenEnabled;
    id('ql-btn-fullscreen').addEventListener('click', toggleFullscreen);
    id('ql-btn-sound').addEventListener('click', toggleSound);
    document.addEventListener('fullscreenchange', updateFullscreen);
    window.addEventListener('atlas-tour:manifest-ready', renderManifest);
    window.addEventListener('atlas-tour:ready', syncFromTour);
    window.addEventListener('hashchange', syncFromTour);
    markCollapsed(isCollapsed);
    renderManifest();
    // Hotspot dapat mengganti panorama tanpa aksi dari sidebar; polling ringan
    // menyelaraskan scene dan mute dengan kondisi player yang sebenarnya.
    setInterval(function () {
      if (document.visibilityState !== 'hidden') {
        if (!currentScenes.length) renderManifest();
        syncFromTour();
      }
    }, 850);

    // Panel tetap informatif ketika aset panorama belum selesai diunduh.
    setTimeout(function () { if (root) root.classList.add('is-visible'); }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
