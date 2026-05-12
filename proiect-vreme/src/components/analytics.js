import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

let graficAnalytics = null;

/**
 * Randează sumar statistici + top orașe + bar chart ultimele 7 zile.
 * @param {Object} stats - { total, topOrase, perZi }
 * @param {HTMLElement} containerEl
 */
export function randeazaAnalytics(stats, containerEl) {
  if (!containerEl || !stats) return;

  const { total, topOrase, perZi } = stats;

  const topHTML = topOrase.length
    ? topOrase.map((o, i) => `
        <div class="analytics-top-item">
          <span class="analytics-rank">${i + 1}.</span>
          <span class="analytics-oras-text">${o.city}</span>
          <span class="analytics-count">${o.count} căutări</span>
        </div>`).join('')
    : '<p class="gol">Niciun istoric disponibil.</p>';

  containerEl.innerHTML = `
    <div class="analytics-sumar">
      <div class="analytics-stat">
        <span class="analytics-numar">${total}</span>
        <span class="analytics-eticheta">căutări totale</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-numar">${topOrase.length ? topOrase[0].city : '—'}</span>
        <span class="analytics-eticheta">orașul tău preferat</span>
      </div>
    </div>
    <div class="analytics-corp">
      <div class="analytics-top">
        <h4>Top 5 orașe</h4>
        ${topHTML}
      </div>
      <div class="analytics-grafic-wrap">
        <h4>Căutări — ultimele 7 zile</h4>
        ${perZi.length
          ? '<canvas id="grafic-analytics" height="140"></canvas>'
          : '<p class="gol">Nu există date pentru ultimele 7 zile.</p>'}
      </div>
    </div>
  `;

  if (!perZi.length) return;

  const labele = perZi.map((z) => z.zi.slice(5));
  const valori = perZi.map((z) => z.count);
  const ctx = containerEl.querySelector('#grafic-analytics');

  if (graficAnalytics) { graficAnalytics.destroy(); graficAnalytics = null; }

  graficAnalytics = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labele,
      datasets: [{
        label: 'Căutări',
        data: valori,
        backgroundColor: 'rgba(226, 185, 111, 0.55)',
        borderColor: 'rgba(226, 185, 111, 0.9)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#9ca3af' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}
