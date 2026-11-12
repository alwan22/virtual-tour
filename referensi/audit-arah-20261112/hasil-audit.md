# Audit arah navigasi — 12 November 2026

Diperiksa: 27 panorama, 59 tautan navigasi, dan 16 orientasi spot luar ruang pada live map.

Tidak ditemukan pembalikan 180 derajat tambahan setelah koreksi Boulevard B. Tidak ada perubahan kode tambahan pada audit ini.

Metode: tujuan klik dicocokkan dengan playlist dan data panorama bersebelahan; arah balik diperiksa; posisi hotspot (termasuk empat titik sudut) ditinjau pada gambar kubus panorama; arah live map dibandingkan dengan posisi tujuan pada denah.

Hasil:
- Seluruh 59 tujuan klik konsisten dengan data navigasi pendukung dan arah baliknya.
- Pada 38 tautan yang kedua posisinya diketahui, selisih arah terhadap garis lurus denah tidak ada yang mendekati 180 derajat.
- Selisih terbesar: Boulevard Near Park ke Junction B sekitar 58,5 derajat dan arah sebaliknya sekitar 36,4 derajat. Panorama menunjukkan jalan berbelok; hotspot mengikuti ruas jalan lokal. Orientasi map kedua spot juga konsisten terhadap tujuan lain masing-masing (Junction A, Road Near Kost Eksklusif, dan Junction C), sehingga tidak diputar.
- 162 pemeriksaan perilaku live map lulus, meliputi enam sudut pandang per panorama, pergantian spot, serta perlintasan batas -180/180 derajat.
- Interior memakai posisi Clubhouse bersama tanpa orientasi; aerial tidak memiliki posisi atau orientasi. Kursor arah pada keduanya disembunyikan oleh aplikasi. Tidak diklaim telah memverifikasi arah kompas interior/aerial.

Batas pemeriksaan: inspeksi aset panorama dan evaluasi kode lokal dengan antarmuka peta simulasi; bukan uji klik manual di browser atau verifikasi survei lapangan. Posisi denah bersifat perkiraan.

Bukti: data-audit.json, direction-panorama-0.jpg hingga direction-panorama-3.jpg, dan direction-contact-sheet.jpg.
