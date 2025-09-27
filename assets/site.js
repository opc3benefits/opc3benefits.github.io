// Fresh weekly cards + full-archive links
const POSTS_JSON_URL = '/blog/posts.json';

function getIsoWeek(d=new Date()){
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
function startOfWeek(date=new Date()){ // Monday
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}
function fmtDate(d){
  return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'});
}

async function renderCards(count=4){
  const wrap = document.getElementById('blog-cards');
  const updated = document.getElementById('blog-updated');
  if(!wrap) return;

  try{
    const res = await fetch(POSTS_JSON_URL, {cache:'no-store'});
    const posts = await res.json();

    // rotate starting point so the set changes week-to-week
    const weekIndex = getIsoWeek() % posts.length;
    const picksIdx = Array.from({length:count}, (_,i) => (weekIndex + i) % posts.length);

    // Fresh-looking labels relative to *today*
    const monday = startOfWeek(new Date());
    const labels = ['This week','Last week','2 wks ago','3 wks ago','4 wks ago'];

    const html = picksIdx.map((idx,i) => {
      const p = posts[idx];
      const displayDate = i < labels.length
        ? labels[i]
        : fmtDate(new Date(monday.getTime() - i*7*86400000));
      return `
        <article class="card">
          <h4><a class="link" href="/blog/${p.slug}">${p.title}</a></h4>
          <p class="note"><time aria-label="Post timing">${displayDate}</time></p>
          <p>${p.excerpt}</p>
          <p><a class="btn btn-secondary" href="/blog/${p.slug}">Read</a></p>
        </article>
      `;
    }).join('');

    wrap.innerHTML = html;
    if (updated) updated.textContent = 'Updated ' + fmtDate(new Date());

    // simple GA event if available
    if (window.gtag) {
      const picks = picksIdx.map(i => posts[i].title);
      gtag('event','view_item_list',{items:picks.map(t=>({item_name:t}))});
    }

  }catch(err){
    wrap.innerHTML = '<p class="note">Blog posts are loading…</p>';
    console.error('posts.json error', err);
  }
}

document.addEventListener('DOMContentLoaded', () => renderCards(4));
