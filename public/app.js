/* ─── State ───────────────────────────────────────────────────────────── */
let savedFormData  = {};
let currentMenuData = null;

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

/* ─── Profile selector ────────────────────────────────────────────────── */
document.querySelectorAll('input[name="perfil"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('extraDeportista').classList.toggle('hidden', radio.value !== 'deportista');
    document.getElementById('extraTrabajador').classList.toggle('hidden', radio.value !== 'trabajador');
  });
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

/* ─── Alergias personalizadas ─────────────────────────────────────────── */
let customAlergias = [];
const alergiaCustomInput   = document.getElementById('alergiaCustomInput');
const alergiasCustomGroup  = document.getElementById('alergiasCustomGroup');

function renderCustomAlergiaChips() {
  alergiasCustomGroup.innerHTML = customAlergias.map((a, i) => `
    <span class="chip-custom">
      <span>⚠️ ${escapeHTML(a)}</span>
      <span class="chip-remove" data-index="${i}" title="Quitar">✕</span>
    </span>
  `).join('');
}

function addCustomAlergia() {
  const value = alergiaCustomInput.value.trim();
  if (!value) return;

  const existing = [
    ...Array.from(document.querySelectorAll('input[name="alergias"]:checked')).map(cb => cb.value),
    ...customAlergias,
  ].map(v => v.toLowerCase());

  if (existing.includes(value.toLowerCase())) {
    showToast('Ya has añadido esa alergia', 'error');
    return;
  }

  customAlergias.push(value);
  renderCustomAlergiaChips();
  alergiaCustomInput.value = '';
  alergiaCustomInput.focus();
}

document.getElementById('alergiaAddBtn').addEventListener('click', addCustomAlergia);
alergiaCustomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); addCustomAlergia(); }
});

alergiasCustomGroup.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip-remove');
  if (!btn) return;
  const idx = parseInt(btn.dataset.index, 10);
  customAlergias.splice(idx, 1);
  renderCustomAlergiaChips();
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

  const alergias = [
    ...Array.from(document.querySelectorAll('input[name="alergias"]:checked')).map(cb => cb.value),
    ...customAlergias,
  ];

  const perfil         = document.querySelector('input[name="perfil"]:checked')?.value || 'ninguno';
  const calorias       = document.getElementById('caloriasInput')?.value || '';
  const alimentosEvitar = document.getElementById('alimentosEvitarInput')?.value.trim() || '';
  const tiempoMax      = document.querySelector('input[name="tiempoMax"]:checked')?.value || '30';

  savedFormData = {
    personas:         parseInt(personasInput.value),
    restricciones,
    alergias,
    presupuesto,
    cocina,
    perfil,
    calorias:         perfil === 'deportista' ? calorias       : '',
    alimentosEvitar:  perfil === 'deportista' ? alimentosEvitar : '',
    tiempoMax:        perfil === 'trabajador' ? tiempoMax       : '',
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
const fabHomeBtn = document.getElementById('fabHomeBtn');

function goToForm() {
  menuSection.classList.add('hidden');
  formSection.classList.remove('hidden');
  fabHomeBtn.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('backToFormBtn').addEventListener('click', goToForm);
fabHomeBtn.addEventListener('click', goToForm);

/* Solo mostrar el FAB de inicio cuando "Cambiar preferencias" ha salido de la vista */
const resultHeaderEl = document.querySelector('.result-header');
new IntersectionObserver(([entry]) => {
  if (menuSection.classList.contains('hidden')) return;
  fabHomeBtn.classList.toggle('hidden', entry.isIntersecting);
}).observe(resultHeaderEl);

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
const PERFIL_LABEL      = { estudiante: '🎓 Estudiante', deportista: '🏋️ Deportista', mayor: '🌿 Persona mayor', trabajador: '⚡ Poco tiempo' };

function renderMenu(data, reqData) {
  stopTips();

  /* Result info tags */
  const tags = [
    `👥 ${reqData.personas} persona${reqData.personas > 1 ? 's' : ''}`,
    reqData.perfil && reqData.perfil !== 'ninguno' ? PERFIL_LABEL[reqData.perfil] : null,
    PRESUPUESTO_LABEL[reqData.presupuesto] || reqData.presupuesto,
    COCINA_LABEL[reqData.cocina] || reqData.cocina,
    ...(reqData.restricciones || []).map(r => `✅ ${r}`),
    ...(reqData.alergias || []).map(a => `⚠️ ${escapeHTML(a)}`),
    reqData.calorias ? `🔥 ${reqData.calorias} kcal/día` : null,
    reqData.tiempoMax ? `⏱️ Máx. ${reqData.tiempoMax} min` : null,
  ].filter(Boolean);
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

  currentMenuData = data;

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

/* ═══════════════════════════════════════════════════════════════════════
   GUARDAR MENÚS
   ═══════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'planificador_menus_v1';
const MEALS_META  = [
  { key: 'desayuno', label: 'Desayuno', icon: '🌅', color: '#ff9f43' },
  { key: 'almuerzo', label: 'Almuerzo', icon: '🥐', color: '#54a0ff' },
  { key: 'comida',   label: 'Comida',   icon: '🍽️', color: '#9c59b6' },
  { key: 'merienda', label: 'Merienda', icon: '🍎', color: '#ff6b81' },
  { key: 'cena',     label: 'Cena',     icon: '🌙', color: '#2c3e50' },
];

function getSavedMenus() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function setSavedMenus(menus) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
}

function updateFabBadge() {
  const n = getSavedMenus().length;
  const badge = document.getElementById('fabBadge');
  badge.textContent = n;
  n > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
}
updateFabBadge();

/* ─── Save button ─────────────────────────────────────────────────────── */
document.getElementById('saveMenuBtn').addEventListener('click', () => {
  if (!currentMenuData) return;
  const input = document.getElementById('menuNameInput');
  input.value = '';
  document.getElementById('saveModalOverlay').classList.remove('hidden');
  setTimeout(() => input.focus(), 120);
});

document.getElementById('saveModalCancel').addEventListener('click', () => {
  document.getElementById('saveModalOverlay').classList.add('hidden');
});

document.getElementById('saveModalConfirm').addEventListener('click', () => {
  const name = document.getElementById('menuNameInput').value.trim();
  if (!name) { document.getElementById('menuNameInput').focus(); return; }
  document.getElementById('saveModalOverlay').classList.add('hidden');
  saveMenuWithDetails(name);
});

document.getElementById('menuNameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  document.getElementById('saveModalConfirm').click();
  if (e.key === 'Escape') document.getElementById('saveModalCancel').click();
});

async function saveMenuWithDetails(name) {
  const id = Date.now().toString();
  const entry = {
    id,
    name,
    savedAt: new Date().toLocaleDateString('es-ES'),
    formData: { ...savedFormData },
    menu: currentMenuData,
    details: {},
    detailsReady: false,
  };
  const menus = getSavedMenus();
  menus.unshift(entry);
  setSavedMenus(menus);
  updateFabBadge();

  /* Generar todos los detalles en paralelo (por tandas de 7) */
  const allMeals = [];
  currentMenuData.dias.forEach(dia => {
    MEALS_META.forEach(m => {
      allMeals.push({ dayKey: `${dia.dia}-${m.key}`, day: dia.dia, ...m, meal: dia[m.key] });
    });
  });

  const total = allMeals.length;
  let done  = 0;
  const fill = document.getElementById('progressBarFill');
  const text = document.getElementById('progressText');
  const progressOverlay = document.getElementById('progressModalOverlay');

  fill.style.width = '0%';
  text.textContent = `0 / ${total} platos`;
  progressOverlay.classList.remove('hidden');

  const updateProgress = () => {
    done++;
    const pct = Math.round((done / total) * 100);
    fill.style.width = `${pct}%`;
    text.textContent = `${done} / ${total} platos`;
  };

  const BATCH = 7;
  for (let i = 0; i < total; i += BATCH) {
    const batch = allMeals.slice(i, i + BATCH);
    await Promise.all(batch.map(async item => {
      try {
        const res = await fetch('/api/meal-details', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            meal: item.meal, type: item.key, label: item.label,
            day: item.day,   personas: savedFormData.personas,
          }),
        });
        if (res.ok) {
          const detail = await res.json();
          const saved  = getSavedMenus();
          const idx    = saved.findIndex(m => m.id === id);
          if (idx !== -1) { saved[idx].details[item.dayKey] = detail; setSavedMenus(saved); }
        }
      } catch { /* continuar aunque falle un plato */ }
      updateProgress();
    }));
  }

  /* Marcar como listo */
  const saved = getSavedMenus();
  const idx   = saved.findIndex(m => m.id === id);
  if (idx !== -1) { saved[idx].detailsReady = true; setSavedMenus(saved); }

  progressOverlay.classList.add('hidden');
  showToast(`"${name}" guardado con todos los detalles ✓`, 'success');
}

/* ═══════════════════════════════════════════════════════════════════════
   PANEL DE MENÚS GUARDADOS (DRAWER)
   ═══════════════════════════════════════════════════════════════════════ */
document.getElementById('fabBtn').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('drawerOverlay')) closeDrawer();
});

function openDrawer() {
  renderDrawer();
  document.getElementById('drawerOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.getElementById('drawerOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderDrawer() {
  const menus = getSavedMenus();
  const body  = document.getElementById('drawerBody');

  if (menus.length === 0) {
    body.innerHTML = `
      <div class="drawer-empty">
        <span style="font-size:3rem">📭</span>
        <p>No tienes menús guardados</p>
        <small>Genera un menú y pulsa "Guardar menú"</small>
      </div>`;
    return;
  }

  body.innerHTML = menus.map(m => {
    const tags = [
      `👥 ${m.formData?.personas ?? '?'} persona${m.formData?.personas > 1 ? 's' : ''}`,
      PRESUPUESTO_LABEL[m.formData?.presupuesto] ?? '',
      COCINA_LABEL[m.formData?.cocina] ?? '',
      ...(m.formData?.restricciones || []).map(r => `✅ ${r}`),
      ...(m.formData?.alergias || []).map(a => `⚠️ ${escapeHTML(a)}`),
    ].filter(Boolean);

    return `
      <div class="saved-menu-card">
        <div class="saved-menu-name">${escapeHTML(m.name)}</div>
        <div class="saved-menu-tags">${tags.map(t => `<span class="sm-tag">${t}</span>`).join('')}</div>
        <small class="saved-date">Guardado el ${m.savedAt}${m.detailsReady ? ' · detalles incluidos' : ''}</small>
        <div class="saved-menu-actions">
          <button class="sma-btn sma-load"     onclick="loadSavedMenu('${m.id}')">👁️ Ver</button>
          <button class="sma-btn sma-download" onclick="downloadSavedMenu('${m.id}')"
                  ${m.detailsReady ? '' : 'disabled title="Detalles no disponibles"'}>📥 Descargar</button>
          <button class="sma-btn sma-delete"   onclick="deleteSavedMenu('${m.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function loadSavedMenu(id) {
  const menu = getSavedMenus().find(m => m.id === id);
  if (!menu) return;
  savedFormData   = menu.formData;
  currentMenuData = menu.menu;
  renderMenu(menu.menu, menu.formData);
  closeDrawer();
  showToast(`"${menu.name}" cargado`, 'success');
}

function deleteSavedMenu(id) {
  const menu = getSavedMenus().find(m => m.id === id);
  if (!menu) return;
  if (!confirm(`¿Eliminar "${menu.name}"?`)) return;
  setSavedMenus(getSavedMenus().filter(m => m.id !== id));
  updateFabBadge();
  renderDrawer();
}

/* ═══════════════════════════════════════════════════════════════════════
   DESCARGA HTML COMPLETA
   ═══════════════════════════════════════════════════════════════════════ */
function downloadSavedMenu(id) {
  const menu = getSavedMenus().find(m => m.id === id);
  if (!menu || !menu.detailsReady) { showToast('Los detalles aún no están disponibles', 'error'); return; }

  const html = buildDownloadHTML(menu);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `menu-${menu.name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Menú descargado ✓', 'success');
}

function buildDownloadHTML({ name, savedAt, formData, menu, details }) {
  const DAY_GRADS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#0099f7,#00c6fb)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fd7442,#fecc72)',
  ];

  const configTags = [
    `👥 ${formData?.personas ?? '?'} persona${formData?.personas > 1 ? 's' : ''}`,
    formData?.presupuesto ? `💰 Presupuesto ${formData.presupuesto}` : '',
    formData?.cocina ? `🌍 Cocina ${formData.cocina}` : '',
    ...(formData?.restricciones || []).map(r => `✅ ${r}`),
    ...(formData?.alergias || []).map(a => `⚠️ ${escapeHTML(a)}`),
  ].filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');

  const daysHTML = menu.dias.map((dia, di) => {
    const mealsHTML = MEALS_META.map(m => {
      const det      = details[`${dia.dia}-${m.key}`];
      const mealDesc = escapeHTML(dia[m.key] || '—');

      let detailHTML = '';
      if (det) {
        const rows  = (det.ingredientes || []).map(ing =>
          `<tr><td>${escapeHTML(ing.nombre)}</td><td>${escapeHTML(ing.cantidad)}</td><td class="price">${escapeHTML(ing.precio_aprox)}</td></tr>`
        ).join('');
        const steps = (det.pasos || []).map((p, i) =>
          `<li><span class="sn">${i + 1}</span><span>${escapeHTML(p)}</span></li>`
        ).join('');
        const total = det.coste_total_estimado
          ? `<div class="total-row">💰 Coste total estimado: <strong>${escapeHTML(det.coste_total_estimado)}</strong></div>` : '';

        detailHTML = `
          <div class="meal-detail">
            <div class="stats-row">
              <div class="stat-box"><div class="si">⏱️</div><strong>${escapeHTML(String(det.tiempo_preparacion||'—'))}</strong><span>preparación</span></div>
              <div class="stat-box"><div class="si">🔥</div><strong>${det.calorias_por_persona ?? '—'} kcal</strong><span>por persona</span></div>
              ${det.coste_total_estimado ? `<div class="stat-box"><div class="si">💰</div><strong>${escapeHTML(det.coste_total_estimado)}</strong><span>coste total</span></div>` : ''}
            </div>
            <div class="section-block">
              <div class="section-title">📦 Ingredientes</div>
              <table><thead><tr><th>Ingrediente</th><th>Cantidad</th><th>Precio</th></tr></thead>
              <tbody>${rows}</tbody></table>
              ${total}
            </div>
            <div class="section-block">
              <div class="section-title">👨‍🍳 Preparación</div>
              <ol class="steps">${steps}</ol>
            </div>
          </div>`;
      }

      return `
        <div class="meal">
          <div class="meal-head" style="border-left:4px solid ${m.color}">
            <span class="meal-icon">${m.icon}</span>
            <div>
              <div class="meal-type" style="color:${m.color}">${m.label}</div>
              <div class="meal-name">${mealDesc}</div>
            </div>
          </div>
          ${detailHTML}
        </div>`;
    }).join('');

    return `
      <div class="day-block">
        <div class="day-head" style="background:${DAY_GRADS[di % 7]}"><h2>${escapeHTML(dia.dia)}</h2></div>
        <div class="day-body">${mealsHTML}</div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(name)} — Menú Semanal</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#f3f6f3;color:#1a2332;line-height:1.6}
.page-header{background:linear-gradient(145deg,#1a4731,#2c7a4b,#4a9e6b);padding:40px 24px;text-align:center;color:#fff}
.page-header h1{font-size:2rem;font-weight:700;margin-bottom:8px}
.page-header p{opacity:.8;font-size:.95rem;margin-bottom:16px}
.tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.tag{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:50px;padding:5px 14px;font-size:.8rem}
.container{max-width:900px;margin:0 auto;padding:32px 16px 60px}
.day-block{background:#fff;border-radius:16px;overflow:hidden;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,.07)}
.day-head{padding:18px 24px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.2)}
.day-head h2{font-size:1.2rem;font-weight:700;letter-spacing:.03em}
.day-body{padding:16px}
.meal{background:#f7faf7;border-radius:10px;margin-bottom:12px;overflow:hidden}
.meal:last-child{margin-bottom:0}
.meal-head{display:flex;align-items:flex-start;gap:12px;padding:14px 16px}
.meal-icon{font-size:1.5rem;line-height:1;margin-top:2px}
.meal-type{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px}
.meal-name{font-size:.95rem;color:#1a2332;font-weight:500}
.meal-detail{background:#fff;border-top:1px solid #dde5dd;padding:16px}
.stats-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.stat-box{flex:1;min-width:100px;background:#eef7f2;border:1px solid #b7dfc8;border-radius:10px;padding:14px;text-align:center}
.si{font-size:1.3rem;margin-bottom:6px}
.stat-box strong{display:block;font-size:1rem;color:#2c7a4b;margin-bottom:3px}
.stat-box span{font-size:.72rem;color:#6b7a8d;text-transform:uppercase;letter-spacing:.07em;font-weight:600}
.section-block{margin-bottom:16px}
.section-block:last-child{margin-bottom:0}
.section-title{font-weight:700;font-size:.9rem;color:#1a2332;padding-bottom:8px;border-bottom:2px solid #dde5dd;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:.87rem}
thead tr{background:#f3f6f3}
th{text-align:left;padding:8px 12px;color:#6b7a8d;font-size:.74rem;text-transform:uppercase;letter-spacing:.07em;font-weight:700}
th:last-child{text-align:right}
td{padding:9px 12px;border-bottom:1px solid #dde5dd;color:#1a2332;vertical-align:top}
td.price,th:last-child{text-align:right}
td.price{font-weight:700;color:#2c7a4b;white-space:nowrap}
tr:last-child td{border-bottom:none}
tbody tr:nth-child(even){background:#f7faf7}
.total-row{text-align:right;font-size:.87rem;color:#6b7a8d;padding:8px 4px 0;border-top:1px solid #dde5dd}
.total-row strong{color:#2c7a4b;font-size:.95rem}
.steps{list-style:none;counter-reset:s}
.steps li{counter-increment:s;display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #dde5dd;font-size:.88rem}
.steps li:last-child{border-bottom:none}
.sn{min-width:24px;height:24px;background:#2c7a4b;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;margin-top:2px}
.footer{text-align:center;padding:24px;color:#6b7a8d;font-size:.82rem;border-top:1px solid #dde5dd}
@media print{body{background:#fff}.day-block{box-shadow:none;break-inside:avoid}}
@media(max-width:600px){.stats-row{flex-direction:column}}
</style>
</head>
<body>
<div class="page-header">
  <h1>🍽️ ${escapeHTML(name)}</h1>
  <p>Menú semanal generado con IA · Guardado el ${savedAt}</p>
  <div class="tags">${configTags}</div>
</div>
<div class="container">${daysHTML}</div>
<div class="footer">Generado con Planificador de Menús · OpenAI GPT-4o mini</div>
</body>
</html>`;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
