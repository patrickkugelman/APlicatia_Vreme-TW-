import { protejeazaAdmin } from '../auth-guard.js';
import { deconecteaza } from '../auth.js';
import { obtineUtilizatoriAdmin, stergeUtilizatorAdmin, obtineStatisticiAdmin, obtineTopOrase } from '../api.js';

let utilizatorAdmin = null;
let totiUtilizatorii = [];

// Verifică că ești admin
protejeazaAdmin().then(user => {
  if (!user) return;
  utilizatorAdmin = user;

  const nameEl = document.getElementById('admin-user-name');
  if (nameEl) nameEl.textContent = user.name || user.email;

  document.getElementById('btn-deconecteaza')?.addEventListener('click', () => {
    if (confirm('Ești sigur că vrei să te deconectezi?')) deconecteaza();
  });

  incarcaDate();

  // Navigare sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('activ'));
      btn.classList.add('activ');
      const sectiune = btn.dataset.sectiune;
      document.querySelectorAll('.admin-sectiune').forEach(s => s.classList.add('ascuns'));
      document.getElementById(`sectiune-${sectiune}`)?.classList.remove('ascuns');
      const titluri = { utilizatori: '👥 Utilizatori', statistici: '📊 Statistici', comunitate: '🌍 Comunitate' };
      document.getElementById('titlu-sectiune').textContent = titluri[sectiune] || '';
    });
  });

  // Refresh
  document.getElementById('btn-refresh')?.addEventListener('click', incarcaDate);

  // Filtru utilizatori
  document.getElementById('filtru-utilizatori')?.addEventListener('input', (e) => {
    filtreazaUtilizatori(e.target.value);
  });
});

async function incarcaDate() {
  await Promise.all([
    incarcaStatistici(),
    incarcaUtilizatori(),
    incarcaComunitate()
  ]);
}

async function incarcaStatistici() {
  try {
    const stats = await obtineStatisticiAdmin();
    document.getElementById('stat-utilizatori').textContent = stats.totalUseri ?? '—';
    document.getElementById('stat-cautari').textContent = stats.totalCautari ?? '—';
    document.getElementById('stat-favorite').textContent = stats.totalFavorite ?? '—';
    document.getElementById('stat-orase').textContent = stats.uniqueOrase ?? stats.topOrase?.length ?? '—';

    // Grafic bare pentru top orașe
    const container = document.getElementById('grafic-bare-cautari');
    if (container && stats.topOrase?.length) {
      const maxCount = stats.topOrase[0].search_count || 1;
      container.innerHTML = stats.topOrase.map(item => {
        const procent = Math.round((item.search_count / maxCount) * 100);
        return `
          <div class="grafic-bara-item">
            <span class="grafic-bara-label">${item.city}</span>
            <div class="grafic-bara-wrap">
              <div class="grafic-bara-fill" style="width: ${procent}%"></div>
            </div>
            <span class="grafic-bara-count">${item.search_count}</span>
          </div>`;
      }).join('');
    }
  } catch (e) {
    console.error('Eroare statistici:', e);
  }
}

async function incarcaUtilizatori() {
  const tbody = document.getElementById('corp-tabel-utilizatori');
  try {
    totiUtilizatorii = await obtineUtilizatoriAdmin();
    randeazaUtilizatori(totiUtilizatorii);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="tabel-gol">Eroare la încărcarea utilizatorilor: ${e.message}</td></tr>`;
  }
}

function filtreazaUtilizatori(text) {
  const q = text.toLowerCase().trim();
  const filtrati = q
    ? totiUtilizatorii.filter(u =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    : totiUtilizatorii;
  randeazaUtilizatori(filtrati);
}

function randeazaUtilizatori(utilizatori) {
  const tbody = document.getElementById('corp-tabel-utilizatori');
  if (!utilizatori.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="tabel-gol">Niciun utilizator găsit.</td></tr>';
    return;
  }
  tbody.innerHTML = utilizatori.map((u, idx) => {
    const esteEu = u.id === utilizatorAdmin?.id;
    const dataInreg = u.created_at ? new Date(u.created_at).toLocaleDateString('ro-RO') : '—';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escape(u.name || '—')}</td>
        <td>${escape(u.email)}</td>
        <td><span class="badge-rol ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
        <td>${dataInreg}</td>
        <td>${u.search_count ?? 0}</td>
        <td>${u.favorites_count ?? 0}</td>
        <td>
          <button class="btn-sterge-user" data-id="${u.id}" ${esteEu ? 'disabled title="Nu te poți șterge pe tine"' : ''}>
            🗑 Șterge
          </button>
        </td>
      </tr>`;
  }).join('');

  // Listener ștergere
  tbody.querySelectorAll('.btn-sterge-user:not([disabled])').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const user = totiUtilizatorii.find(u => u.id === id);
      if (!user) return;
      if (!confirm(`Ștergi utilizatorul "${user.name}" (${user.email})?`)) return;
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        await stergeUtilizatorAdmin(id);
        totiUtilizatorii = totiUtilizatorii.filter(u => u.id !== id);
        randeazaUtilizatori(totiUtilizatorii);
        await incarcaStatistici();
      } catch (e) {
        alert(`Eroare: ${e.message}`);
        btn.disabled = false;
        btn.textContent = '🗑 Șterge';
      }
    });
  });
}

async function incarcaComunitate() {
  const container = document.getElementById('top-orase-admin');
  if (!container) return;
  try {
    const topOrase = await obtineTopOrase();
    const medalii = ['🥇', '🥈', '🥉'];
    container.innerHTML = topOrase.map((item, idx) => `
      <div class="top-oras-card">
        <span class="top-oras-rank">${medalii[idx] || (idx + 1) + '.'}</span>
        <div class="top-oras-info">
          <div class="top-oras-name">${escape(item.city)}</div>
          <div class="top-oras-count">${item.search_count} căutări</div>
        </div>
      </div>`).join('');
  } catch {
    container.innerHTML = '<p style="color: var(--admin-muted)">Statistici indisponibile.</p>';
  }
}

function escape(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
