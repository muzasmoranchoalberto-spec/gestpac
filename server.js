const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_FILE = path.join(__dirname, 'cache', 'geometrias.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CACHE EN MEMORIA ───────────────────────────────────────────────────────
let cacheRecintos = {}; // clave: "pr-mu-pol-par-rec" → {geometry, superficie, uso, ...}

function cargarCacheDescoDisc() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      cacheRecintos = data;
      console.log(`  📁 Caché cargado: ${Object.keys(cacheRecintos).length} recintos desde disco`);
    }
  } catch(e) {
    console.log('  ⚠️  No hay caché previo, arrancando vacío');
    cacheRecintos = {};
  }
}

function guardarCacheEnDisco() {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheRecintos));
  } catch(e) {
    // silencioso
  }
}

// ─── DESCARGAR UNA PARCELA DEL SIGPAC ───────────────────────────────────────
async function descargarParcela(pr, mu, pol, par) {
  const url = `https://sigpac-hubcloud.es/servicioconsultassigpac/query/recinfoparc/${pr}/${mu}/0/0/${pol}/${par}.geojson`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://sigpac.mapa.gob.es/' },
      timeout: 10000
    });
    if (!res.ok) return null;
    const geojson = await res.json();
    if (!geojson.features || geojson.features.length === 0) return null;

    let nuevos = 0;
    for (const feat of geojson.features) {
      const p = feat.properties;
      const rec = String(p.recinto || p.RECINTO || '').replace(/\D/g, '');
      const superficie = p.dn_surface || p.sup_gis || p.SUP_GIS || p.superficie || p.sup_declarada || p.area || 0;
      const uso = p.uso_sigpac || p.USO_SIGPAC || '';
      if (!rec) continue;
      const clave = `${pr}-${mu}-${pol}-${par}-${rec}`;
      if (!cacheRecintos[clave]) {
        cacheRecintos[clave] = {
          pr: Number(pr), mu: Number(mu), pol: Number(pol), par: Number(par), rec: Number(rec),
          superficie: Number(superficie),
          uso,
          geometry: feat.geometry
        };
        nuevos++;
      }
    }
    return nuevos;
  } catch(e) {
    return null;
  }
}

// ─── CARGA INICIAL: TUS PARCELAS DEL EXCEL ──────────────────────────────────
const parcelasBase = [[22, 349, 8, 101], [22, 349, 8, 102], [22, 349, 8, 135], [22, 349, 8, 152], [22, 349, 8, 153], [22, 349, 8, 158], [22, 349, 8, 159], [22, 349, 8, 160], [22, 349, 8, 161], [22, 349, 8, 164], [22, 349, 8, 165], [22, 349, 8, 166], [22, 349, 8, 167], [22, 349, 8, 169], [22, 349, 8, 170], [22, 349, 8, 172], [22, 349, 8, 173], [22, 349, 8, 175], [22, 349, 8, 176], [22, 349, 8, 177], [22, 349, 8, 178], [22, 349, 8, 179], [22, 349, 8, 183], [22, 349, 8, 184], [22, 349, 8, 186], [22, 349, 8, 187], [22, 349, 8, 189], [22, 349, 8, 197], [22, 349, 8, 215], [22, 349, 8, 224], [22, 349, 8, 227], [22, 349, 8, 253], [22, 349, 8, 256], [22, 349, 8, 272], [22, 349, 8, 273], [22, 349, 8, 290], [22, 349, 9, 155], [22, 349, 9, 159], [22, 349, 9, 162], [22, 349, 9, 163], [22, 349, 9, 186], [22, 349, 9, 190], [22, 349, 9, 191], [22, 349, 9, 192], [22, 349, 9, 193], [22, 349, 9, 194], [22, 349, 9, 221], [22, 349, 9, 222], [22, 349, 9, 223], [22, 349, 9, 225], [22, 349, 9, 226], [22, 349, 9, 230], [22, 349, 9, 231], [22, 349, 9, 232], [22, 349, 9, 233], [22, 349, 9, 234], [22, 349, 9, 235], [22, 349, 9, 242], [22, 349, 9, 243], [22, 349, 9, 244], [22, 349, 9, 245], [22, 349, 9, 246], [22, 349, 9, 247], [22, 349, 9, 250], [22, 349, 9, 271]];

async function cargaInicial() {
  if (Object.keys(cacheRecintos).length > 50) {
    console.log(`  ✅ Usando caché existente (${Object.keys(cacheRecintos).length} recintos)`);
    return;
  }
  console.log(`  📥 Descargando ${parcelasBase.length} parcelas del SIGPAC...`);
  let ok = 0;
  for (const [pr, mu, pol, par] of parcelasBase) {
    const n = await descargarParcela(pr, mu, pol, par);
    if (n !== null) ok++;
    if (ok % 10 === 0) process.stdout.write(`\r     ${ok}/${parcelasBase.length} parcelas`);
  }
  console.log(`\n  ✅ Carga completa: ${Object.keys(cacheRecintos).length} recintos`);
  guardarCacheEnDisco();
}

// ─── ENDPOINTS ──────────────────────────────────────────────────────────────

// Estado del servidor
app.get('/status', (req, res) => {
  res.json({
    version: '6.0.0',
    recintos: Object.keys(cacheRecintos).length,
    estado: 'ok'
  });
});

// Todas las geometrías para pintar en el mapa
app.get('/geometrias', (req, res) => {
  res.json(cacheRecintos);
});

// Consulta por punto (clic en el mapa)
app.get('/punto', async (req, res) => {
  const { lng, lat } = req.query;
  if (!lng || !lat) return res.status(400).json({ error: 'Faltan coordenadas' });

  // 1. Buscar en caché por ray-casting
  const punto = [parseFloat(lng), parseFloat(lat)];
  for (const [clave, r] of Object.entries(cacheRecintos)) {
    if (r.geometry && pointInPolygon(punto, r.geometry)) {
      return res.json({ encontrado: true, clave, recinto: r });
    }
  }

  // 2. Consultar al SIGPAC en tiempo real
  try {
    const gfiUrl = `https://sigpac-hubcloud.es/wms/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=AU.Sigpac:recinto&QUERY_LAYERS=AU.Sigpac:recinto&INFO_FORMAT=application/json&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:4326&STYLES=&BBOX=${parseFloat(lat)-0.001},${parseFloat(lng)-0.001},${parseFloat(lat)+0.001},${parseFloat(lng)+0.001}`;
    const gfiRes = await fetch(gfiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://sigpac.mapa.gob.es/' },
      timeout: 8000
    });
    if (gfiRes.ok) {
      const gfi = await gfiRes.json();
      if (gfi.features && gfi.features.length > 0) {
        const p = gfi.features[0].properties;
        const pr = String(p.provincia||'').replace(/\D/g,'');
        const mu = String(p.municipio||'').replace(/\D/g,'');
        const pol = String(p.poligono||p.pol||'').replace(/\D/g,'');
        const par = String(p.parcela||p.par||'').replace(/\D/g,'');
        const rec = String(p.recinto||p.rec||'').replace(/\D/g,'');
        if (pr && mu && pol && par && rec) {
          const clave = `${pr}-${mu}-${pol}-${par}-${rec}`;
          // Descargar geometría completa de esa parcela
          await descargarParcela(pr, mu, pol, par);
          guardarCacheEnDisco();
          const recinto = cacheRecintos[clave];
          if (recinto) return res.json({ encontrado: true, clave, recinto });
        }
      }
    }
  } catch(e) {}

  res.json({ encontrado: false });
});

// Consulta parcela concreta por referencia
app.get('/parcela/:pr/:mu/:pol/:par', async (req, res) => {
  const { pr, mu, pol, par } = req.params;
  await descargarParcela(pr, mu, pol, par);
  guardarCacheEnDisco();
  const recintos = Object.entries(cacheRecintos)
    .filter(([k]) => k.startsWith(`${pr}-${mu}-${pol}-${par}-`))
    .map(([k, v]) => ({ clave: k, ...v }));
  res.json({ recintos });
});

// Proxy WMS para la capa visual
app.get('/wms', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const url = `https://sigpac-hubcloud.es/wms/ows?${params}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://sigpac.mapa.gob.es/' },
      timeout: 10000
    });
    res.set('Content-Type', r.headers.get('content-type') || 'image/png');
    res.set('Access-Control-Allow-Origin', '*');
    r.body.pipe(res);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── RAY CASTING ────────────────────────────────────────────────────────────
function pointInPolygon(point, geometry) {
  if (!geometry) return false;
  const [x, y] = point;
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

// ─── ARRANQUE ───────────────────────────────────────────────────────────────
console.log('\n  ╔══════════════════════════════════════════╗');
console.log('  ║        GestPAC v6 — Iniciando...        ║');
console.log('  ╚══════════════════════════════════════════╝\n');

cargarCacheDescoDisc();
cargaInicial().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║   ✅ App lista: http://localhost:${PORT}     ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);
  });
});
