const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const csv = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);

const slug = decodeURIComponent(location.pathname.split('/')[2] || '');
const fromLink = new URLSearchParams(location.search).get('key');
if (fromLink) { localStorage.setItem('key:' + slug, fromLink); history.replaceState(null, '', location.pathname); }
let key = localStorage.getItem('key:' + slug) || '';
const state = { p: null, entries: [], can: false, tag: 'All', q: '' };

const api = (u, o = {}) => fetch(`/api/p/${encodeURIComponent(slug)}${u}`, { ...o, headers: { 'x-edit-key': key, ...(o.headers || {}) } });
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2600); }
addEventListener('error', e => console.error(e.message));

/* theme */
$('#theme-btn').addEventListener('click', () => {
  const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = n; localStorage.setItem('theme', n);
});

/* reveal: only hide what we can later show, so a JS problem never leaves a blank page */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
function watch() {
  $$('.reveal:not(.in):not(.pre)').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * .95) el.classList.add('in');
    else { el.classList.add('pre'); io.observe(el); }
  });
}

/* nav */
addEventListener('scroll', () => {
  $('#nav').classList.toggle('stuck', scrollY > 10);
  const h = document.documentElement;
  $('#progress').style.width = (scrollY / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 + '%';
});
$('#burger').addEventListener('click', () => $('#links').classList.toggle('open'));
$('#links').addEventListener('click', () => $('#links').classList.remove('open'));
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) $$('.links a').forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

/* load */
async function load() {
  const res = await api('');
  if (!res.ok) { document.body.innerHTML = '<main class="wrap sec"><h1>Portfolio not found</h1><p class="mute">This address does not exist yet.</p><p><a class="btn solid" href="/">Back to Folio</a></p></main>'; return; }
  const d = await res.json();
  state.p = d.profile; state.entries = d.entries; state.can = d.canEdit;
  if (d.editKey) { key = d.editKey; localStorage.setItem('key:' + slug, key); }
  paint(); render();
}

function setAccent(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const ink = (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1a1a1a' : '#ffffff';
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-ink', ink);
}

let roleTimer;
function paint() {
  const p = state.p;
  document.title = `${p.name} | Portfolio`;
  $('#meta-desc').content = p.headline || `Portfolio of ${p.name}`;
  setAccent(p.accent);
  $('#logo').innerHTML = `${esc(p.name.split(' ')[0].toLowerCase())}<span>.</span>`;
  $('#h-name').textContent = p.name;
  $('#foot-name').textContent = p.name;
  $('#year').textContent = new Date().getFullYear();
  $('#lead').textContent = p.headline;
  $('#status').classList.toggle('hidden', !p.status);
  $('#status-text').textContent = p.status;
  const rb = $('#resume-btn'); rb.classList.toggle('hidden', !p.resume_url); if (p.resume_url) rb.href = p.resume_url;

  const av = $('#avatar');
  av.textContent = p.avatar_url ? '' : p.name[0].toUpperCase();
  av.style.backgroundImage = p.avatar_url ? `url('${p.avatar_url}')` : '';
  const facts = [['Based in', p.location], ['Interests', csv(p.roles).join(', ')], ['Email', p.email]].filter(f => f[1]);
  $('#facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('') || '<div><dt>Profile</dt><dd>Add details with Edit profile</dd></div>';
  $('#socials').innerHTML = [['GitHub', p.github], ['LinkedIn', p.linkedin], ['Website', p.website]].filter(s => s[1]).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${k}</a>`).join('');
  $('#bio').innerHTML = (p.bio || (state.can ? 'Use Edit profile to tell visitors about yourself.' : '')).split('\n').filter(Boolean).map(x => `<p class="mute" style="margin-bottom:1rem">${esc(x)}</p>`).join('');
  $('#mail-line').textContent = p.email;

  const roles = csv(p.roles).length ? csv(p.roles) : ['things worth sharing'];
  const el = $('#role'); let i = 0; el.textContent = roles[0]; el.style.transition = 'opacity .3s';
  clearInterval(roleTimer);
  if (roles.length > 1) roleTimer = setInterval(() => { el.style.opacity = 0; setTimeout(() => { i = (i + 1) % roles.length; el.textContent = roles[i]; el.style.opacity = 1; }, 300); }, 2600);
  $('#edit-bar').classList.toggle('hidden', !state.can);
}

const by = c => state.entries.filter(e => e.category === c);
const ctl = id => state.can ? `<div class="admin-row"><button class="btn ghost small" data-edit="${id}">Edit</button><button class="btn ghost small danger" data-del="${id}">Delete</button></div>` : '';

function render() {
  renderStats(); renderProjects(); renderSkills(); renderTimeline(); renderCerts();
  const counts = { work: by('Project').length, skills: by('Skill').length, journey: by('Milestone').length + by('Achievement').length, certs: by('Certificate').length };
  Object.entries(counts).forEach(([id, n]) => {
    const show = n > 0 || state.can;
    $('#' + id).classList.toggle('hidden', !show);
    $(`.links a[data-sec="${id}"]`).classList.toggle('hidden', !show);
  });
  watch();
}

function renderStats() {
  const items = [[by('Project').length, 'Projects'], [by('Skill').length, 'Skills'], [by('Certificate').length, 'Certificates'], [by('Achievement').length + by('Milestone').length, 'Milestones']].filter(i => i[0] > 0);
  $('#stats').innerHTML = items.map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');
}

function renderProjects() {
  const all = by('Project');
  const tags = ['All', ...new Set(all.flatMap(p => csv(p.tags)))];
  $('#chips').innerHTML = tags.length > 1 ? tags.map(t => `<button class="${t === state.tag ? 'on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('') : '';
  const q = state.q.toLowerCase();
  const list = all.filter(p => (state.tag === 'All' || csv(p.tags).includes(state.tag)) && (p.title + p.description + p.tags).toLowerCase().includes(q));
  $('#projects').innerHTML = list.length ? list.map(p => `
    <article class="proj reveal">
      <div class="cover" ${p.image_url ? `style="background-image:url('${esc(p.image_url)}')"` : ''}>${p.image_url ? '' : esc(p.title[0])}</div>
      <div class="body">
        <h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
        <div class="tags">${csv(p.tags).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="meta"><span class="mono">${esc(p.date)}</span>${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">View project →</a>` : ''}</div>
        ${ctl(p.id)}
      </div></article>`).join('') : `<p class="empty">${all.length ? 'No projects match that search.' : 'No projects yet. Use Add entry below.'}</p>`;
}

function renderSkills() {
  const s = by('Skill').sort((a, b) => b.level - a.level);
  $('#skill-list').innerHTML = s.length ? s.map(k => `
    <div class="skill reveal"><div class="top"><b>${esc(k.title)}</b><span>${k.level}%</span></div>
      <div class="bar"><i style="--w:${k.level}%"></i></div><small>${esc(k.description)}</small> ${ctl(k.id)}</div>`).join('') : '<p class="empty">No skills yet. Use Add entry below.</p>';
  // animate bars after paint
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.skill').forEach(x => x.classList.add('in'))));
}

function renderTimeline() {
  const t = [...by('Milestone'), ...by('Achievement')].sort((a, b) => b.date.localeCompare(a.date));
  $('#timeline').innerHTML = t.length ? t.map(m => `
    <li class="reveal"><span class="when">${esc(m.date)}</span>
      <h3>${esc(m.title)}<span class="kind">${esc(m.category)}</span></h3><p>${esc(m.description)}</p>
      ${m.link ? `<a href="${esc(m.link)}" target="_blank" rel="noopener">Learn more →</a>` : ''}${ctl(m.id)}</li>`).join('') : '<p class="empty">Nothing here yet. Use Add entry below.</p>';
}

function renderCerts() {
  const c = by('Certificate');
  $('#cert-list').innerHTML = c.length ? c.map(x => `
    <div class="cert reveal" ${x.image_url ? `data-img="${esc(x.image_url)}"` : ''}>
      ${x.image_url ? `<img src="${esc(x.image_url)}" alt="${esc(x.title)}" loading="lazy" />` : ''}
      <div><h3>${esc(x.title)}</h3><small>${esc(x.description)} ${esc(x.date)}</small>${ctl(x.id)}</div></div>`).join('') : '<p class="empty">No certificates yet. Use Add entry and upload an image.</p>';
}

/* interactions */
$('#search').addEventListener('input', e => { state.q = e.target.value; renderProjects(); watch(); });
document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.tag) { state.tag = t.dataset.tag; renderProjects(); watch(); }
  if (t.dataset.edit) openEntry(state.entries.find(x => x.id == t.dataset.edit));
  if (t.dataset.del) delEntry(t.dataset.del);
  if (t.dataset.act) ({ profile: openProfile, add: () => openEntry(), inbox: openInbox, link: copyLink })[t.dataset.act]();
  if (t.hasAttribute('data-close')) t.closest('dialog').close();
  const cert = t.closest('.cert[data-img]');
  if (cert && !t.closest('button')) { $('#lb-img').src = cert.dataset.img; $('#lightbox').showModal(); }
});
$$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

$('#contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, b = $('button', f); b.disabled = true;
  const res = await api('/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
  b.disabled = false;
  if (res.ok) { f.reset(); toast('Message sent. Thank you!'); } else toast((await res.json()).error);
});

/* editing */
const ef = $('#entry-form'), pf = $('#profile-form');
function syncType() {
  const c = ef.category.value;
  $('#level-wrap').style.display = c === 'Skill' ? '' : 'none';
  $('#tags-wrap').style.display = c === 'Project' ? '' : 'none';
}
ef.category.addEventListener('change', syncType);

function openEntry(en) {
  ef.reset(); ef.id.value = en ? en.id : '';
  $('#dlg-title').textContent = en ? 'Edit entry' : 'Add entry';
  if (en) ['title', 'category', 'date', 'description', 'tags', 'link', 'level'].forEach(k => ef[k].value = en[k]);
  syncType(); $('#entry-dlg').showModal();
}
async function send(res, dlg) {
  if (res.ok) { dlg.close(); toast('Saved'); await load(); } else toast((await res.json()).error);
}
ef.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(ef), id = fd.get('id'); fd.delete('id');
  send(await api(id ? `/entries/${id}` : '/entries', { method: id ? 'PUT' : 'POST', body: fd }), $('#entry-dlg'));
});
async function delEntry(id) {
  if (!confirm('Delete this entry?')) return;
  const r = await api(`/entries/${id}`, { method: 'DELETE' });
  if (r.ok) { toast('Deleted'); load(); }
}

function openProfile() {
  pf.reset();
  ['name', 'headline', 'roles', 'bio', 'location', 'status', 'email', 'website', 'github', 'linkedin', 'accent'].forEach(k => pf[k].value = state.p[k] || '');
  $('#profile-dlg').showModal();
}
pf.addEventListener('submit', async e => {
  e.preventDefault();
  send(await api('/profile', { method: 'PUT', body: new FormData(pf) }), $('#profile-dlg'));
});
$('#del-portfolio').addEventListener('click', async () => {
  if (!confirm('Delete this whole portfolio? This cannot be undone.')) return;
  const r = await api('', { method: 'DELETE' });
  if (r.ok) { localStorage.removeItem('key:' + slug); location.href = '/'; }
});

function copyLink() {
  navigator.clipboard?.writeText(`${location.origin}/p/${slug}?key=${key}`);
  toast('Private edit link copied. Keep it secret.');
}

async function openInbox() {
  const render = async () => {
    const m = await api('/messages').then(r => r.json());
    $('#inbox-list').innerHTML = m.length ? m.map(x => `<div class="msg"><b>${esc(x.name)} · ${esc(x.email)}</b><small>${esc(x.created_at)}</small><p>${esc(x.body)}</p><button class="btn ghost small danger" data-msg="${x.id}">Delete</button></div>`).join('') : '<p class="empty">No messages yet.</p>';
  };
  await render(); $('#inbox-dlg').showModal();
  $('#inbox-list').onclick = async e => { if (e.target.dataset.msg) { await api(`/messages/${e.target.dataset.msg}`, { method: 'DELETE' }); render(); } };
}

load().catch(err => { console.error(err); toast('Could not load this portfolio.'); });