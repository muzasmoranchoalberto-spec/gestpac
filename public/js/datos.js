// ══════════════════════════════════════════════════════════════════════════
//  DATOS.JS — Gestión de campos, recintos y campañas
//  Datos reales generados desde BORRADOR CULTIVOS PAC 26.xlsx
// ══════════════════════════════════════════════════════════════════════════

const DATOS = (() => {

  const CAMPOS_BASE = [
    {
        "id": "C1",
        "nombre": "C1",
        "color": "#e05c5c",
        "recintos": [
            "22-349-9-242-1",
            "22-349-9-243-1",
            "22-349-9-243-3",
            "22-349-9-243-4"
        ]
    },
    {
        "id": "C2",
        "nombre": "C2",
        "color": "#e0883a",
        "recintos": [
            "22-349-9-246-1"
        ]
    },
    {
        "id": "C4",
        "nombre": "C4",
        "color": "#d4c23a",
        "recintos": [
            "22-349-8-101-1",
            "22-349-8-101-2",
            "22-349-8-101-3",
            "22-349-8-102-2",
            "22-349-8-102-3",
            "22-349-8-102-4",
            "22-349-8-172-4",
            "22-349-8-172-13",
            "22-349-8-172-14",
            "22-349-8-173-1",
            "22-349-8-178-3",
            "22-349-8-179-2",
            "22-349-8-183-2",
            "22-349-8-183-3"
        ]
    },
    {
        "id": "C5",
        "nombre": "C5",
        "color": "#95d44a",
        "recintos": [
            "22-349-8-186-1",
            "22-349-8-187-2"
        ]
    },
    {
        "id": "CHATA",
        "nombre": "CHATA",
        "color": "#3abf80",
        "recintos": [
            "22-349-9-234-1",
            "22-349-9-235-1"
        ]
    },
    {
        "id": "FAJAS",
        "nombre": "FAJAS",
        "color": "#3ab5e0",
        "recintos": [
            "22-349-8-215-1",
            "22-349-8-224-1",
            "22-349-8-227-1"
        ]
    },
    {
        "id": "FERRERA",
        "nombre": "FERRERA",
        "color": "#3a70e0",
        "recintos": [
            "22-349-8-253-2",
            "22-349-8-253-3",
            "22-349-8-253-4",
            "22-349-8-253-12",
            "22-349-8-253-13"
        ]
    },
    {
        "id": "FILADERO",
        "nombre": "FILADERO",
        "color": "#7a3ae0",
        "recintos": [
            "22-349-8-152-7",
            "22-349-8-169-1",
            "22-349-8-170-5",
            "22-349-8-170-9",
            "22-349-8-170-10"
        ]
    },
    {
        "id": "FILDERO",
        "nombre": "FILDERO",
        "color": "#c03ae0",
        "recintos": [
            "22-349-8-152-5"
        ]
    },
    {
        "id": "JORGES",
        "nombre": "JORGES",
        "color": "#e03aaa",
        "recintos": [
            "22-349-9-159-1",
            "22-349-9-159-5",
            "22-349-9-159-6",
            "22-349-9-159-9",
            "22-349-9-162-1",
            "22-349-9-162-2",
            "22-349-9-162-3",
            "22-349-9-162-4",
            "22-349-9-162-5",
            "22-349-9-162-6",
            "22-349-9-162-9",
            "22-349-9-162-10",
            "22-349-9-162-13",
            "22-349-9-162-14",
            "22-349-9-162-15",
            "22-349-9-162-17",
            "22-349-9-162-18",
            "22-349-9-162-19",
            "22-349-9-162-20",
            "22-349-9-245-1",
            "22-349-9-245-2"
        ]
    },
    {
        "id": "JULIA",
        "nombre": "JULIA",
        "color": "#e03a60",
        "recintos": [
            "22-349-9-221-1",
            "22-349-9-233-11"
        ]
    },
    {
        "id": "MONCALVOS",
        "nombre": "MONCALVOS",
        "color": "#40c0a0",
        "recintos": [
            "22-349-9-190-1",
            "22-349-9-190-2",
            "22-349-9-190-3",
            "22-349-9-190-4",
            "22-349-9-190-5",
            "22-349-9-190-6",
            "22-349-9-191-1",
            "22-349-9-191-2",
            "22-349-9-191-3",
            "22-349-9-191-4",
            "22-349-9-191-6",
            "22-349-9-192-1",
            "22-349-9-192-2",
            "22-349-9-192-3",
            "22-349-9-193-1"
        ]
    },
    {
        "id": "NOI",
        "nombre": "NOI",
        "color": "#c06040",
        "recintos": [
            "22-349-8-175-2",
            "22-349-8-176-4",
            "22-349-8-177-2"
        ]
    },
    {
        "id": "P1_P2",
        "nombre": "P1-P2",
        "color": "#80c040",
        "recintos": [
            "22-349-9-247-1",
            "22-349-9-247-3",
            "22-349-9-247-5",
            "22-349-9-250-1",
            "22-349-9-250-5",
            "22-349-9-250-12"
        ]
    },
    {
        "id": "P3_P4",
        "nombre": "P3-P4",
        "color": "#c040a0",
        "recintos": [
            "22-349-8-135-3",
            "22-349-8-135-7",
            "22-349-8-135-9",
            "22-349-8-135-11",
            "22-349-8-135-14",
            "22-349-8-135-30",
            "22-349-9-271-3",
            "22-349-9-271-6"
        ]
    },
    {
        "id": "P7",
        "nombre": "P7",
        "color": "#a0b020",
        "recintos": [
            "22-349-8-164-3"
        ]
    },
    {
        "id": "P8_P9",
        "nombre": "P8-P9",
        "color": "#60c080",
        "recintos": [
            "22-349-9-186-4",
            "22-349-9-194-1",
            "22-349-9-194-4",
            "22-349-9-194-5",
            "22-349-9-194-6",
            "22-349-9-194-7"
        ]
    },
    {
        "id": "PIRRI",
        "nombre": "PIRRI",
        "color": "#e0c040",
        "recintos": [
            "22-349-9-244-1",
            "22-349-9-244-4",
            "22-349-9-244-5",
            "22-349-9-244-6"
        ]
    },
    {
        "id": "RAMON",
        "nombre": "RAMON",
        "color": "#4060e0",
        "recintos": [
            "22-349-9-222-1",
            "22-349-9-222-2",
            "22-349-9-225-1"
        ]
    },
    {
        "id": "SIN_PARAJE",
        "nombre": "SIN PARAJE",
        "color": "#a04020",
        "recintos": [
            "22-349-8-153-1",
            "22-349-8-159-1",
            "22-349-8-160-1",
            "22-349-8-161-1",
            "22-349-8-161-2",
            "22-349-8-161-3",
            "22-349-8-164-2",
            "22-349-8-165-3",
            "22-349-8-166-2",
            "22-349-8-167-1",
            "22-349-8-167-4",
            "22-349-8-170-14",
            "22-349-8-173-5",
            "22-349-8-173-10",
            "22-349-8-176-1",
            "22-349-8-177-3",
            "22-349-8-184-2",
            "22-349-8-184-3",
            "22-349-8-189-1",
            "22-349-8-189-3",
            "22-349-8-197-1",
            "22-349-8-197-2",
            "22-349-8-197-4",
            "22-349-8-197-6",
            "22-349-8-256-3",
            "22-349-9-155-1",
            "22-349-9-155-5",
            "22-349-9-155-7",
            "22-349-9-155-11",
            "22-349-9-155-12",
            "22-349-9-155-13",
            "22-349-9-155-15",
            "22-349-9-155-17",
            "22-349-9-163-4",
            "22-349-9-223-1",
            "22-349-9-223-3",
            "22-349-9-223-4",
            "22-349-9-223-5",
            "22-349-9-226-2",
            "22-349-9-230-1",
            "22-349-9-231-1",
            "22-349-9-232-1",
            "22-349-9-232-2",
            "22-349-9-232-3",
            "22-349-9-233-1",
            "22-349-9-233-2",
            "22-349-9-233-6",
            "22-349-9-233-7",
            "22-349-9-233-10"
        ]
    },
    {
        "id": "VICTOR_PASCUAL",
        "nombre": "VICTOR PASCUAL",
        "color": "#20a080",
        "recintos": [
            "22-349-8-272-5",
            "22-349-8-273-1",
            "22-349-8-290-1"
        ]
    },
    {
        "id": "VALLETA",
        "nombre": "valleta",
        "color": "#e06080",
        "recintos": [
            "22-349-8-158-3"
        ]
    }
];

  let campos = [];
  let campana = '2026';
  let datosCAMPANA = {};

  function init() {
    const guardados = localStorage.getItem('gestpac_campos_v6');
    if (guardados) {
      try { campos = JSON.parse(guardados); }
      catch(e) { campos = CAMPOS_BASE.map(c => ({...c})); }
    } else {
      campos = CAMPOS_BASE.map(c => ({...c}));
    }
    const guardadosCamp = localStorage.getItem('gestpac_campanas_v6');
    if (guardadosCamp) {
      try { datosCAMPANA = JSON.parse(guardadosCamp); }
      catch(e) { datosCAMPANA = {}; }
    }
  }

  function guardar() {
    localStorage.setItem('gestpac_campos_v6', JSON.stringify(campos));
    localStorage.setItem('gestpac_campanas_v6', JSON.stringify(datosCAMPANA));
  }

  function getCampos() { return campos; }
  function getCampo(id) { return campos.find(c => c.id === id); }
  function getCampana() { return campana; }
  function setCampana(c) { campana = c; }

  function getDatosCampana(campoId) {
    return (datosCAMPANA[campana] && datosCAMPANA[campana][campoId]) || {
      cultivo: '', variedad: '', fechaSiembra: '', notas: ''
    };
  }

  function setDatosCampana(campoId, datos) {
    if (!datosCAMPANA[campana]) datosCAMPANA[campana] = {};
    datosCAMPANA[campana][campoId] = datos;
    guardar();
  }

  function crearCampo(nombre, recintos) {
    const id = 'campo_' + Date.now();
    const color = colorAleatorio();
    campos.push({ id, nombre, color, recintos, nuevo: true });
    guardar();
    return id;
  }

  function editarCampo(id, cambios) {
    const idx = campos.findIndex(c => c.id === id);
    if (idx === -1) return false;
    campos[idx] = { ...campos[idx], ...cambios };
    guardar();
    return true;
  }

  function eliminarCampo(id) {
    campos = campos.filter(c => c.id !== id);
    guardar();
  }

  function añadirRecinto(campoId, clave) {
    const campo = getCampo(campoId);
    if (!campo || campo.recintos.includes(clave)) return;
    campo.recintos.push(clave);
    guardar();
  }

  function quitarRecinto(campoId, clave) {
    const campo = getCampo(campoId);
    if (!campo) return;
    campo.recintos = campo.recintos.filter(r => r !== clave);
    guardar();
  }

  function campoDeRecinto(clave) {
    return campos.find(c => c.recintos.includes(clave));
  }

  function colorAleatorio() {
    const paleta = [
      '#e05c5c','#e0883a','#d4c23a','#95d44a','#3abf80','#3ab5e0',
      '#3a70e0','#7a3ae0','#c03ae0','#e03aaa','#e03a60','#40c0a0',
      '#c06040','#80c040','#c040a0','#a0b020','#60c080'
    ];
    return paleta[Math.floor(Math.random() * paleta.length)];
  }

  return {
    init, getCampos, getCampo, getCampana, setCampana,
    getDatosCampana, setDatosCampana,
    crearCampo, editarCampo, eliminarCampo,
    añadirRecinto, quitarRecinto, campoDeRecinto
  };
})();
