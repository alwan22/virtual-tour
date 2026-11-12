(function () {
  'use strict';

  var curtain = document.getElementById('preloadContainer');
  var query = new URLSearchParams(location.search);
  if (location.protocol !== 'file:' && Array.from(query.keys()).some(function (key) { return key.toLowerCase() === 'skip-loading'; })) {
    curtain.hidden = true;
    return;
  }

  var value = document.getElementById('tour-preloader-value');
  var line = document.getElementById('tour-preloader-line');
  var fill = document.getElementById('tour-preloader-fill');
  var recovery = document.getElementById('tour-preloader-recovery');
  var progress = 0;
  var recoveryTimer = setTimeout(function () { recovery.hidden = false; }, 45000);

  if (location.protocol === 'file:') {
    clearTimeout(recoveryTimer);
    document.getElementById('tour-preloader-message').textContent =
      'Buka tur melalui server lokal agar panorama dapat dimuat.';
    document.getElementById('tour-preloader-retry').hidden = true;
    value.hidden = line.hidden = true;
    recovery.hidden = false;
    return;
  }

  document.getElementById('tour-preloader-retry').addEventListener('click', function () {
    location.reload();
  });

  function setProgress(percent) {
    progress = percent;
    value.textContent = percent + '%';
    line.setAttribute('aria-valuenow', percent);
    fill.style.transform = 'scaleX(' + percent / 100 + ')';
  }

  function updateProgress(event) {
    if (!Number.isFinite(event.detail)) return;
    var percent = Math.min(99, Math.floor(event.detail));
    if (percent > progress) setProgress(percent);
  }

  function slideUp() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof curtain.animate !== 'function') {
      curtain.hidden = true;
      return;
    }

    var animation = curtain.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
      { duration: 760, easing: 'cubic-bezier(.7, 0, .25, 1)', fill: 'forwards' }
    );
    animation.finished.then(hide, hide);

    function hide() {
      curtain.hidden = true;
      animation.cancel();
    }
  }

  window.addEventListener('atlas-tour:progress', updateProgress);
  window.addEventListener('atlas-tour:ready', function () {
    window.removeEventListener('atlas-tour:progress', updateProgress);
    clearTimeout(recoveryTimer);
    recovery.hidden = true;
    setProgress(100);
    requestAnimationFrame(function () { setTimeout(slideUp, 180); });
  }, { once: true });
})();
