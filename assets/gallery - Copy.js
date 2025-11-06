// Wedding gallery loader with pagination + Masonry + Lightbox2
const MBASE = 'manifests';
let page = 0;
let items = [];
let currentFilter = 'all';
let q = '';
let loading = false;
const gallery = document.getElementById('gallery');
const search = document.getElementById('search');
const chips = document.querySelectorAll('.chip');
const loader = document.getElementById('loader');

function card(item){
  const fig = document.createElement('figure');
  fig.dataset.tags = (item.tags||[]).join(',');
  const cap = (item.caption||'');
  fig.innerHTML = `
    <a href="${item.full}" data-lightbox="wedding" data-title="${cap.replace(/"/g,'&quot;')} ${item.tags.map(t=>`#${t}`).join(' ')}">
      <img src="${item.thumb}" alt="${cap.replace(/"/g,'&quot;')}" loading="lazy">
    </a>
    <figcaption>${cap} · ${item.tags.map(t=>`#${t}`).join(' ')}</figcaption>`;
  return fig;
}
function passFilter(it){
  const tags = (it.tags||[]).map(t=>t.toLowerCase());
  const text = ((it.caption||'')+' '+tags.join(' ')).toLowerCase();
  const okF = currentFilter==='all' || tags.includes(currentFilter);
  const okQ = !q || text.includes(q);
  return okF && okQ;
}
function render(){
  gallery.innerHTML = '';
  items.filter(passFilter).forEach(it => gallery.appendChild(card(it)));
}
function setFilter(f){ currentFilter = f; render(); }
function setQuery(v){ q = (v||'').trim().toLowerCase(); render(); }

async function loadPage(p){
  if(loading) return false;
  loading = true; loader.classList.add('show');
  const url = `${MBASE}/page_${String(p).padStart(3,'0')}.json`;
  try{
    const res = await fetch(url, {cache:'force-cache'});
    if(!res.ok) return false;
    const list = await res.json();
    if(!Array.isArray(list) || list.length===0) return false;
    items = items.concat(list);
    return true;
  }catch(_){ return false; }
  finally{ loading=false; loader.classList.remove('show'); }
}
async function maybeLoadMore(){
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 900;
  if(nearBottom){
    const ok = await loadPage(page);
    if(ok){ page++; render(); } else { window.removeEventListener('scroll', onScroll); }
  }
}
function onScroll(){ maybeLoadMore(); }

chips.forEach(c=>c.addEventListener('click',()=>{
  chips.forEach(x=>x.classList.remove('active'));
  c.classList.add('active');
  setFilter(c.dataset.filter);
}));
search.addEventListener('input', e=> setQuery(e.target.value));

(async()=>{
  await loadPage(page); page++;
  await loadPage(page); page++;
  render();
  window.addEventListener('scroll', onScroll, {passive:true});
})();
