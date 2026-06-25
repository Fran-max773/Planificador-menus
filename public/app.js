/* ─── State ───────────────────────────────────────────────────────────── */
let savedFormData = {};

/* ─── DOM refs ────────────────────────────────────────────────────────── */
const formSection    = document.getElementById('formSection');
const loadingSection = document.getElementById('loadingSection');
const menuSection    = document.getElementById('menuSection');
const menuGrid       = document.getElementById('menuGrid');
const menuForm       = document.getElementById('menuForm');
const personasDisplay = document.getElementById('personasDisplay');
const personasInput   = document.getElementById('personasInput');
const loadingTip      = document.getElementById('loadingTip');
const resultInfo      = document.getElementById('resultInfo');
const toastEl         = document.getElementById('toast');

/* ─── Toast ───────────────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'error') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `toast ${type} show`;
  toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3800);
}

/* ─── Stepper ─────────────────────────────────────────────────────────── */
document.getElementById('decreaseBtn').addEventListener('click', () => {
  const v = parseInt(personasInput.value);
  if (v > 1) {
    personasInput.value = v - 1;
    personasDisplay.textContent = v - 1;
  }
});

document.getElementById('increaseBtn').addEventListener('click', () => {
  const v = parseInt(personasInput.value);
  if (v < 30) {
    personasInput.value = v + 1;
    personasDisplay.textContent = v + 1;
  }
});

/* ─── Chip mutual exclusion ───────────────────────────────────────────── */
const sinRestriccionesChip = document.getElementById('sinRestriccionesChip');
const otherChips = document.querySelectorAll('input[name="restricciones"]:not(#sinRestriccionesChip)');

sinRestriccionesChip.addEventListener('change', () => {
  if (sinRestriccionesChip.checked) {
    otherChips.forEach(cb => { cb.checked = false; });
  }
});

otherChips.forEach(cb => {
  cb.addEventListener('change', () => {
    if (cb.checked) sinRestriccionesChip.checked = false;
  });
});

/* ─── Loading tips ────────────────────────────────────────────────────── */
const TIPS = [
  '🧑‍🍳 Analizando tus preferencias…',
  '📅 Diseñando la semana completa…',
  '🥦 Seleccionando ingredientes frescos…',
  '⚖️ Equilibrando macronutrientes…',
  '🌿 Revisando restricciones alimentarias…',
  '✨ Añadiendo el toque especial del chef…',
  '📋 Finalizando tu menú personalizado…',
];

let tipTimer, tipIdx = 0;

function startTips() {
  tipIdx = 0;
  loadingTip.textContent = TIPS[0];
  tipTimer = setInterval(() => {
    tipIdx = (tipIdx + 1) % TIPS.length;
    loadingTip.style.opacity = 0;
    setTimeout(() => {
      loadingTip.textContent = TIPS[tipIdx];
      loadingTip.style.opacity = 1;
    }, 300);
  }, 2200);
}

function stopTips() { clearInterval(tipTimer); }

/* ─── Form submit ─────────────────────────────────────────────────────── */
menuForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const presupuesto = document.querySelector('input[name="presupuesto"]:checked')?.value;
  const cocina      = document.querySelector('input[name="cocina"]:checked')?.value;

  let valid = true;

  const errP = document.getElementById('errorPresupuesto');
  const errC = document.getElementById('errorCocina');

  if (!presupuesto) { errP.classList.remove('hidden'); valid = false; }
  else              { errP.classList.add('hidden'); }

  if (!cocina)      { errC.classList.remove('hidden'); valid = false; }
  else              { errC.classList.add('hidden'); }

  if (!valid) {
    showToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  const restricciones = Array.from(
    document.querySelectorAll('input[name="restricciones"]:checked')
  ).map(cb => cb.value)
  .filter(v => v !== 'sin_restricciones');

  savedFormData = {
    personas:        parseInt(personasInput.value),
    restricciones,
    presupuesto,
    cocina,
    preferenciasExtra: document.getElementById('preferenciasForm').value.trim(),
  };

  generateMenu(savedFormData);
});

/* ─── Regenerate ──────────────────────────────────────────────────────── */
document.getElementById('regenBtn').addEventListener('click', () => {
  const extraRegen = document.getElementById('preferenciasRegen').value.trim();
  generateMenu({ ...savedFormData, preferenciasExtra: extraRegen });
});

/* ─── Back to form ────────────────────────────────────────────────────── */
document.getElementById('backToFormBtn').addEventListener('click', () => {
  menuSection.classList.add('hidden');
  formSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── Generate menu ───────────────────────────────────────────────────── */
async function generateMenu(data) {
  formSection.classList.add('hidden');
  menuSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  startTips();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const regenBtn = document.getElementById('regenBtn');
  regenBtn.disabled = true;

  try {
    const res = await fetch('/api/generate-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.error || 'Error desconocido');
    if (!json.dias || json.dias.length === 0) throw new Error('El menú generado está vacío');

    renderMenu(json, data);
    showToast('¡Menú generado con éxito! 🎉', 'success');
  } catch (err) {
    stopTips();
    loadingSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    showToast(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    regenBtn.disabled = false;
  }
}

/* ─── Render menu ─────────────────────────────────────────────────────── */
const MEALS = [
  { key: 'desayuno',  label: 'Desayuno',  icon: '🌅', cls: 'meal-desayuno'  },
  { key: 'almuerzo',  label: 'Almuerzo',  icon: '🥐', cls: 'meal-almuerzo'  },
  { key: 'comida',    label: 'Comida',    icon: '🍽️', cls: 'meal-comida'    },
  { key: 'merienda',  label: 'Merienda',  icon: '🍎', cls: 'meal-merienda'  },
  { key: 'cena',      label: 'Cena',      icon: '🌙', cls: 'meal-cena'      },
];

const PRESUPUESTO_LABEL = { bajo: '💚 Presupuesto bajo', medio: '💛 Presupuesto medio', alto: '🧡 Presupuesto alto' };
const COCINA_LABEL      = { mediterranea: '🫒 Mediterránea', asiatica: '🍜 Asiática', internacional: '✈️ Internacional', variada: '🌈 Variada' };

function renderMenu(data, reqData) {
  stopTips();

  /* Result info tags */
  const tags = [
    `👥 ${reqData.personas} persona${reqData.personas > 1 ? 's' : ''}`,
    PRESUPUESTO_LABEL[reqData.presupuesto] || reqData.presupuesto,
    COCINA_LABEL[reqData.cocina] || reqData.cocina,
    ...(reqData.restricciones || []).map(r => `✅ ${r}`),
  ];
  resultInfo.innerHTML = tags.map(t => `<span class="result-tag">${t}</span>`).join('');

  /* Seed regen textarea with original extra prefs */
  document.getElementById('preferenciasRegen').value = reqData.preferenciasExtra || '';

  /* Build day cards */
  menuGrid.innerHTML = '';
  data.dias.forEach((dia, i) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.style.animationDelay = `${i * 0.07}s`;

    const mealsHTML = MEALS.map(m => `
      <div class="meal-item ${m.cls}"
           data-meal="${escapeHTML(dia[m.key] || '')}"
           data-type="${m.key}"
           data-label="${m.label}"
           data-day="${escapeHTML(dia.dia)}"
           data-icon="${m.icon}">
        <div class="meal-badge">${m.icon}</div>
        <div class="meal-body">
          <div class="meal-label">${m.label}</div>
          <div class="meal-desc">${escapeHTML(dia[m.key] || '—')}</div>
        </div>
        <span class="meal-arrow">›</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="day-header">${escapeHTML(dia.dia)}</div>
      <div class="day-meals">${mealsHTML}</div>
    `;

    menuGrid.appendChild(card);
  });

  loadingSection.classList.add('hidden');
  menuSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Meal click → modal ──────────────────────────────────────────────── */
menuGrid.addEventListener('click', (e) => {
  const item = e.target.closest('.meal-item[data-meal]');
  if (!item) return;
  openModal({
    meal:    item.dataset.meal,
    type:    item.dataset.type,
    label:   item.dataset.label,
    day:     item.dataset.day,
    icon:    item.dataset.icon,
    personas: savedFormData.personas || 1,
  });
});

/* ─── Modal ───────────────────────────────────────────────────────────── */
const modalOverlay   = document.getElementById('modalOverlay');
const modalCloseBtn  = document.getElementById('modalClose');
const modalHeaderEl  = document.getElementById('modalHeader');
const modalIconEl    = document.getElementById('modalIcon');
const modalMealTypeEl = document.getElementById('modalMealType');
const modalDayEl     = document.getElementById('modalDay');
const modalTitleEl   = document.getElementById('modalTitle');
const modalBodyEl    = document.getElementById('modalBody');

const MEAL_GRADIENTS = {
  desayuno: 'linear-gradient(135deg, #ff9f43, #e05b00)',
  almuerzo: 'linear-gradient(135deg, #54a0ff, #1565c0)',
  comida:   'linear-gradient(135deg, #9c59b6, #4a235a)',
  merienda: 'linear-gradient(135deg, #ff6b81, #c0392b)',
  cena:     'linear-gradient(135deg, #2c3e50, #3d5a80)',
};

function openModal({ meal, type, label, day, icon, personas }) {
  modalHeaderEl.style.background = MEAL_GRADIENTS[type] || MEAL_GRADIENTS.comida;
  modalIconEl.textContent     = icon;
  modalMealTypeEl.textContent = label;
  modalDayEl.textContent      = day;
  modalTitleEl.textContent    = meal;

  modalBodyEl.innerHTML = `
    <div class="modal-loading">
      <div class="loading-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      <p>Consultando al chef IA…</p>
    </div>`;

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modalCloseBtn.focus();

  fetchMealDetails({ meal, type, label, day, personas });
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

async function fetchMealDetails({ meal, type, label, day, personas }) {
  try {
    const res = await fetch('/api/meal-details', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ meal, type, label, day, personas }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error desconocido');
    renderModalContent(json, personas);
  } catch (err) {
    modalBodyEl.innerHTML = `
      <div class="modal-loading">
        <p style="color:#e74c3c;font-size:1rem">⚠️ ${escapeHTML(err.message)}</p>
      </div>`;
  }
}

function renderModalContent(data, personas) {
  const ingredientsRows = (data.ingredientes || []).map(ing => `
    <tr>
      <td>${escapeHTML(ing.nombre)}</td>
      <td>${escapeHTML(ing.cantidad)}</td>
      <td>${escapeHTML(ing.precio_aprox)}</td>
    </tr>`).join('');

  const stepsItems = (data.pasos || []).map(paso =>
    `<li>${escapeHTML(paso)}</li>`
  ).join('');

  const totalHTML = data.coste_total_estimado
    ? `<div class="total-cost">💰 Coste total estimado: <strong>${escapeHTML(data.coste_total_estimado)}</strong></div>`
    : '';

  modalBodyEl.innerHTML = `
    <div class="modal-stats">
      <div class="stat-badge">
        <span class="stat-icon">⏱️</span>
        <span class="stat-value">${escapeHTML(String(data.tiempo_preparacion || '—'))}</span>
        <span class="stat-label">Tiempo de preparación</span>
      </div>
      <div class="stat-badge">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">${data.calorias_por_persona ?? '—'}</span>
        <span class="stat-label">kcal por persona</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">
        📦 Ingredientes
        <small style="font-weight:400;color:var(--muted);font-size:0.82rem">para ${personas} persona${personas > 1 ? 's' : ''}</small>
      </div>
      <table class="ingredients-table">
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Cantidad</th>
            <th>Precio aprox.</th>
          </tr>
        </thead>
        <tbody>${ingredientsRows}</tbody>
      </table>
      ${totalHTML}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">👨‍🍳 Preparación</div>
      <ol class="steps-list">${stepsItems}</ol>
    </div>`;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
