// ══════════════════════════════════════════════════════════════════════════
//  APP.JS — Coordinación de UI
//  Conecta DATOS y MAPA. Gestiona el DOM.
// ══════════════════════════════════════════════════════════════════════════

// ── ARRANQUE ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  DATOS.init();

  // Init mapa
  MAPA.init({
    onClicRecinto: onClicRecinto,
    onClicVacio:   onClicVacio
  });

  // Conectar UI
  conectarEventos();

  // Verificar servidor y cargar geometrías
  await verificarServidor();

  // Pintar campos
  MAPA.pintarCampos(DATOS.getCampos());
  renderListaCampos();
});

// ── VERIFICAR SERVIDOR ────────────────────────────────────────────────────
async function verificarServidor() {
  const elEstado = document.getElementById('estado-sigpac');
  const elBadge  = document.getElementById('recintos-badge');
  try {
    const res = await fetch('/status');
    const data = await res.json();
    elEstado.textContent = '● SIGPAC conectado';
    elEstado.className = 'ok';
    elBadge.textContent = `${data.recintos} recintos`;

    // Cargar geometrías del servidor
    elEstado.textContent = '⏳ Cargando geometrías...';
    const n = await MAPA.cargarGeometrias();
    elEstado.textContent = '● SIGPAC conectado';
    elBadge.textContent = `${n} recintos`;

    // Repintar con geometrías reales
    MAPA.pintarCampos(DATOS.getCampos());
  } catch(e) {
    elEstado.textContent = '✕ Sin servidor';
    elEstado.className = 'error';
    elBadge.textContent = '— recintos';
    toast('Inicia el servidor: node server.js', 'warn');
  }
}

// ── LISTA DE CAMPOS ───────────────────────────────────────────────────────
function renderListaCampos(filtro = '') {
  const contenedor = document.getElementById('lista-campos');
  const campos = DATOS.getCampos().filter(c =>
    c.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  contenedor.innerHTML = '';
  for (const campo of campos) {
    const dc = DATOS.getDatosCampana(campo.id);
    const nRec = campo.recintos.length;
    const div = document.createElement('div');
    div.className = 'campo-item';
    div.dataset.id = campo.id;
    div.innerHTML = `
      <div class="campo-color-dot" style="background:${campo.color}"></div>
      <div class="campo-info">
        <div class="campo-nombre">${campo.nombre}</div>
        <div class="campo-meta">${nRec} recinto${nRec!==1?'s':''} · ${dc.cultivo || 'Sin cultivo'}</div>
      </div>
      <div class="campo-estado gris"></div>
    `;
    div.addEventListener('click', () => seleccionarCampo(campo.id));
    contenedor.appendChild(div);
  }
}

// ── SELECCIONAR CAMPO ─────────────────────────────────────────────────────
let campoActivoId = null;

function seleccionarCampo(id) {
  campoActivoId = id;

  // Marcar activo en lista
  document.querySelectorAll('.campo-item').forEach(el => {
    el.classList.toggle('activo', el.dataset.id === id);
  });

  MAPA.seleccionarCampo(id);
  abrirPanelDer(id);
}

// ── PANEL DERECHO ─────────────────────────────────────────────────────────
function abrirPanelDer(campoId) {
  const campo = DATOS.getCampo(campoId);
  if (!campo) return;

  document.getElementById('panel-der').classList.remove('oculto');
  document.getElementById('campo-nombre-titulo').textContent = campo.nombre;

  const dc = DATOS.getDatosCampana(campoId);
  const contenido = document.getElementById('panel-der-contenido');
  contenido.innerHTML = `
    <div class="panel-seccion">
      <label>Cultivo</label>
      <select id="pd-cultivo">
        <option value="">— Sin cultivo —</option>
        ${['Maíz','Cebada','Trigo blando','Trigo duro','Girasol','Nabo','Olivo','Almendro','Barbecho','Pastos permanentes']
          .map(c => `<option ${dc.cultivo===c?'selected':''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="panel-seccion">
      <label>Variedad</label>
      <input type="text" id="pd-variedad" value="${dc.variedad||''}" placeholder="Ej: Brio, Anza..."/>
    </div>
    <div class="panel-seccion">
      <label>Fecha de siembra</label>
      <input type="date" id="pd-fecha" value="${dc.fechaSiembra||''}"/>
    </div>
    <div class="panel-seccion">
      <label>Notas</label>
      <textarea id="pd-notas" rows="3" style="resize:vertical">${dc.notas||''}</textarea>
    </div>

    <div class="panel-seccion">
      <label>Recintos SIGPAC (${campo.recintos.length})</label>
      <div class="recintos-lista" id="pd-recintos"></div>
      <button class="btn-secundario" id="pd-btn-añadir-rec" style="width:100%;margin-top:8px">
        📌 Añadir recinto clicando en el mapa
      </button>
    </div>

    <div class="panel-acciones">
      <button class="btn-primario" id="pd-guardar">💾 Guardar campaña ${DATOS.getCampana()}</button>
      <button class="btn-secundario" id="pd-editar-nombre">✏️ Renombrar campo</button>
      <button class="btn-danger"   id="pd-eliminar">🗑 Eliminar campo</button>
    </div>
  `;

  renderRecintosPanel(campo);

  // Eventos del panel
  document.getElementById('pd-guardar').addEventListener('click', () => {
    DATOS.setDatosCampana(campoId, {
      cultivo: document.getElementById('pd-cultivo').value,
      variedad: document.getElementById('pd-variedad').value,
      fechaSiembra: document.getElementById('pd-fecha').value,
      notas: document.getElementById('pd-notas').value
    });
    renderListaCampos(document.getElementById('buscador').value);
    toast('Datos guardados para campaña ' + DATOS.getCampana());
  });

  document.getElementById('pd-btn-añadir-rec').addEventListener('click', () => {
    setModo('añadir');
    toast('Haz clic en el mapa para añadir un recinto al campo ' + campo.nombre, 'info');
  });

  document.getElementById('pd-editar-nombre').addEventListener('click', () => {
    abrirModalEditar(campoId);
  });

  document.getElementById('pd-eliminar').addEventListener('click', () => {
    if (confirm(`¿Eliminar el campo "${campo.nombre}"? No se puede deshacer.`)) {
      DATOS.eliminarCampo(campoId);
      cerrarPanelDer();
      MAPA.pintarCampos(DATOS.getCampos());
      renderListaCampos();
    }
  });
}

function renderRecintosPanel(campo) {
  const lista = document.getElementById('pd-recintos');
  if (!lista) return;
  lista.innerHTML = '';
  for (const clave of campo.recintos) {
    const geo = MAPA.getGeometria(clave);
    const partes = clave.split('-');
    const ref = `Pol.${partes[2]} Parc.${partes[3]} Rec.${partes[4]}`;
    const sup = geo ? geo.superficie.toFixed(2) + ' ha' : '— ha';
    const uso = geo ? geo.uso : '—';
    const div = document.createElement('div');
    div.className = 'recinto-row';
    div.innerHTML = `
      <span class="recinto-ref">${ref}</span>
      <span class="recinto-sup">${sup}</span>
      <span class="recinto-uso">${uso}</span>
      <button class="btn-recinto-eliminar" title="Quitar recinto" data-clave="${clave}">✕</button>
    `;
    div.querySelector('.btn-recinto-eliminar').addEventListener('click', () => {
      DATOS.quitarRecinto(campo.id, clave);
      MAPA.pintarCampos(DATOS.getCampos());
      abrirPanelDer(campo.id);
    });
    lista.appendChild(div);
  }
}

function cerrarPanelDer() {
  campoActivoId = null;
  document.getElementById('panel-der').classList.add('oculto');
  document.querySelectorAll('.campo-item').forEach(el => el.classList.remove('activo'));
  MAPA.seleccionarCampo(null);
}

// ── MODOS DE LA BARRA ─────────────────────────────────────────────────────
function setModo(modo) {
  MAPA.setModo(modo);

  document.querySelectorAll('.modo-btn[data-modo]').forEach(btn => {
    btn.classList.toggle('activo', btn.dataset.modo === modo);
  });

  const instruccion = document.getElementById('instruccion-mapa');
  const msgs = {
    ver:    null,
    nuevo:  '✏️ Dibuja el perímetro del campo en el mapa',
    añadir: '📌 Haz clic en una parcela para añadirla al campo seleccionado',
  };

  if (msgs[modo]) {
    instruccion.textContent = msgs[modo];
    instruccion.style.display = 'block';
  } else {
    instruccion.style.display = 'none';
  }

  if (modo === 'nuevo') {
    MAPA.activarDibujo((recintos) => {
      abrirModalNuevoCampo(recintos);
      setModo('ver');
    });
  } else {
    MAPA.desactivarDibujo();
  }
}

// ── CALLBACKS DEL MAPA ────────────────────────────────────────────────────
function onClicRecinto(clave, campoId, geoData) {
  const modo = MAPA.getModo();

  if (modo === 'ver' || modo === 'consultar') {
    // Mostrar popup informativo
    mostrarInfoRecinto(clave, campoId, geoData);
    return;
  }

  if (modo === 'añadir' && campoActivoId) {
    const campo = DATOS.getCampo(campoActivoId);
    if (!campo) return;
    if (campo.recintos.includes(clave)) {
      toast('Este recinto ya está en el campo', 'warn');
      return;
    }
    DATOS.añadirRecinto(campoActivoId, clave);
    MAPA.pintarCampos(DATOS.getCampos());
    abrirPanelDer(campoActivoId);
    const partes = clave.split('-');
    toast(`Recinto Pol.${partes[2]} Parc.${partes[3]} Rec.${partes[4]} añadido`);
  }
}

function onClicVacio({ lng, lat }) {
  // Sin acción en modo ver
}

function mostrarInfoRecinto(clave, campoId, geoData) {
  const partes = clave.split('-');
  const campoNombre = campoId ? (DATOS.getCampo(campoId) || {}).nombre : '—';
  const sup = geoData ? geoData.superficie : '—';
  const uso = geoData ? geoData.uso : '—';

  const html = `
    <b>Recinto SIGPAC</b><br>
    Pol. ${partes[2]} · Parc. ${partes[3]} · Rec. ${partes[4]}<br>
    Superficie: <b>${sup} ha</b><br>
    Uso: <b>${uso}</b><br>
    Campo: <b>${campoNombre}</b>
  `;

  L.popup()
    .setLatLng(MAPA.getMapaInstance().getCenter())
    .setContent(html)
    .openOn(MAPA.getMapaInstance());
}

// ── MODAL NUEVO CAMPO ─────────────────────────────────────────────────────
function abrirModalNuevoCampo(recintosDetectados) {
  document.getElementById('modal-titulo').textContent = 'Nuevo campo';
  const cuerpo = document.getElementById('modal-cuerpo');

  cuerpo.innerHTML = `
    <div class="form-group">
      <label>Nombre del campo (paraje)</label>
      <input type="text" id="modal-nombre" placeholder="Ej: FILADERO, C4, JORGES..." autofocus/>
    </div>
    <div class="form-group">
      <label>Recintos detectados (${recintosDetectados.length})</label>
      <div class="recintos-seleccion">
        ${recintosDetectados.map(r => {
          const partes = r.clave.split('-');
          const sup = r.recinto ? r.recinto.superficie.toFixed(2) : '—';
          const uso = r.recinto ? r.recinto.uso : '—';
          return `
            <label class="recinto-check">
              <input type="checkbox" name="rec" value="${r.clave}" checked/>
              <span>Pol.${partes[2]} Parc.${partes[3]} Rec.${partes[4]}</span>
              <span style="margin-left:auto;color:var(--acento)">${sup} ha</span>
              <span style="color:var(--texto2);font-size:11px">${uso}</span>
            </label>
          `;
        }).join('') || '<p style="color:var(--texto2);font-size:12px">No se detectaron recintos. Puedes añadirlos manualmente.</p>'}
      </div>
    </div>
  `;

  abrirModal(() => {
    const nombre = document.getElementById('modal-nombre').value.trim();
    if (!nombre) { toast('Introduce un nombre para el campo', 'warn'); return false; }
    const recintos = [...document.querySelectorAll('input[name=rec]:checked')].map(i => i.value);
    const id = DATOS.crearCampo(nombre, recintos);
    MAPA.pintarCampos(DATOS.getCampos());
    renderListaCampos();
    seleccionarCampo(id);
    return true;
  });
}

// ── MODAL EDITAR CAMPO ────────────────────────────────────────────────────
function abrirModalEditar(campoId) {
  const campo = DATOS.getCampo(campoId);
  document.getElementById('modal-titulo').textContent = 'Renombrar campo';
  document.getElementById('modal-cuerpo').innerHTML = `
    <div class="form-group">
      <label>Nombre del campo</label>
      <input type="text" id="modal-nombre" value="${campo.nombre}" autofocus/>
    </div>
  `;
  abrirModal(() => {
    const nombre = document.getElementById('modal-nombre').value.trim();
    if (!nombre) return false;
    DATOS.editarCampo(campoId, { nombre });
    renderListaCampos();
    document.getElementById('campo-nombre-titulo').textContent = nombre;
    return true;
  });
}

// ── MODAL BASE ────────────────────────────────────────────────────────────
let _modalGuardarCb = null;

function abrirModal(onGuardar) {
  _modalGuardarCb = onGuardar;
  document.getElementById('modal-overlay').classList.remove('oculto');
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.add('oculto');
  _modalGuardarCb = null;
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function toast(msg, tipo = 'ok') {
  const contenedor = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = `toast-msg ${tipo === 'ok' ? '' : tipo}`;
  el.textContent = msg;
  contenedor.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Hacemos toast global para que mapa.js pueda usarla
window.toast = toast;

// ── EVENTOS ───────────────────────────────────────────────────────────────
function conectarEventos() {
  // Buscador
  document.getElementById('buscador').addEventListener('input', e => {
    renderListaCampos(e.target.value);
  });

  // Botón nuevo campo
  document.getElementById('btn-nuevo-campo').addEventListener('click', () => {
    setModo('nuevo');
  });

  // Barra de modos
  document.querySelectorAll('.modo-btn[data-modo]').forEach(btn => {
    btn.addEventListener('click', () => setModo(btn.dataset.modo));
  });

  // Capa SIGPAC
  document.getElementById('btn-capa-sigpac').addEventListener('click', function() {
    const activa = MAPA.toggleCapaSIGPAC();
    this.classList.toggle('capa-on', activa);
  });

  // Cerrar panel derecho
  document.getElementById('btn-cerrar-panel').addEventListener('click', cerrarPanelDer);

  // Modal
  document.getElementById('modal-cerrar').addEventListener('click', cerrarModal);
  document.getElementById('modal-cancelar').addEventListener('click', cerrarModal);
  document.getElementById('modal-guardar').addEventListener('click', () => {
    if (_modalGuardarCb && _modalGuardarCb()) cerrarModal();
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) cerrarModal();
  });

  // Campaña
  document.getElementById('sel-campana').addEventListener('change', e => {
    DATOS.setCampana(e.target.value);
    if (campoActivoId) abrirPanelDer(campoActivoId);
    renderListaCampos();
  });
}
