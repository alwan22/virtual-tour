(function () {
  'use strict';

  // [x, y, koreksi yaw] pada denah-live.svg. Posisi perkiraan dari denah
  // dan arah hotspot antarpanorama. ID media tetap berlaku jika playlist diurutkan ulang.
  var exterior = {
    panorama_B8094AE9_B4D3_9F1F_41D0_BBF561CE7761: [1008, 281, 78],
    panorama_A68FE6BD_AA14_11BE_41CA_61CA10CD8421: [963, 271, 5],
    panorama_B8C2158C_B553_5805_41C0_D9221818FF6A: [967, 416, -21],
    panorama_BBAB2E76_B570_A802_41C0_05BA8F33B260: [880, 418, -100],
    panorama_A65F62B9_AAAF_A91B_41E5_36B8B6B26B02: [815, 423, -23],
    panorama_B9559573_B657_D311_41E2_4A9B7880EC90: [822, 544, 23],
    panorama_B395CC1A_B976_A25A_419A_1E05DAB0BD84: [976, 553, -3],
    panorama_B78352D2_BA9C_6AF0_41D4_C66127A1D5E5: [532, 721, 97],
    panorama_B7BC5E8D_BA9C_1D50_41E0_5356BE539A67: [535, 874, 147],
    panorama_B6828E17_BB50_D2CB_41C1_F4AC0CC32FB8: [370, 888, -176],
    panorama_B67EE91C_BB51_7EFE_41C1_9656F25D7F9D: [711, 858, 72],
    panorama_B50680D9_BB50_EF46_41D7_C4DFCC6CE678: [443, 725, 122],
    panorama_B69AA859_BB50_BF47_41E5_0EF6B7537875: [704, 711, -4],
    panorama_B6DFEEF3_BB50_F34A_41CA_511D39A0DBD6: [355, 730, 152],
    panorama_B6A45DE1_BB50_B147_41E4_C851BCB1386C: [650, 550, -79],
    panorama_B6DEDEE2_BB4F_7345_41D0_21FADFCC9F81: [990, 689, 82],
    panorama_B6DD44B9_BB4F_D7C7_41D1_97942FDDC550: [828, 701, -2]
  };
  // Denah kawasan hanya menunjukkan jejak bangunan, jadi arah interior relatif ke panorama.
  var clubhouse = [849, 753, 0];
  var map = document.getElementById('live-map');
  var toggle = document.getElementById('live-map-toggle');
  var content = document.getElementById('live-map-content');
  var marker = document.getElementById('live-map-marker');
  var heading = document.getElementById('live-map-heading');
  var label = document.getElementById('live-map-label');
  var currentId;
  var position;
  var lastHeading = null;

  function update() {
    if (document.hidden) return;
    var bridge = window.AtlasTourBridge;
    var view = bridge && bridge.getPanoramaView();
    if (!view) return;

    if (view.id !== currentId) {
      var scene = bridge.getScenes().find(function (item) { return item.id === view.id; });
      if (!scene) return;
      var inside = scene.group === 'interior';
      position = inside ? clubhouse : exterior[view.id];
      currentId = view.id;
      map.hidden = !position;
      if (position) {
        marker.style.transform = 'translate(' + position[0] + 'px, ' + position[1] + 'px)';
        label.textContent = inside ? 'Clubhouse · ' + scene.title : scene.title;
        label.title = inside ? 'Arah relatif panorama interior' : 'Perkiraan posisi panorama';
      }
    }
    if (!position) return;

    if (!Number.isFinite(view.yaw)) {
      heading.style.visibility = 'hidden';
      lastHeading = null;
      return;
    }

    var angle = Math.round(view.yaw + position[2]);
    if (lastHeading !== null) {
      // Unwrap the angle so crossing ±180° takes the short path.
      angle = lastHeading + (((angle - lastHeading) % 360 + 540) % 360 - 180);
    }
    if (angle !== lastHeading) {
      heading.style.transform = 'rotate(' + angle + 'deg)';
      heading.style.visibility = '';
      lastHeading = angle;
    }
  }

  toggle.addEventListener('click', function () {
    var collapsed = !content.hidden;
    content.hidden = collapsed;
    map.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = collapsed ? 'Buka Denah Live' : 'Ciutkan Denah Live';
  });
  window.addEventListener('atlas-tour:ready', update);
  document.addEventListener('visibilitychange', update);
  setInterval(update, 40);
  update();
})();
