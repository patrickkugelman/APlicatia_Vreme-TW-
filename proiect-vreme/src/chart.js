import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

let graficCurent = null;
let eticheteCurente = [];

/**
 * Randează graficul de temperaturi pentru prognoza pe 5 zile.
 * Folosește TOATE punctele (la 3h), nu doar câte unul pe zi.
 */
export function randeazaGraficPrognoza(datePrognoza, container, unitTemp = 'C') {
  if (graficCurent) {
    graficCurent.destroy();
    graficCurent = null;
  }

  // Toate punctele (max 40 la 3h interval), nu filtrate zilnic
  const puncte = datePrognoza.list || [];
  if (!puncte.length) return;

  eticheteCurente = puncte.map((p) => p.dt);
  const etichete = puncte.map((p) => {
    const data = new Date(p.dt * 1000);
    const zi = data.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' });
    const ora = data.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    return `${zi} ${ora}`;
  });

  const temperaturi = puncte.map((p) =>
    unitTemp === 'F'
      ? parseFloat(((p.main.temp * 9) / 5 + 32).toFixed(1))
      : parseFloat(p.main.temp.toFixed(1))
  );

  const tempMin = puncte.map((p) =>
    unitTemp === 'F'
      ? parseFloat(((p.main.temp_min * 9) / 5 + 32).toFixed(1))
      : parseFloat(p.main.temp_min.toFixed(1))
  );

  const tempMax = puncte.map((p) =>
    unitTemp === 'F'
      ? parseFloat(((p.main.temp_max * 9) / 5 + 32).toFixed(1))
      : parseFloat(p.main.temp_max.toFixed(1))
  );

  container.innerHTML = `
    <div class="grafic-container">
      <h3 class="grafic-titlu">Evoluție temperaturi — prognoza 5 zile (intervale 3h)</h3>
      <canvas id="grafic-prognoza"></canvas>
    </div>
  `;

  const canvas = document.getElementById('grafic-prognoza');
  const culoareAccent = getComputedStyle(document.documentElement)
    .getPropertyValue('--culoare-accent').trim() || '#e2b96f';
  const culoareMin = 'rgba(96, 165, 250, 0.7)';
  const culoareMax = 'rgba(248, 113, 113, 0.7)';

  graficCurent = new Chart(canvas, {
    type: 'line',
    data: {
      labels: etichete,
      datasets: [
        {
          label: `Temp (°${unitTemp})`,
          data: temperaturi,
          borderColor: culoareAccent,
          backgroundColor: culoareAccent + '22',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: culoareAccent,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          borderWidth: 2,
          order: 1
        },
        {
          label: `Max (°${unitTemp})`,
          data: tempMax,
          borderColor: culoareMax,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 1,
          borderDash: [4, 4],
          order: 2
        },
        {
          label: `Min (°${unitTemp})`,
          data: tempMin,
          borderColor: culoareMin,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 1,
          borderDash: [4, 4],
          order: 3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}°${unitTemp}`
          }
        },
        legend: {
          labels: {
            color: '#9ca3af',
            boxWidth: 20,
            font: { size: 11 }
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#9ca3af',
            callback: (v) => `${v}°`
          }
        },
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#9ca3af',
            maxTicksLimit: 10,
            maxRotation: 30,
            font: { size: 10 }
          }
        }
      }
    }
  });
}

/**
 * Evidențiază un punct pe grafic corespunzător unui timestamp din prognoza.
 * Folosit de Time Machine pentru a sincroniza cursorul graficului cu slider-ul.
 * @param {number} timestamp - dt (unix) al punctului de prognozat
 */
export function evidentiazaPunctGrafic(timestamp) {
  if (!graficCurent) return;

  const idx = eticheteCurente.indexOf(timestamp);
  if (idx === -1) return;

  try {
    graficCurent.tooltip.setActiveElements(
      [{ datasetIndex: 0, index: idx }],
      { x: 0, y: 0 }
    );
    graficCurent.update('none');
  } catch {
    // Ignorăm erori dacă graficul e în mijlocul unui update
  }
}
