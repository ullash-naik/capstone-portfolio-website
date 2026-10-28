const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2600); }

$('#year').textContent = new Date().getFullYear();
$('#theme-btn').addEventListener('click', () => {
  const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = n; localStorage.setItem('theme', n);
});

async function loadGallery() {
  try {
    const list = await fetch('/api/portfolios').then(r => r.json());
    $('#gallery-list').innerHTML = list.length ? list.map(p => `
      <a class="proj" href="/p/${encodeURIComponent(p.slug)}" style="text-decoration:none;color:inherit">
        <div class="cover" style="${p.avatar_url ? `background-image:url('${esc(p.avatar_url)}');` : ''}color:${esc(p.accent)}">${p.avatar_url ? '' : esc(p.name[0])}</div>
        <div class="body"><h3>${esc(p.name)}</h3><p>${esc(p.headline) || 'Portfolio'}</p><span class="mono mute">/p/${esc(p.slug)}</span></div>
      </a>`).join('') : '<p class="empty">No portfolios yet. Be the first.</p>';
  } catch { $('#gallery-list').innerHTML = '<p class="empty">Could not load portfolios.</p>'; }
}

const form = $('#create-form');
const hint = () => $('#addr-hint').textContent = location.host + '/p/' + (slugify(form.slug.value || form.name.value) || 'your-name');
form.addEventListener('input', hint); hint();

form.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await fetch('/api/portfolios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  const d = await res.json();
  if (!res.ok) return toast(d.error);
  localStorage.setItem('key:' + d.slug, d.key);
  $('#edit-link').value = `${location.origin}/p/${d.slug}?key=${d.key}`;
  $('#open-link').href = `/p/${d.slug}`;
  $('#done-dlg').showModal();
});
$('#copy-link').addEventListener('click', () => { $('#edit-link').select(); navigator.clipboard?.writeText($('#edit-link').value); toast('Copied'); });
loadGallery();