/* assets/gallery.js — simple infinite loader (no search, no tag filter) */
(() => {
  // === ปรับตามโปรเจกต์ ===
  const MBASE   = 'manifests';          // โฟลเดอร์ที่เก็บ page_000.json, page_001.json, ...
  const VERSION = '2025-11-06-02';      // เปลี่ยนเลขนี้ทุกครั้งที่แก้ manifest เพื่อกันแคช
  const PAGEURL = (p) => `${MBASE}/page_${String(p).padStart(3,'0')}.json?v=${VERSION}`;

  // === สถานะ ===
  let currentPage = 0;
  let isLoading = false;
  let noMore = false;

  // === DOM ===
  const $gallery = document.getElementById('gallery');
  const $loader  = document.getElementById('loader');

  // === ช่วยเรนเดอร์รูปใหม่เพิ่มเข้าไป (append) ===
  const escapeAttr = (s='') => String(s).replace(/"/g,'&quot;');
  function appendItems(items){
    const frag = document.createDocumentFragment();
    for (const item of items){
      const cap   = item.caption || '';
      const full  = `${item.full}?v=${VERSION}`;
      const thumb = `${item.thumb}?v=${VERSION}`;
      const fig = document.createElement('figure');
      fig.innerHTML = `
        <a href="${full}" data-lightbox="wedding" data-title="${escapeAttr(cap)}">
          <img src="${thumb}" alt="${escapeAttr(cap)}" loading="lazy">
        </a>
        
      `;
      {/* <figcaption>${cap}</figcaption> */}
      frag.appendChild(fig);
    }
    $gallery.appendChild(frag);
  }

  async function loadPage(p){
    if (isLoading || noMore) return;
    isLoading = true;
    $loader.classList.add('show');
    try {
      const res = await fetch(PAGEURL(p), { cache: 'no-store' });
      if (!res.ok) { noMore = true; return; }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { noMore = true; return; }
      appendItems(data);
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

  // Infinite scroll
  function onScroll(){
    if (noMore || isLoading) return;
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 1200);
    if (nearBottom) loadPage(currentPage);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
