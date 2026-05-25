// ══════════════════════════════════════════════════════════════════════════
//  MAPA.JS — Lógica del mapa Leaflet y conexión con SIGPAC
//  No toca el DOM fuera del mapa. Emite eventos para que app.js responda.
// ══════════════════════════════════════════════════════════════════════════

const MAPA = (() => {

  let mapa = null;
  let geometriasCache = {};     // clave → {geometry, ...} del servidor
  let capasPolygonos = {};      // campoId → array de L.Polygon
  let capaWMS = null;
  let capaSIGPACActiva = false;
  let modoActual = 'ver';
  let campoSeleccionado = null;

  // Callbacks que app.js registra
  let onClicRecinto = null;
  let onClicVacio = null;

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init(callbacks) {
    onClicRecinto = callbacks.onClicRecinto;
    onClicVacio   = callbacks.onClicVacio;

    mapa = L.map('mapa', {
      center: [41.63, 0.33],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri World Imagery',
      maxZoom: 20
    }).addTo(mapa);

    mapa.on('click', onClicMapa);
  }

  // ── CARGAR GEOMETRÍAS DEL SERVIDOR ───────────────────────────────────────
  async function cargarGeometrias() {
    try {
      const res = await fetch('/geometrias');
      if (!res.ok) throw new Error('Sin respuesta');
      geometriasCache = await res.json();
      return Object.keys(geometriasCache).length;
    } catch(e) {
      console.warn('No se pudieron cargar geometrías:', e);
      return 0;
    }
  }

  // ── PINTAR TODOS LOS CAMPOS ───────────────────────────────────────────────
  function pintarCampos(campos) {
    // Limpiar capas existentes
    Object.values(capasPolygonos).forEach(arr => arr.forEach(p => mapa.removeLayer(p)));
    capasPolygonos = {};

    for (const campo of campos) {
      const colas = [];
      for (const clave of campo.recintos) {
        const geo = geometriasCache[clave];
        if (!geo || !geo.geometry) continue;
        const poly = crearPoligono(clave, geo, campo);
        colas.push(poly);
      }
      capasPolygonos[campo.id] = colas;
    }
  }

  function crearPoligono(clave, geoData, campo) {
    const coords = geoJSONaLeaflet(geoData.geometry);
    if (!coords) return null;

    const poly = L.polygon(coords, {
      color: campo.color,
      fillColor: campo.color,
      weight: 2,
      fillOpacity: 0.25,
      opacity: 0.8
    }).addTo(mapa);

    poly._claveRecinto = clave;
    poly._campoId = campo.id;

    poly.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      if (modoActual === 'consultar' || modoActual === 'ver') {
        if (onClicRecinto) onClicRecinto(clave, campo.id, geoData);
      } else if (modoActual === 'añadir' && campoSeleccionado) {
        if (onClicRecinto) onClicRecinto(clave, campo.id, geoData);
      }
    });

    poly.on('mouseover', () => {
      if (campo.id !== campoSeleccionado) {
        poly.setStyle({ fillOpacity: 0.4 });
      }
    });

    poly.on('mouseout', () => {
      if (campo.id !== campoSeleccionado) {
        poly.setStyle({ fillOpacity: 0.25 });
      }
    });

    return poly;
  }

  // ── SELECCIONAR CAMPO ─────────────────────────────────────────────────────
  function seleccionarCampo(campoId) {
    // Resetear todos
    Object.entries(capasPolygonos).forEach(([id, polys]) => {
      polys.forEach(p => {
        if (!p) return;
        const campo = DATOS.getCampo(id);
        p.setStyle({
          weight: 2,
          fillOpacity: 0.25,
          opacity: 0.8,
          color: campo ? campo.color : '#fff'
        });
      });
    });

    campoSeleccionado = campoId;

    if (!campoId) return;

    // Resaltar campo seleccionado
    const polys = capasPolygonos[campoId] || [];
    const campo = DATOS.getCampo(campoId);
    polys.forEach(p => {
      if (!p) return;
      p.setStyle({
        weight: 3,
        fillOpacity: 0.6,
        opacity: 1,
        color: '#fff'
      });
    });

    // Hacer zoom al campo
    if (polys.length > 0) {
      const group = L.featureGroup(polys.filter(Boolean));
      if (group.getBounds().isValid()) {
        mapa.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 17 });
      }
    }
  }

  // ── TOOLTIP DE HOVER (capa SIGPAC activa) ────────────────────────────────
  let tooltipEl = null;
  let hoverTimeout = null;

  function crearTooltip() {
    if (tooltipEl) return;
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'sigpac-tooltip';
    tooltipEl.style.cssText = `
      position: fixed;
      background: rgba(20,25,20,0.92);
      color: #e8ead5;
      border: 1px solid #3a4035;
      border-left: 3px solid #95d44a;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.6;
      pointer-events: none;
      z-index: 9999;
      display: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      max-width: 220px;
    `;
    document.body.appendChild(tooltipEl);
  }

  function activarHoverSIGPAC() {
    crearTooltip();
    mapa.on('mousemove', onMouseMoveMapa);
    mapa.on('mouseout', ocultarTooltip);
  }

  function desactivarHoverSIGPAC() {
    mapa.off('mousemove', onMouseMoveMapa);
    mapa.off('mouseout', ocultarTooltip);
    ocultarTooltip();
  }

  function ocultarTooltip() {
    clearTimeout(hoverTimeout);
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  async function onMouseMoveMapa(e) {
    if (!capaSIGPACActiva) return;

    // Mover tooltip con el ratón
    const mouseEvent = e.originalEvent;
    if (tooltipEl) {
      tooltipEl.style.left = (mouseEvent.clientX + 16) + 'px';
      tooltipEl.style.top  = (mouseEvent.clientY - 10) + 'px';
    }

    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(async () => {
      const { lng, lat } = e.latlng;

      // Buscar recinto bajo el ratón
      for (const [clave, rec] of Object.entries(geometriasCache)) {
        if (rec.geometry && puntoEnPoligono([lng, lat], rec.geometry)) {
          mostrarTooltipRecinto(clave, rec);
          return;
        }
      }

      // Si no está en caché, preguntar al servidor
      try {
        const res = await fetch(`/punto?lng=${lng}&lat=${lat}`);
        const data = await res.json();
        if (data.encontrado) {
          geometriasCache[data.clave] = data.recinto;
          mostrarTooltipRecinto(data.clave, data.recinto);
        } else {
          ocultarTooltip();
        }
      } catch(e) {
        ocultarTooltip();
      }
    }, 300);
  }

  function mostrarTooltipRecinto(clave, rec) {
    if (!tooltipEl) return;
    const partes = clave.split('-');
    const sup = rec.superficie ? Number(rec.superficie).toFixed(2) : '—';
    const uso = rec.uso || '—';

    // Ver si pertenece a algún campo
    const campo = Object.values({}).find ? null : null; // lo resuelve app.js

    tooltipEl.innerHTML = `
      <div style="font-weight:700;color:#95d44a;margin-bottom:4px">Recinto SIGPAC</div>
      <div>Pol. <b>${partes[2]}</b> · Parc. <b>${partes[3]}</b> · Rec. <b>${partes[4]}</b></div>
      <div>Superficie: <b>${sup} ha</b></div>
      <div>Uso: <b>${uso}</b></div>
    `;
    tooltipEl.style.display = 'block';
  }

  // ── CLIC EN EL MAPA ───────────────────────────────────────────────────────
  async function onClicMapa(e) {
    if (modoActual === 'ver') return;

    const { lng, lat } = e.latlng;

    if (modoActual === 'añadir' && !campoSeleccionado) {
      toast('Selecciona primero un campo en la lista', 'warn');
      return;
    }

    if (modoActual === 'añadir') {
      const resultado = await consultarPunto(lng, lat);
      if (resultado && onClicRecinto) {
        onClicRecinto(resultado.clave, null, resultado.recinto);
      } else {
        if (onClicVacio) onClicVacio({ lng, lat });
      }
    }
  }

  // ── CONSULTAR PUNTO AL SERVIDOR ───────────────────────────────────────────
  async function consultarPunto(lng, lat) {
    // 1. Buscar en cache local por ray-casting
    for (const [clave, rec] of Object.entries(geometriasCache)) {
      if (rec.geometry && puntoEnPoligono([lng, lat], rec.geometry)) {
        return { clave, recinto: rec };
      }
    }

    // 2. Preguntar al servidor
    try {
      const res = await fetch(`/punto?lng=${lng}&lat=${lat}`);
      const data = await res.json();
      if (data.encontrado) {
        geometriasCache[data.clave] = data.recinto;
        return { clave: data.clave, recinto: data.recinto };
      }
    } catch(e) {}

    return null;
  }

  // ── MODO DE LA BARRA ──────────────────────────────────────────────────────
  function setModo(modo) {
    modoActual = modo;
  }

  function getModo() { return modoActual; }

  // ── CAPA SIGPAC ───────────────────────────────────────────────────────────
  function toggleCapaSIGPAC() {
    capaSIGPACActiva = !capaSIGPACActiva;
    if (capaSIGPACActiva) {
      capaWMS = L.tileLayer.wms('/wms', {
        layers: 'AU.Sigpac:recinto',
        styles: 'recinto',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        crs: L.CRS.EPSG4326,
        opacity: 0.7,
        maxZoom: 20,
        attribution: 'SIGPAC © FEGA'
      }).addTo(mapa);
      activarHoverSIGPAC();
    } else {
      if (capaWMS) { mapa.removeLayer(capaWMS); capaWMS = null; }
      desactivarHoverSIGPAC();
    }
    return capaSIGPACActiva;
  }

  // ── DIBUJAR ÁREA (nuevo campo) ────────────────────────────────────────────
  let drawControl = null;
  let capaDibujo = null;

  function activarDibujo(onDibujado) {
    if (capaDibujo) mapa.removeLayer(capaDibujo);
    capaDibujo = new L.FeatureGroup().addTo(mapa);

    drawControl = new L.Control.Draw({
      draw: {
        polygon: { shapeOptions: { color: '#95d44a', fillOpacity: 0.2 } },
        rectangle: false, circle: false, circlemarker: false,
        marker: false, polyline: false
      },
      edit: { featureGroup: capaDibujo }
    }).addTo(mapa);

    mapa.once('draw:created', (e) => {
      const layer = e.layer;
      capaDibujo.addLayer(layer);
      const bounds = layer.getBounds();
      desactivarDibujo();
      // Buscar recintos dentro del área dibujada
      buscarRecintosDentro(layer, onDibujado);
    });
  }

  function desactivarDibujo() {
    if (drawControl) { mapa.removeControl(drawControl); drawControl = null; }
    if (capaDibujo) { mapa.removeLayer(capaDibujo); capaDibujo = null; }
  }

  async function buscarRecintosDentro(layer, callback) {
    const bounds = layer.getBounds();
    const encontrados = [];

    // Buscar en cache
    for (const [clave, rec] of Object.entries(geometriasCache)) {
      if (rec.geometry) {
        const centroide = getCentroide(rec.geometry);
        if (centroide && bounds.contains(L.latLng(centroide[1], centroide[0]))) {
          encontrados.push({ clave, recinto: rec });
        }
      }
    }

    // Consultar puntos dentro del área al servidor
    const { south: s, north: n, west: w, east: e } = bounds;
    const pasos = 4;
    const promises = [];
    for (let i = 0; i <= pasos; i++) {
      for (let j = 0; j <= pasos; j++) {
        const lat = s + (n - s) * (i / pasos);
        const lng = w + (e - w) * (j / pasos);
        promises.push(consultarPunto(lng, lat));
      }
    }

    const resultados = await Promise.all(promises);
    for (const r of resultados) {
      if (r && !encontrados.find(e => e.clave === r.clave)) {
        encontrados.push(r);
      }
    }

    callback(encontrados);
  }

  // ── PINTAR UN RECINTO TEMPORAL (para preview) ─────────────────────────────
  let capaPreview = null;

  function mostrarPreviewRecinto(clave, color) {
    if (capaPreview) { mapa.removeLayer(capaPreview); capaPreview = null; }
    const geo = geometriasCache[clave];
    if (!geo || !geo.geometry) return;
    const coords = geoJSONaLeaflet(geo.geometry);
    if (!coords) return;
    capaPreview = L.polygon(coords, {
      color: color || '#95d44a',
      fillColor: color || '#95d44a',
      weight: 3,
      fillOpacity: 0.5,
      dashArray: '8,4'
    }).addTo(mapa);
    mapa.fitBounds(capaPreview.getBounds(), { padding: [40,40], maxZoom: 18 });
  }

  function limpiarPreview() {
    if (capaPreview) { mapa.removeLayer(capaPreview); capaPreview = null; }
  }

  // ── UTILIDADES ────────────────────────────────────────────────────────────
  function geoJSONaLeaflet(geometry) {
    if (!geometry) return null;
    try {
      if (geometry.type === 'Polygon') {
        return geometry.coordinates.map(ring => ring.map(([lng, lat]) => [lat, lng]));
      }
      if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.map(poly => poly.map(ring => ring.map(([lng, lat]) => [lat, lng])));
      }
    } catch(e) {}
    return null;
  }

  function puntoEnPoligono(punto, geometry) {
    if (!geometry) return false;
    const [x, y] = punto;
    const rings = geometry.type === 'Polygon' ? geometry.coordinates :
                  geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
    for (const ring of rings) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      if (inside) return true;
    }
    return false;
  }

  function getCentroide(geometry) {
    try {
      const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] :
                     geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] : null;
      if (!coords || coords.length === 0) return null;
      const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      return [lng, lat];
    } catch(e) { return null; }
  }

  function getGeometria(clave) { return geometriasCache[clave]; }
  function getMapaInstance() { return mapa; }

  return {
    init, cargarGeometrias, pintarCampos,
    seleccionarCampo, setModo, getModo,
    toggleCapaSIGPAC, activarDibujo, desactivarDibujo,
    consultarPunto, mostrarPreviewRecinto, limpiarPreview,
    getGeometria, getMapaInstance
  };
})();
