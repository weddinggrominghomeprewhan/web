/* assets/gallery.js — Masonry (absolute positioning) + vertical infinite scroll, no reshuffle */
(() => {
  // === ตั้งค่าตามโปรเจกต์ (อ้างอิงโครงของคุณเดิม) ===
  const MBASE   = 'manifests';
  const VERSION = '2025-11-06-06'; // bump กันแคช
  const PAGEURL = (p) => `${MBASE}/page_${String(p).padStart(3,'0')}.json?v=${VERSION}`;

  // === สถานะ ===
  let currentPage = 0;
  let isLoading = false;
  let noMore = false;

  // เก็บเมตาของรูปทั้งหมด (รักษาลำดับเดิม)
  /** @type {{thumb:string, full:string, caption:string, w:number, h:number, ratio:number, el?:HTMLElement, width?:number, height?:number, left?:number, top?:number}[]} */
  const ITEMS = [];

  // === DOM ===
  const $gallery = document.getElementById('gallery');
  const $loader  = document.getElementById('loader');

  // === ตั้งค่า Masonry ===
  const GAP = 16; // ต้องตรงกับ --gap

  function getColumnCount(){
    // อ่านจาก CSS var เป็น default; สามารถปรับสูตรเองได้
    const cssCols = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--col'), 10) || 3;
    return Math.max(1, cssCols);
  }

  function getColumnWidth(containerWidth, colCount, gap){
    return Math.floor((containerWidth - gap * (colCount - 1)) / colCount);
  }

  const escapeAttr = (s='') => String(s).replace(/"/g,'&quot;');

  // สร้าง element สำหรับแต่ละรูปแบบคงที่ (ครั้งเดียว)
  function ensureElement(it){
    if (it.el) return it.el;
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.innerHTML = `
      <a href="${it.full}" data-lightbox="wedding" data-title="${escapeAttr(it.caption)}" aria-label="${escapeAttr(it.caption)}">
        <img src="${it.thumb}" alt="${escapeAttr(it.caption)}" loading="lazy" decoding="async">
      </a>
    `;
    // ถ้าต้องการแคปชันใต้ภาพ (เปิด/ปิดได้)
    // if (it.caption) {
    //   const cap = document.createElement('figcaption');
    //   cap.textContent = it.caption;
    //   fig.appendChild(cap);
    // }
    $gallery.appendChild(fig); // วางไว้ก่อน แต่ยังไม่กำหนดตำแหน่งจนกว่าจะ layout
    it.el = fig;
    return fig;
  }

  // คำนวณตำแหน่ง (absolute masonry): วางทีละภาพลง "คอลัมน์ที่เตี้ยที่สุด"
  function layoutMasonry(){
    const rect = $gallery.getBoundingClientRect();
    const containerW = Math.floor(rect.width || $gallery.clientWidth || document.body.clientWidth);

    const cols = getColumnCount();
    const colW = getColumnWidth(containerW, cols, GAP);

    // ความสูงสะสมของแต่ละคอลัมน์
    const colHeights = new Array(cols).fill(0);

    // กำหนดขนาดและตำแหน่งให้ทุกรูป (ที่โหลดเข้ามาแล้ว)
    for (const it of ITEMS){
      // คำนวณขนาด (ความกว้างคงที่ = colW -> ความสูงตามอัตราส่วน)
      const h = Math.round(colW / it.ratio);

      // หา column ที่เตี้ยสุดตอนนี้
      let targetCol = 0;
      for (let c=1; c<cols; c++){
        if (colHeights[c] < colHeights[targetCol]) targetCol = c;
      }

      const left = (colW + GAP) * targetCol;
      const top  = colHeights[targetCol];

      // เก็บตำแหน่ง/ขนาด
      it.width = colW;
      it.height = h;
      it.left = left;
      it.top = top;

      // อัปเดตความสูงสะสมของคอลัมน์
      colHeights[targetCol] += h + GAP;

      // สร้าง/อัปเดต element
      const el = ensureElement(it);
      el.style.width = `${colW}px`;
      el.style.height = `${h}px`;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }

    // เซ็ตความสูงของคอนเทนเนอร์เป็นค่าสูงสุดของคอลัมน์
    const maxH = Math.max(...colHeights, 0);
    $gallery.style.height = `${maxH}px`;
  }

  // โหลด 1 หน้า (append ต่อท้าย โดยไม่แตะของเดิม -> ของเดิมไม่ขยับ)
  async function loadPage(p){
    if (isLoading || noMore) return;
    isLoading = true;
    $loader.classList.add('show');
    try {
      const res = await fetch(PAGEURL(p), { cache: 'no-store' });
      if (!res.ok) { noMore = true; return; }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { noMore = true; return; }

      // เตรียมเมตา: ใช้ w/h จาก manifest ถ้ามี เพื่อลด CLS
      const promises = data.map((raw) => new Promise((resolve) => {
        const it = {
          thumb: `${raw.thumb}?v=${VERSION}`,
          full : `${raw.full}?v=${VERSION}`,
          caption: raw.caption || '',
          w: raw.w || null,
          h: raw.h || null,
          ratio: null
        };

        if (it.w && it.h){
          it.ratio = it.w / it.h;
          ITEMS.push(it);
          resolve();
        } else {
          // ถ้า manifest ไม่ระบุขนาด ให้โหลด meta ของ thumb เพื่อดึงสัดส่วน
          const img = new Image();
          img.loading = 'eager';
          img.decoding = 'async';
          img.src = it.thumb;
          img.onload = () => {
            it.w = img.naturalWidth  || 800;
            it.h = img.naturalHeight || 600;
            it.ratio = it.w / it.h;
            ITEMS.push(it);
            resolve();
          };
          img.onerror = () => {
            it.w = 800; it.h = 600; it.ratio = it.w / it.h;
            ITEMS.push(it);
            resolve();
          };
        }
      }));

      await Promise.all(promises);

      // คำนวณตำแหน่งใหม่เฉพาะ “รวมทั้งหมด” แล้ววาดทับ (ตำแหน่งของเก่าจะเท่าเดิม เพราะเราคิดแบบสะสมคอลัมน์)
      layoutMasonry();

      currentPage += 1;
    } catch (err) {
      console.error('loadPage error:', err);
    } finally {
      isLoading = false;
      $loader.classList.remove('show');
    }
  }

  // โหลดหน้าแรก
  loadPage(currentPage);

  // Infinite scroll (แนวตั้ง) — ใกล้ล่างค่อยโหลดหน้าใหม่
  function onScroll(){
    if (noMore || isLoading) return;
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 1200);
    if (nearBottom) loadPage(currentPage);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Re-layout เมื่อขนาดหน้าต่างเปลี่ยน
  let rAF = 0;
  function onResize(){
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(layoutMasonry);
  }
  window.addEventListener('resize', onResize, { passive: true });
})();
