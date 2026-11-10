# Audit dan adaptasi 3DVista — Atlas Arcadia

## Ringkasan

Sumber yang dianalisis: `index.htm`, `script.js`, `script_general.js`, `sidebar.js`, `sidebar.css`. Target yang disesuaikan: `index-tour.htm` (dari `index-Tour.htm`), `script-tour.js`, `script_general-tour.js`, `sidebar.js`, `sidebar.css`.

**Fakta sumber:** sumber lama memiliki 2 panorama dan 2 playlist item. Target memiliki **25 panorama**, **25 playlist item** (17 berlabel `Point`, 8 berlabel `Int`), 47 hotspot panorama, dan asset dengan kombinasi JPG/WebP. Label `Point` / `Int` merupakan label asli target; tidak ada pemetaan semantik yang dapat diverifikasi dari berkas yang diberikan menjadi *Entrance*, *Gate*, *Lobby*, *Swimming Pool*, atau fasilitas lainnya. Karena itu, sidebar baru menggunakan label sumber sampai tersedia pemetaan resmi.

**Temuan risiko awal:**

1. `index-Tour.htm` memuat `script.js`, bukan `script-tour.js`, dan tidak memanggil sidebar. Demikian pula `script-tour.js` semula memuat `script_general.js`, bukan `script_general-tour.js`.
2. Sidebar awal menganggap hanya Entrance (indeks 0) dan Gate (indeks 1), serta menyinkronkan ID panorama dari ekspor lama. Pada Tour, indeks tersebut adalah `Point 1 A` dan `Point 2`.
3. Menu fasilitas lama sebagian besar hanya menghasilkan toast 'belum tersedia'. Video Preview memakai tautan demonstrasi tidak relevan; Brosur menunjuk `arcadia.logo.png`, alih-alih file brosur.
4. Ekspor lama membawa Universal Analytics dengan ID yang tertanam dan pola inisialisasi yang tidak konsisten. Integrasi tersebut tidak dipindahkan ke versi Tour. Bila analitik dibutuhkan, implementasikan GA4 dengan consent yang valid.
5. `sidebar.css` semula membatasi accordion poin ke 400px, sehingga daftar 17 poin terpotong.

## Arsitektur setelah adaptasi

```text
index-tour.htm
  ├── lib/tdvplayer.js  (dependensi 3DVista; pertahankan)
  ├── script-tour.js
  │     ├── bootstrap/TDV.Tour (tetap dari ekspor target)
  │     ├── memuat script_general-tour.js
  │     │     ├── 25 panorama + hotspot + playlist asli (dipertahankan)
  │     │     └── AtlasTourManifest (diturunkan dari mainPlayList)
  │     └── AtlasTourBridge (navigasi, status scene, mute)
  ├── sidebar.css
  └── sidebar.js
        ├── Quick View: Point 1 A & Int 1
        ├── Zones: Titik Panorama (17) & Interior (8)
        ├── status sinkron dengan panorama aktif / hotspot
        ├── collapse & responsive mobile
        ├── fullscreen & mute 3DVista
        └── Explore: tampil hanya bila URL resmi dikonfigurasi
```

**Alur:** definisi playlist menjadi satu-satunya sumber indeks. `script_general-tour.js` mengekspor `window.AtlasTourManifest`, sedangkan `script-tour.js` menyediakan `window.AtlasTourBridge`. Sidebar tidak menyalin daftar indeks hard-coded dan mengonfirmasi scene aktif dari API player, termasuk perpindahan melalui hotspot.

## Perubahan per file

- `index-tour.htm`: menggunakan `script-tour.js`, memuat sidebar dan mengisi konfigurasi brand opsional, memperbarui URL OpenGraph/Twitter, mempertahankan seluruh enam preload JPG panorama target beserta 3DVista runtime.
- `script-tour.js`: mengubah `devicesUrl.general` menuju `script_general-tour.js`, menambah event `atlas-tour:ready` / `atlas-tour:ended` dan adapter `AtlasTourBridge`, serta menonaktifkan kode Universal Analytics lama yang tidak memiliki konfigurasi proyek yang tervalidasi.
- `script_general-tour.js`: mempertahankan 240 definisi engine/panorama/hotspot target dan menambahkan blok kecil untuk membangun manifest 25 scene berdasarkan `mainPlayList` secara otomatis; file tetap memanggil `TDV.PlayerAPI.defineScript(script)`.
- `sidebar.js`: membangun UI dari manifest; membuat Quick View, zona accordion, titik navigasi, progress scene aktif, toast bila tur belum siap, collapsed mode, fullscreen, sound, dan menyembunyikan menu Explore sampai URL konten resmi diisi.
- `sidebar.css`: mempertahankan desain dasar dan menambah kompatibilitas menu 25 panorama, accordion 1400px, ikon SVG, tombol aksesibel, fallback logo dan tata letak mobile.
- `scene-manifest.json`: keluaran audit indeks/ID. Tidak dimuat oleh aplikasi; sumber runtime tetap `script_general-tour.js`.

## Pemetaan scene definitif

Indeks berikut **0-based** dan merepresentasikan **urutan playlist**, bukan urutan file panorama maupun urutan ID di `definitions`. Perhatikan bahwa urutan interior tidak mengikuti angka labelnya.

| Indeks | Label asli | Media ID |
|---:|---|---|
| 0 | Point 1 A | `panorama_B8094AE9_B4D3_9F1F_41D0_BBF561CE7761` |
| 1 | Point 2 | `panorama_A68FE6BD_AA14_11BE_41CA_61CA10CD8421` |
| 2 | Point 3 | `panorama_B8C2158C_B553_5805_41C0_D9221818FF6A` |
| 3 | Point 4 | `panorama_BBAB2E76_B570_A802_41C0_05BA8F33B260` |
| 4 | Point 5 | `panorama_A65F62B9_AAAF_A91B_41E5_36B8B6B26B02` |
| 5 | Point 6 | `panorama_B9559573_B657_D311_41E2_4A9B7880EC90` |
| 6 | Point 7 | `panorama_B395CC1A_B976_A25A_419A_1E05DAB0BD84` |
| 7 | Point 8 | `panorama_B78352D2_BA9C_6AF0_41D4_C66127A1D5E5` |
| 8 | Point 9 | `panorama_B7BC5E8D_BA9C_1D50_41E0_5356BE539A67` |
| 9 | Point 10 | `panorama_B6828E17_BB50_D2CB_41C1_F4AC0CC32FB8` |
| 10 | Point 11 | `panorama_B67EE91C_BB51_7EFE_41C1_9656F25D7F9D` |
| 11 | Point 12 | `panorama_B50680D9_BB50_EF46_41D7_C4DFCC6CE678` |
| 12 | Point 13 | `panorama_B69AA859_BB50_BF47_41E5_0EF6B7537875` |
| 13 | Point 14 | `panorama_B6DFEEF3_BB50_F34A_41CA_511D39A0DBD6` |
| 14 | Point 15 | `panorama_B6A45DE1_BB50_B147_41E4_C851BCB1386C` |
| 15 | Point 16 | `panorama_B6DEDEE2_BB4F_7345_41D0_21FADFCC9F81` |
| 16 | Point 17 | `panorama_B6DD44B9_BB4F_D7C7_41D1_97942FDDC550` |
| 17 | Int 8 | `panorama_BDD61C4A_BD84_9035_41CB_228E8E7642EB` |
| 18 | Int 7 | `panorama_BDD6290C_BD84_B04D_41D8_5A63452A8DFB` |
| 19 | Int 6 | `panorama_BDD6342B_BD84_904B_41DC_926B32EA1CBF` |
| 20 | Int 5 | `panorama_BDD63E94_BD84_905D_41C2_1384FE72245D` |
| 21 | Int 4 | `panorama_BDD64947_BD84_F03B_41D0_E507DD81FC2D` |
| 22 | Int 3 | `panorama_BDD653D5_BD84_97DF_41E5_8A02F3488CE6` |
| 23 | Int 1 | `panorama_BDD65E1F_BD84_904B_41E5_40DCFD139045` |
| 24 | Int 2 | `panorama_BDD66892_BD84_B055_41E2_428D9FA3FD1F` |

## Cara deploy

1. Simpan lima file runtime (`index-tour.htm`, `script-tour.js`, `script_general-tour.js`, `sidebar.js`, `sidebar.css`) ke direktori yang sama dengan ekspor Tour asli. Jangan mengganti aset `lib`, `media`, dan `locale` menggunakan aset ekspor 2-panorama.
2. Pastikan folder `lib/`, `media/`, `locale/`, file `socialThumbnail.jpg`, dan aset referensi lainnya tersedia di server. Berkas pendukung tersebut tidak diunggah dalam tugas ini.
3. Akses `https://360plus.id/arcadia-tour/index-tour.htm` bila file diterbitkan di lokasi yang sama dengan metadata HTML. Nama file berbeda huruf besar/kecil di server Linux: `index-Tour.htm` berbeda dari `index-tour.htm`.
4. Logo menggunakan `arcadia.logo.png` (direferensikan sidebar lama). Bila file ini tidak tersedia, label teks brand ditampilkan sebagai fallback.
5. Konfigurasikan dua opsi konten di `index-tour.htm` hanya jika URL benar-benar tersedia:

```js
window.ATLAS_TOUR_CONFIG = {
  brand: 'Atlas Arcadia',
  logoUrl: 'arcadia.logo.png',
  videoUrl: '', // contoh: https://domain-resmi/... (isi URL yang valid)
  brochureUrl: '' // contoh: brosur.pdf (isi jika file tersedia)
};
```

## Pengujian

- `node --check` pada ketiga file JavaScript: **lulus**.
- Evaluasi sumber playlist dalam sandbox Node (fungsi 3DVista dimock): **25 scene**, 17 `points`, 8 `interior`, seluruh scene terhubung ke ID panorama, `defineScript()` tetap dipanggil.
- Uji adapter navigasi sandbox: validasi indeks, klik navigasi, pembacaan scene aktif, pengaturan mute, dan penanganan tour belum dimuat: **lulus**.
- Validasi struktur HTML dan enam preload media panorama; parsing CSS: **lulus**.
- **Batas validasi:** rendering browser sesungguhnya dan kelengkapan panorama/hotspot masih harus dites di server dengan seluruh folder aset 3DVista asli, karena hanya delapan file yang diberikan; uji Chromium headless di lingkungan ini tidak selesai.

## Checklist penerimaan di server

- [ ] Tour memuat `Point 1 A` saat pertama dibuka dan preload hilang setelah siap.
- [ ] Sidebar menampilkan 25 scene dalam dua kategori (17 + 8).
- [ ] Klik `Point 2`, `Point 17`, `Int 1`, dan `Int 8` memindah panorama sesuai label.
- [ ] Navigasi lewat hotspot memperbarui titik aktif di sidebar.
- [ ] Tombol mute mengubah audio engine, termasuk setelah pergantian panorama.
- [ ] Fullscreen dan collapse berfungsi pada desktop maupun mobile.
- [ ] Tidak ada error jaringan untuk `lib`, `media`, `locale`, dan logo (jika dipakai).

## Risiko lanjutan

`AtlasTourBridge` memakai `tour._getRootPlayer()`, yaitu API internal pada engine 3DVista versi v2023.2.12 yang sudah dipakai sidebar lama. Jika engine diekspor ulang dengan versi berbeda, antarmuka tersebut perlu diuji kembali. Manifest dan perubahan pada file hasil ekspor 3DVista dapat tertimpa saat publish ulang, jadi simpan patch/hasil paket adaptasi ini sebagai sumber deploy.
