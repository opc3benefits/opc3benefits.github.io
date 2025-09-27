
const POSTS_JSON_URL = '/blog/posts.json';
function getIsoWeek(d=new Date()){d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-yearStart)/86400000)+1)/7);}
async function renderCards(count=4){
  const wrap=document.getElementById('blog-cards'); if(!wrap) return;
  try{const res=await fetch(POSTS_JSON_URL,{cache:'no-store'}); const posts=await res.json();
    const total=posts.length; const idx=getIsoWeek()%total; const picks=[]; for(let i=0;i<count;i++) picks.push(posts[(idx+i)%total]);
    wrap.innerHTML=picks.map(p=>`<article class="card"><h4><a class="link" href="/blog/${p.slug}">${p.title}</a></h4><p class="note">${p.date}</p><p>${p.excerpt}</p><p><a class="cta" href="/blog/${p.slug}">Read</a></p></article>`).join('');
    if(window.gtag) gtag('event','view_item_list',{items:picks.map(p=>({item_name:p.title}))});
  }catch(e){wrap.innerHTML='<p class="note">Blog posts are loading…</p>';console.error(e);}
}
document.addEventListener('DOMContentLoaded',()=>renderCards(4));
