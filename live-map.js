(function () {
  'use strict';

  // [x, y, koreksi yaw] dari denah referensi, dicocokkan dengan gambar panorama.
  // ID media tetap berlaku jika playlist diurutkan ulang.
  var exterior = {
    panorama_D231ED8B_C350_6ABB_41E2_5BD236FEE108: [1008, 281, 78],
    panorama_D3A46579_C330_7A67_41E3_32A506968BD8: [963, 271, 5],
    panorama_D00CF0D2_C351_FAA5_41C4_B4B394FEA783: [967, 416, -21],
    panorama_D0CF9223_C330_B9EB_41D3_04C0498C7725: [815, 423, -23],
    panorama_D73F4122_C3F0_7BE5_41E1_C8423B04CA07: [822, 544, 23],
    panorama_D61FF245_C370_59AF_41E4_4F9B77D44204: [976, 553, -3],
    panorama_C9A24A47_C47C_FDEC_41DA_811C8EC63CE9: [532, 721, 97],
    panorama_B7BC5E8D_BA9C_1D50_41E0_5356BE539A67: [535, 874, 147],
    panorama_B6828E17_BB50_D2CB_41C1_F4AC0CC32FB8: [370, 888, -176],
    panorama_B67EE91C_BB51_7EFE_41C1_9656F25D7F9D: [711, 858, 72],
    panorama_B50680D9_BB50_EF46_41D7_C4DFCC6CE678: [443, 725, 122],
    panorama_B69AA859_BB50_BF47_41E5_0EF6B7537875: [704, 711, -4],
    panorama_D410B54F_C373_DBBB_41E0_65D6E2677004: [828, 701, -2],
    // Panorama ini diputar 180° dibandingkan gambar referensi.
    panorama_D5607026_C493_2DAC_41CF_282947461FEE: [650, 550, 101],
    panorama_D17C6699_C4EF_5564_41E6_3541207B1453: [355, 730, 152],
    panorama_D218CCB6_C4AD_36AC_41D1_1361951BE8E8: [990, 689, 82]
  };
  // Denah kawasan menunjukkan jejak Clubhouse, termasuk Mini Market.
  var clubhouse = [849, 753];
  var clubhouseEntrance = 'panorama_BDD65E1F_BD84_904B_41E5_40DCFD139045';
  // Geser tombol yang berdekatan agar mudah disentuh. Garis tetap menunjuk ke posisi denah.
  var pinOffsets = {
    panorama_D231ED8B_C350_6ABB_41E2_5BD236FEE108: [65, 0],
    panorama_D3A46579_C330_7A67_41E3_32A506968BD8: [-45, 0],
    panorama_C9A24A47_C47C_FDEC_41DA_811C8EC63CE9: [30, 0],
    panorama_D410B54F_C373_DBBB_41E0_65D6E2677004: [0, -30],
    panorama_D17C6699_C4EF_5564_41E6_3541207B1453: [-35, 0],
    panorama_BDD65E1F_BD84_904B_41E5_40DCFD139045: [0, 82]
  };
  var map = document.getElementById('live-map');
  var toggle = document.getElementById('live-map-toggle');
  var content = document.getElementById('live-map-content');
  var marker = document.getElementById('live-map-marker');
  var heading = document.getElementById('live-map-heading');
  var label = document.getElementById('live-map-label');
  var detail = document.getElementById('live-map-detail');
  var plan = document.getElementById('live-map-plan');
  var guides = document.getElementById('live-map-guides');
  var destinations = document.getElementById('live-map-destinations');
  var jump = document.getElementById('live-map-jump');
  var select = document.getElementById('live-map-jump-scene');
  var feedback = document.getElementById('live-map-feedback');
  var currentId;
  var position;
  var lastHeading = null;

  function navigate(sceneIndex) {
    var bridge = window.AtlasTourBridge;
    feedback.textContent = '';
    if (bridge && bridge.navigateTo(sceneIndex)) return true;
    feedback.textContent = 'Spot belum bisa dibuka. Coba lagi.';
    return false;
  }

  function addPin(scene, coordinates) {
    var x = coordinates[0];
    var y = coordinates[1];
    var offset = pinOffsets[scene.id];
    if (offset) {
      var line = document.createElementNS(plan.namespaceURI, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', y);
      x += offset[0];
      y += offset[1];
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      guides.appendChild(line);
    }

    var bounds = plan.viewBox.baseVal;
    var pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'live-map-destination';
    pin.dataset.sceneId = scene.id;
    pin.title = scene.title;
    pin.setAttribute('aria-label', 'Pindah ke ' + scene.title);
    pin.style.left = ((x - bounds.x) / bounds.width * 100) + '%';
    pin.style.top = ((y - bounds.y) / bounds.height * 100) + '%';
    pin.addEventListener('click', function () { navigate(scene.index); });
    destinations.appendChild(pin);
  }

  function renderDestinations() {
    var bridge = window.AtlasTourBridge;
    var scenes = bridge && bridge.getScenes();
    if (!scenes || !scenes.length || destinations.childElementCount) return;

    scenes.forEach(function (scene) {
      var coordinates = scene.id === clubhouseEntrance ? clubhouse : exterior[scene.id];
      if (coordinates) addPin(scene, coordinates);
    });
    [['interior', 'Interior'], ['aerial', 'Aerial']].forEach(function (group) {
      var options = document.createElement('optgroup');
      options.label = group[1];
      scenes.filter(function (scene) { return scene.group === group[0]; }).forEach(function (scene) {
        var option = document.createElement('option');
        option.value = scene.index;
        option.textContent = scene.title;
        options.appendChild(option);
      });
      select.appendChild(options);
    });
  }

  function update() {
    if (document.hidden) return;
    var bridge = window.AtlasTourBridge;
    var view = bridge && bridge.getPanoramaView();
    if (!view || (content.hidden && currentId === view.id)) return;

    if (view.id !== currentId) {
      var scene = bridge.getScenes().find(function (item) { return item.id === view.id; });
      if (!scene) return;
      position = scene.group === 'interior' ? clubhouse : exterior[scene.id];
      currentId = view.id;
      map.hidden = false;
      marker.setAttribute('visibility', position ? 'visible' : 'hidden');
      lastHeading = null;
      label.textContent = scene.title;
      feedback.textContent = '';
      destinations.querySelectorAll('button').forEach(function (pin) {
        if (pin.dataset.sceneId === currentId) pin.setAttribute('aria-current', 'location');
        else pin.removeAttribute('aria-current');
      });
      switch (scene.group) {
        case 'interior':
          detail.textContent = 'Interior · Penanda gedung Clubhouse';
          break;
        case 'aerial':
          detail.textContent = 'Tampilan udara · Denah kawasan';
          break;
        default:
          detail.textContent = position ? 'Ground View · Perkiraan posisi' : 'Posisi belum dipetakan';
      }
      if (position) {
        marker.style.transform = 'translate(' + position[0] + 'px, ' + position[1] + 'px)';
      }
    }
    var hasHeading = position && Number.isFinite(position[2]) && Number.isFinite(view.yaw);
    heading.style.visibility = hasHeading ? 'visible' : 'hidden';
    if (!hasHeading) return;

    var angle = Math.round(view.yaw + position[2]);
    if (lastHeading !== null) {
      // Unwrap the angle so crossing ±180° takes the short path.
      angle = lastHeading + (((angle - lastHeading) % 360 + 540) % 360 - 180);
    }
    if (angle !== lastHeading) {
      heading.style.transform = 'rotate(' + angle + 'deg)';
      lastHeading = angle;
    }
  }

  function setCollapsed(collapsed) {
    content.hidden = collapsed;
    map.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = collapsed ? 'Buka Peta Live' : 'Ciutkan Peta Live';
    if (!collapsed) update();
  }
  renderDestinations();
  setCollapsed(window.matchMedia('(max-width: 640px)').matches);
  toggle.addEventListener('click', function () { setCollapsed(!content.hidden); });
  jump.addEventListener('submit', function (event) {
    event.preventDefault();
    if (select.value !== '' && navigate(Number(select.value))) jump.reset();
  });
  window.addEventListener('atlas-tour:manifest-ready', renderDestinations);
  window.addEventListener('atlas-tour:ready', update);
  document.addEventListener('visibilitychange', update);
  setInterval(update, 80);
  update();
})();
