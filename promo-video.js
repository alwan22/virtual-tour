(function () {
  'use strict';

  var dialog = document.getElementById('promo-video-dialog');
  var video = document.getElementById('promo-video-player');
  var closeButton = document.getElementById('promo-video-close');
  var entrance = null;
  var videoTemplate = video.cloneNode(false);
  var youtubePlayer = null;
  var apiRequested = false;

  function attachYouTubePlayer() {
    if (!dialog.open || youtubePlayer || !window.YT || typeof window.YT.Player !== 'function') return;
    youtubePlayer = new window.YT.Player(video, {
      events: {
        onStateChange: function (event) {
          // Ignore callbacks from a previous opening of the popup.
          if (dialog.open && event.target === youtubePlayer && event.data === window.YT.PlayerState.ENDED) {
            dialog.close();
          }
        }
      }
    });
  }

  function connectYouTubeAPI() {
    if (window.YT && typeof window.YT.Player === 'function') {
      attachYouTubePlayer();
      return;
    }
    if (apiRequested) return;
    apiRequested = true;
    var previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      try {
        if (typeof previousReady === 'function') previousReady();
      } finally {
        attachYouTubePlayer();
      }
    };
    var script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = function () { apiRequested = false; };
    document.head.appendChild(script);
  }

  function openVideo() {
    if (dialog.open) return;
    if (window.AtlasTourBridge) window.AtlasTourBridge.setPromoPlaybackBlocked(true);
    dialog.showModal();
    // Load YouTube only when opened, after the curtain has finished.
    var embedUrl = new URL(video.dataset.src);
    embedUrl.searchParams.set('enablejsapi', '1');
    embedUrl.searchParams.set('origin', location.origin);
    video.src = embedUrl.href;
    connectYouTubeAPI();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof dialog.animate === 'function') {
      // Fade only the card; keep the expensive background blur static.
      entrance = dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 180,
        easing: 'ease-out'
      });
    }
  }

  window.addEventListener('atlas-tour:loading-finished', openVideo, { once: true });
  window.addEventListener('atlas-tour:open-promo', openVideo);

  closeButton.addEventListener('click', function () { dialog.close(); });
  // Keep popup gestures away from the tour's document-level interaction hooks.
  ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup'].forEach(function (type) {
    dialog.addEventListener(type, function (event) { event.stopPropagation(); });
  });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    if (entrance) {
      entrance.cancel();
      entrance = null;
    }
    // Dispose the player and create a fresh iframe for the next opening.
    var previousPlayer = youtubePlayer;
    youtubePlayer = null;
    if (previousPlayer) previousPlayer.destroy();
    video.remove();
    video = videoTemplate.cloneNode(false);
    dialog.appendChild(video);
    if (window.AtlasTourBridge) window.AtlasTourBridge.setPromoPlaybackBlocked(false);
  });
})();
