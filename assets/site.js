// ===== Global constants =====
const OFFICIAL_URL = 'https://www.isotonix.com/buy/product/isotonix-opc-3/?id=2217&idType=product';
const POSTS_JSON_URL = '/blog/posts.json';

// ===== Helpers: week math + formatting =====
function getIsoWeek(d = new Date()){
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
function startOfWeek(date = new Date()){ // Monday
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}
function fmtDate(d){
  return d.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'2-digit'});
}

// ===== Enforce the exact official URL on all CTAs =====
function enforceOfficialLinks(){
  document.querySelectorAll('a.cta, a.official-link').forEach(a => {
    a.href = OFFICIAL_URL;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
  });
}

// ===== Try to load posts.json; fall back to scanning week-XX pages =====
async function loadPosts(){
  // Preferred: JSON manifest if present
  try{
    const r = await fetch(POSTS_JSON_URL, { cache: 'no-store' });
    if (r.ok) {
      const arr = await r.json();
      if (Array.isArray(arr) && arr.length) return arr;
    }
  }catch(e){
    console.info('posts.json not available, using fallback');
  }

  // Fallback: synthesize from existing week pages by fetching a few
  const slugs = Array.from({length:52}, (_,i)=>`week-${String(i+1).padStart(2,'0')}.html`);
  const start = getIsoWeek() % slugs.length;
  const sample = [];
  for(let i=0;i<8;i++) sample.push(slugs[(start+i)%slugs.length]); // fetch a handful

  const metas = (await Promise.all(sample.map(s => fetchPostMeta(`/blog/${s}`)))).filter(Boolean);
  if (metas.length) return metas;

  // Last resort: generic titles
  return slugs.map(s => ({ slug: s, title: s.replace('.html','').replace('week-','Week '), excerpt: '' }));
}

async function fetchPostMeta(path){
  try{
    const res = await fetch(path, { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = (doc.querySelector('h1')?.textContent || doc.querySelector('title')?.textContent || path).trim();
    const desc = (doc.querySelector('meta[name="description"]')?.getAttribute('content') || doc.querySelector('p')?.textContent || '').trim();
    const excerpt = desc ? desc.slice(0,180).replace(/\s+\S*$/, '…') : '';
    return { slug: path.replace(/^\/?blog\//,''), title, excerpt };
  }catch(err){
    console.warn('fetchPostMeta failed:', path, err);
    return null;
  }
}

// ===== Render 4 fresh-looking cards =====
async function renderCards(count=4){
  const wrap = document.getElementById('blog-cards');
  const updated = document.getElementById('blog-updated');
  if(!wrap) return;

  const posts = await loadPosts();
  const start = getIsoWeek() % posts.length;
  const picks = Array.from({length:count}, (_,i)=> posts[(start + i) % posts.length]);

  const monday = startOfWeek(new Date());
  const labels = ['This week','Last week','2 wks ago','3 wks ago','4 wks ago'];

  wrap.innerHTML = picks.map((p,i)=>`
    <article class="card">
      <h4><a class="link" href="/blog/${p.slug}">${p.title}</a></h4>
      <p class="note"><time aria-label="Post timing">${labels[i] || fmtDate(new Date(monday.getTime() - i*7*86400000))}</time></p>
      <p>${p.excerpt || ''}</p>
      <p><a class="btn btn-secondary" href="/blog/${p.slug}">Read</a></p>
    </article>
  `).join('');

  if (updated) updated.textContent = 'Updated ' + fmtDate(new Date());

  if (window.gtag) {
    gtag('event','view_item_list',{items:picks.map(x=>({item_name:x.title}))});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  enforceOfficialLinks();
  renderCards(4);
});
