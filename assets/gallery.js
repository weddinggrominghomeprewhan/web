/* Google Photos-like mosaic (mobile smart pairing): 2 cols + full-width rows + smart lookahead to reduce lonely tall rows */
(() => {
  // === Project config (ตามของเดิม) ===
  const MBASE = 'manifests';
  const VERSION = '2025-11-06-11'; // bump กันแคชเมื่อแก้โค้ด/manifest
  const PAGEURL = (p) => `${MBASE}/page_${String(p).padStart(3, '0')}.json?v=${VERSION}`;

  // === State ===
  let currentPage = 0, isLoading = false, noMore = false;
  /** @type {{thumb:string, full:string, caption:string, w?:number, h?:number, ratio:number, el?:HTMLElement}[]} */
  const ITEMS = [];

  // === DOM ===
  const $gallery = document.getElementById('gallery');
  const $loader = document.getElementById('loader');

  // === Layout params ===
  const GAP = () => Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 12);

  // หน้าต่างมองล่วงหน้า (ยอมสลับภายในช่วงนี้เท่านั้น → ไม่กระทบลำดับมาก)
  const WINDOW_SIZE = 8;
  // เกณฑ์รูปแนวนอนยาวที่เหมาะทำ full-width
  const FULL_RATIO = 1.55;
  // ถ้าความสูงสองคอลัมน์ต่างกันน้อยกว่านี้ ให้พิจารณา full-width ก่อน
  const DIFF_OK_FOR_FULL = 120;

  const escapeAttr = (s = '') => String(s).replace(/"/g, '&quot;');

  function ensureEl(it) {
    if (it.el) return it.el;
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.innerHTML = `
      <a href="${it.full}" data-lightbox="wedding" data-title="${escapeAttr(it.caption || '')}">
        <img src="${it.thumb}" alt="${escapeAttr(it.caption || '')}" loading="lazy" decoding="async">
      </a>
       <button class="dl-btn" type="button" aria-label="ดาวน์โหลด" data-url="${it.full}">⇩</button>`
      ;
    $gallery.appendChild(fig);
    it.el = fig;
    return fig;
  }

  function computeCols(W) {
    if (W < 640) return 2;
    if (W < 900) return 3;
    if (W < 1280) return 4;
    return 5;
  }
  function colWidth(W, cols, gap) { return Math.floor((W - gap * (cols - 1)) / cols); }

  // ---------- SMART LAYOUT (มือถือ 2 คอลัมน์) ----------
  function layoutTwoColsSmart(W, gap, wCol) {
    // ความสูงสะสมของคอลัมน์
    const heights = [0, 0];

    // ใช้ดัชนี + เซ็ตเพื่อบอกว่ารูปไหนจัดวางแล้ว
    const used = new Array(ITEMS.length).fill(false);
    let placed = 0;
    const N = ITEMS.length;

    // ฟังก์ชันช่วยเลือก index ของรูปถัดไปในหน้าต่าง [start, start+WINDOW)
    function nextIndicesFrom(start) {
      const idxs = [];
      for (let i = start; i < N && idxs.length < WINDOW_SIZE; i++) {
        if (!used[i]) idxs.push(i);
      }
      return idxs;
    }

    // สร้างฟังก์ชันวาง full-width ตามสัดส่วนจริง (ไม่ครอป)
    function placeFull(index) {
      const it = ITEMS[index];
      const h = Math.round(W / it.ratio);
      const top = Math.max(heights[0], heights[1]);

      const el = ensureEl(it);
      el.classList.add('full'); // ให้ CSS ใช้ object-fit: contain
      el.style.width = `${W}px`;
      el.style.height = `${h}px`;
      el.style.left = `0px`;
      el.style.top = `${top}px`;

      heights[0] = top + h + gap;
      heights[1] = top + h + gap;

      used[index] = true;
      placed++;
    }

    // วางลงคอลัมน์ที่เตี้ยสุด โดยไม่ full-width
    function placeIntoShortest(index) {
      const it = ITEMS[index];
      const col = heights[0] <= heights[1] ? 0 : 1;
      const w = wCol;
      const h = Math.round(w / it.ratio);
      const left = (w + gap) * col;
      const top = heights[col];

      const el = ensureEl(it);
      el.classList.remove('full');
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;

      heights[col] += h + gap;

      used[index] = true;
      placed++;
    }

    // เลือก “ผู้สมัครที่ดีที่สุด” เข้าคอลัมน์ที่เตี้ยสุด เพื่อลดส่วนต่างความสูงให้ต่ำสุด
    function pickBestForShortest(idxs) {
      const shortCol = heights[0] <= heights[1] ? 0 : 1;
      const tallCol = 1 - shortCol;
      let bestIdx = idxs[0];
      let bestScore = Infinity;

      for (const i of idxs) {
        const it = ITEMS[i];
        const h = Math.round(wCol / it.ratio);
        const score = Math.abs((heights[shortCol] + h) - heights[tallCol]); // ยิ่งใกล้ 0 ยิ่งดี
        // ให้ priority กับรูปแนวตั้ง (ช่วยอุดช่องว่าง) เมื่อคะแนนเท่ากัน
        const tieBias = it.ratio < 1 ? -0.5 : 0;
        const finalScore = score + tieBias;
        if (finalScore < bestScore) {
          bestScore = finalScore;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    for (let start = 0; placed < N;) {
      const idxs = nextIndicesFrom(start);
      if (idxs.length === 0) break;

      // 1) ลองหาตัวที่ควรเป็น full-width ก่อน (แนวนอนยาว + คอลัมน์สูงใกล้กัน)
      const diff = Math.abs(heights[0] - heights[1]);
      if (diff < DIFF_OK_FOR_FULL) {
        const candidateFull = idxs.find(i => ITEMS[i].ratio >= FULL_RATIO);
        if (candidateFull !== undefined) {
          placeFull(candidateFull);
          continue;
        }
      }

      // 2) เลือกผู้สมัครที่ “บาลานซ์สองคอลัมน์ดีที่สุด” เข้าคอลัมน์ที่เตี้ย
      const best = pickBestForShortest(idxs);
      placeIntoShortest(best);

      // ถ้า start ถูกใช้ไปแล้ว เพิ่มตัวชี้ให้ขยับหน้าต่าง
      while (start < N && used[start]) start++;
    }

    $gallery.style.height = `${Math.max(...heights, 0)}px`;
  }

  // ---------- LAYOUT MAIN ----------
  function layoutAll() {
    const rect = $gallery.getBoundingClientRect();
    const W = Math.floor(rect.width || $gallery.clientWidth || document.body.clientWidth);
    const gap = GAP();
    const cols = computeCols(W);
    const wCol = colWidth(W, cols, gap);

    if (cols === 2) {
      layoutTwoColsSmart(W, gap, wCol);
      return;
    }

    // จอใหญ่: masonry ปกติ (คอลัมน์ต่ำสุด)
    const heights = new Array(cols).fill(0);
    for (const it of ITEMS) {
      let target = 0;
      for (let c = 1; c < cols; c++) { if (heights[c] < heights[target]) target = c; }
      const w = wCol;
      const h = Math.round(w / it.ratio);
      const left = (w + gap) * target;
      const top = heights[target];

      const el = ensureEl(it);
      el.classList.remove('full');
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;

      heights[target] += h + gap;
    }
    $gallery.style.height = `${Math.max(...heights, 0)}px`;
  }

  // ---------- Loading ----------
  async function loadPage(p) {
    if (isLoading || noMore) return;
    isLoading = true; $loader.classList.add('show');
    try {
      const res = await fetch(PAGEURL(p), { cache: 'no-store' });
      if (!res.ok) { noMore = true; return; }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { noMore = true; return; }

      const metas = await Promise.all(data.map(raw => new Promise((resolve) => {
        const it = {
          thumb: `${raw.thumb}?v=${VERSION}`,
          full: `${raw.full}?v=${VERSION}`,
          caption: raw.caption || '',
          w: raw.w || null,
          h: raw.h || null,
          ratio: null
        };
        if (it.w && it.h) { it.ratio = it.w / it.h; resolve(it); }
        else {
          const img = new Image();
          img.loading = 'eager'; img.decoding = 'async'; img.src = it.thumb;
          img.onload = () => { it.w = img.naturalWidth || 800; it.h = img.naturalHeight || 600; it.ratio = it.w / it.h; resolve(it); };
          img.onerror = () => { it.w = 800; it.h = 600; it.ratio = it.w / it.h; resolve(it); };
        }
      })));

      metas.forEach(m => ITEMS.push(m));
      layoutAll();
      currentPage += 1;
    } finally {
      isLoading = false; $loader.classList.remove('show');
    }
  }

  // ---------- Init ----------
  loadPage(currentPage);

  function onScroll() {
    if (noMore || isLoading) return;
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 1000);
    if (nearBottom) loadPage(currentPage);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  let rAF = 0;
  function schedule() { cancelAnimationFrame(rAF); rAF = requestAnimationFrame(layoutAll); }
  window.addEventListener('resize', schedule, { passive: true });
})();








