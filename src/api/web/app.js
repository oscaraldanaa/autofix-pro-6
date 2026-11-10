/* AutoFix Pro · interfaz web
   Sin dependencias ni compilación. Habla con la API REST del mismo servidor (/api/v1).
   Organización: utilidades → API → ventanas → vistas → acciones → arranque. */
(() => {
  'use strict';

  /* =====================================================================
     1. Datos fijos: perfiles, estados, iconos
     ===================================================================== */
  const PERFILES = {
    asesor_servicio: {
      nombre: 'Asesor de servicio', icono: 'clipboard',
      desc: 'Recibe los vehículos, prepara cotizaciones, asigna el trabajo y da seguimiento a cada orden.',
      menu: ['inicio', 'ordenes', 'clientes', 'vehiculos', 'tecnicos', 'flotillas', 'catalogo'],
      saludo: 'Aquí puedes recibir vehículos, cotizar y dar seguimiento a todas las órdenes.',
    },
    tecnico: {
      nombre: 'Técnico mecánico', icono: 'wrench',
      desc: 'Revisa el vehículo, anota el diagnóstico y avisa cuando termina cada reparación.',
      menu: ['inicio', 'ordenes', 'catalogo'],
      saludo: 'Aquí verás los vehículos que esperan diagnóstico o reparación.',
    },
    compras: {
      nombre: 'Compras (refacciones)', icono: 'box',
      desc: 'Consigue las refacciones que faltan y avisa cuándo llegarán.',
      menu: ['inicio', 'ordenes', 'catalogo'],
      saludo: 'Aquí verás las órdenes que están esperando una refacción.',
    },
    caja: {
      nombre: 'Caja', icono: 'card',
      desc: 'Cobra y cierra las órdenes cuando el vehículo está listo para entregarse.',
      menu: ['inicio', 'ordenes'],
      saludo: 'Aquí verás los vehículos listos para cobrar y entregar.',
    },
    cliente: {
      nombre: 'Cliente', icono: 'user',
      desc: 'Consulta cómo va tu vehículo y autoriza o rechaza las cotizaciones.',
      menu: ['inicio', 'ordenes', 'catalogo'],
      saludo: 'Aquí puedes ver cómo va tu vehículo y autorizar las cotizaciones.',
    },
  };

  const MENU = {
    inicio: { etq: 'Inicio', icono: 'home' },
    ordenes: { etq: 'Órdenes de servicio', icono: 'clipboard', etqCliente: 'Mis órdenes' },
    clientes: { etq: 'Clientes', icono: 'users' },
    vehiculos: { etq: 'Vehículos', icono: 'car' },
    tecnicos: { etq: 'Técnicos', icono: 'wrench' },
    flotillas: { etq: 'Flotillas', icono: 'briefcase' },
    catalogo: { etq: 'Servicios y precios', icono: 'tag' },
  };

  // Orden en que avanza una orden y quién participa en cada etapa.
  const ETAPAS = [
    { estado: 'Recibido', quien: 'asesor_servicio', titulo: 'Se recibe el vehículo', texto: 'El asesor registra al cliente, el vehículo y el motivo de la visita.' },
    { estado: 'Diagnosticado', quien: 'tecnico', titulo: 'Se diagnostica', texto: 'El técnico revisa el vehículo y anota lo que encuentra.' },
    { estado: 'Cotizado', quien: 'asesor_servicio', titulo: 'Se cotiza', texto: 'El asesor prepara el presupuesto con mano de obra y refacciones.' },
    { estado: 'Autorizado', quien: 'cliente', titulo: 'El cliente autoriza', texto: 'El cliente aprueba todo, solo una parte o rechaza la cotización.' },
    { estado: 'En reparación', quien: 'tecnico', titulo: 'Se repara', texto: 'Se hace únicamente el trabajo autorizado. Si falta una refacción, Compras la consigue.' },
    { estado: 'Listo para entrega', quien: 'asesor_servicio', titulo: 'Queda listo', texto: 'Se revisa la calidad de cada trabajo y se avisa que ya se puede recoger.' },
    { estado: 'Cerrado', quien: 'caja', titulo: 'Se cobra y se entrega', texto: 'Caja cobra exactamente lo autorizado y la orden se cierra.' },
  ];

  const ESTADO_INSIGNIA = {
    'Recibido': 'badge', 'Diagnosticado': 'badge', 'Cotizado': 'badge--aviso', 'Autorizado': 'badge--rojo',
    'En reparación': 'badge--rojo-fuerte', 'En espera de refacción': 'badge--aviso', 'Listo para entrega': 'badge--ok',
    'Cerrado': 'badge--ok', 'Cancelado': 'badge--oscuro',
  };

  const ICONOS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    swap: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  };
  const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

  const COMBUSTIBLE = [['vacio', 'Vacío'], ['1/4', '1/4 de tanque'], ['1/2', 'Medio tanque'], ['3/4', '3/4 de tanque'], ['lleno', 'Lleno']];

  // Qué perfil puede ejecutar cada acción (RN-12 del sistema).
  const PERMISOS = {
    diagnostico: ['tecnico'], cotizar: ['asesor_servicio'], responder: ['cliente'], asignar: ['asesor_servicio'],
    finalizar: ['tecnico'], revisar: ['asesor_servicio'], reportar_ref: ['tecnico', 'asesor_servicio'],
    reposicion: ['compras', 'asesor_servicio'], recepcion: ['compras'], falla: ['tecnico'],
    cotizar_amp: ['asesor_servicio'], responder_amp: ['cliente'], fecha: ['asesor_servicio'],
    listo: ['asesor_servicio'], cobro: ['caja'], cancelar: ['asesor_servicio'],
  };

  const REGLAS = {
    'RN-01': 'Datos completos y orden correcto del proceso', 'RN-03': 'Aviso de retraso al cliente',
    'RN-04': 'Fallas adicionales y cobro solo de lo autorizado', 'RN-05': 'Autorización total o parcial',
    'RN-06': 'Cambios de fecha con justificación', 'RN-07': 'Refacciones sin existencia', 'RN-09': 'Vehículos de flotilla',
    'RN-10': 'Medio de contacto del cliente', 'RN-11': 'Evidencia de autorización', 'RN-12': 'Permisos por perfil',
    'RN-13': 'Solo se trabaja lo autorizado', 'RN-14': 'Un único autorizador', 'CAT-01': 'Servicio no disponible', 'CAT-02': 'Capacidad del servicio',
  };

  /* =====================================================================
     2. Utilidades
     ===================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const dinero = (v) => pesos.format(Number(v || 0));
  const fechaHora = (v) => v ? new Date(v).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const fecha = (v) => v ? new Date(v).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : '—';
  const corto = (id) => (String(id).split('-')[1] || String(id)).slice(0, 8);
  const quitarAcentos = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const nombrePerfil = (r) => (PERFILES[r] || {}).nombre || r;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const ahoraLocalInput = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 5); return d.toISOString().slice(0, 16); };

  const insignia = (texto, clase = 'badge', extra = '') => `<span class="badge ${clase} ${extra}">${esc(texto)}</span>`;
  const insigniaEstado = (e, extra = '') => insignia(e, ESTADO_INSIGNIA[e] || 'badge', extra);

  const estado = { perfil: localStorage.getItem('afp.perfil'), ruta: '', token: 0, datos: {} };

  function iconos(raiz = document) {
    $$('[data-icono]', raiz).forEach((el) => { el.innerHTML = ico(el.dataset.icono); el.removeAttribute('data-icono'); });
  }

  /* =====================================================================
     3. Comunicación con la API y mensajes de error entendibles
     ===================================================================== */
  class ErrorApi extends Error {
    constructor(status, mensaje, regla) { super(mensaje); this.status = status; this.regla = regla || null; }
  }

  const CAMPOS = {
    nombre: 'Nombre', telefono: 'Teléfono', email: 'Correo electrónico', placas: 'Placas', marca: 'Marca', modelo: 'Modelo',
    kilometraje: 'Kilometraje', vin: 'Número de serie (VIN)', combustible: 'Combustible', motivo_ingreso: 'Motivo de la visita',
    hallazgos: 'Hallazgos', conceptos: 'Conceptos', descripcion: 'Descripción', precio_unitario: 'Precio', cantidad: 'Cantidad',
    precio_mxn: 'Precio', capacidad: 'Capacidad', razon_social: 'Razón social', monto: 'Monto', motivo: 'Motivo',
    fecha_estimada: 'Fecha', nueva_fecha: 'Fecha', tecnico_id: 'Técnico', cliente_id: 'Cliente', vehiculo_id: 'Vehículo',
    especialidad: 'Especialidad', descuento_pct: 'Descuento', dias_credito: 'Días de crédito', prioridad: 'Prioridad',
  };
  const TRADUCCIONES = [
    [/field required/i, 'es obligatorio'], [/at least 1 character/i, 'no puede quedar vacío'],
    [/greater than 0/i, 'debe ser mayor que cero'], [/greater than or equal to 0/i, 'no puede ser negativo'],
    [/valid (number|decimal|integer)/i, 'debe ser un número válido'], [/at least 1 item/i, 'necesita al menos un elemento'],
    [/valid datetime/i, 'debe ser una fecha válida'],
  ];

  function mensajeError(status, d) {
    if (status === 401) return 'Primero elige con qué perfil vas a trabajar.';
    if (status === 403) {
      const perm = (d && d.detalle || '').match(/permitidos: ([^)]*)/);
      const quien = perm ? perm[1].split(',').map((r) => nombrePerfil(r.trim())).join(' o ') : 'otro perfil';
      return `Esta acción la realiza: ${quien}. Tu perfil actual es «${nombrePerfil(estado.perfil)}». Usa «Cambiar perfil» arriba a la derecha.`;
    }
    if (status === 404) return (d && d.detalle) || 'No encontramos lo que buscas. Puede que ya no exista.';
    if (status === 409 || status === 400 || status === 422) {
      if (d && Array.isArray(d.detail)) {
        return d.detail.map((e) => {
          const campo = CAMPOS[e.loc[e.loc.length - 1]] || 'Un dato';
          const t = (TRADUCCIONES.find(([r]) => r.test(e.msg)) || [])[1] || 'no es válido';
          return `${campo} ${t}.`;
        }).join(' ');
      }
      return (d && d.detalle) || 'No se pudo completar la acción. Revisa los datos e intenta de nuevo.';
    }
    return 'Algo salió mal en el sistema. Intenta de nuevo en unos momentos.';
  }

  async function api(metodo, ruta, cuerpo) {
    let res;
    try {
      res = await fetch('/api/v1' + ruta, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', ...(estado.perfil ? { 'X-Rol': estado.perfil } : {}) },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } catch {
      throw new ErrorApi(0, 'No pudimos conectarnos con el sistema. Verifica que el servidor esté encendido e intenta de nuevo.');
    }
    if (res.status === 204) return null;
    let datos = null;
    try { datos = await res.json(); } catch { /* sin cuerpo */ }
    if (!res.ok) throw new ErrorApi(res.status, mensajeError(res.status, datos), datos && datos.regla);
    return datos;
  }

  const RUTAS = { clientes: '/clientes', vehiculos: '/vehiculos', tecnicos: '/tecnicos', flotillas: '/flotillas', catalogo: '/catalogo', ordenes: '/ordenes' };
  async function cargar(...claves) {
    const r = await Promise.all(claves.map((k) => api('GET', RUTAS[k])));
    claves.forEach((k, i) => { estado.datos[k] = r[i]; });
    return r;
  }
  const porId = (lista, id) => (lista || []).find((x) => x.id === id);

  /* =====================================================================
     4. Avisos y ventanas
     ===================================================================== */
  function aviso(texto, tipo = 'ok', titulo) {
    const t = document.createElement('div');
    t.className = `toast ${tipo === 'error' ? 'toast--error' : ''}`;
    t.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    t.innerHTML = `${ico(tipo === 'error' ? 'alert' : 'check')}<p>${titulo ? `<b>${esc(titulo)}</b>` : ''}${esc(texto)}</p><button aria-label="Cerrar aviso">×</button>`;
    $('#toasts').appendChild(t);
    const quitar = () => t.remove();
    $('button', t).onclick = quitar;
    setTimeout(quitar, tipo === 'error' ? 9000 : 4500);
  }

  let modalActivo = null;
  function cerrarModal() {
    if (!modalActivo) return;
    modalActivo.remove(); modalActivo = null; document.body.style.overflow = '';
    document.removeEventListener('keydown', alTeclear);
  }
  function alTeclear(e) { if (e.key === 'Escape') cerrarModal(); }

  /** Abre una ventana con formulario. `alEnviar(form)` devuelve una promesa; si falla se muestra el error dentro de la ventana. */
  function modal({ titulo, subtitulo = '', html, boton = 'Guardar', peligro = false, ancho = false, alEnviar, alAbrir, sinPie = false }) {
    cerrarModal();
    const fondo = document.createElement('div');
    fondo.className = 'modal-fondo';
    fondo.innerHTML = `
      <form class="modal ${ancho ? 'modal--ancho' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" novalidate>
        <div class="modal__cab">
          <div><h2 id="modal-titulo">${esc(titulo)}</h2>${subtitulo ? `<p>${esc(subtitulo)}</p>` : ''}</div>
          <button type="button" data-cerrar aria-label="Cerrar ventana">${ico('x')}</button>
        </div>
        <div class="modal__cuerpo">${html}</div>
        <div class="modal__error" id="modal-error" hidden></div>
        ${sinPie ? '' : `<div class="modal__pie">
          <button type="button" class="btn btn--fantasma" data-cerrar>Cancelar</button>
          <button type="submit" class="btn ${peligro ? 'btn--peligro' : 'btn--primario'}">${esc(boton)}</button>
        </div>`}
      </form>`;
    document.body.appendChild(fondo);
    document.body.style.overflow = 'hidden';
    modalActivo = fondo;
    document.addEventListener('keydown', alTeclear);
    // Los formularios no se cierran al tocar fuera (para no perder lo escrito); las ventanas informativas sí.
    fondo.addEventListener('mousedown', (e) => { if (e.target === fondo && sinPie) cerrarModal(); });
    $$('[data-cerrar]', fondo).forEach((b) => b.addEventListener('click', cerrarModal));
    const form = $('form', fondo);
    const mostrarError = (msg) => {
      const c = $('#modal-error', fondo);
      c.hidden = false; c.innerHTML = `<div class="aviso" role="alert">${ico('alert')}<div>${esc(msg)}</div></div>`;
      c.scrollIntoView({ block: 'nearest' });
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!alEnviar) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      $('#modal-error', fondo).hidden = true;
      const btn = $('button[type=submit]', form);
      const textoOriginal = btn.textContent;
      btn.disabled = true; btn.textContent = 'Un momento…';
      try {
        await alEnviar(form);
      } catch (err) {
        if (err instanceof ErrorApi || err instanceof ErroValidacion) mostrarError(err.message + (err.regla && REGLAS[err.regla] ? ` (Regla: ${REGLAS[err.regla]})` : ''));
        else { console.error(err); mostrarError('Ocurrió un error inesperado. Intenta de nuevo.'); }
        btn.disabled = false; btn.textContent = textoOriginal;
      }
    });
    iconos(fondo);
    if (alAbrir) alAbrir(form, { mostrarError });
    const primero = $('input:not([type=hidden]):not([readonly]), select, textarea', form);
    if (primero) setTimeout(() => primero.focus(), 30);
    return form;
  }
  class ErroValidacion extends Error {}

  function confirmar({ titulo, texto, boton = 'Sí, continuar', peligro = false, alConfirmar }) {
    return modal({ titulo, html: `<p style="font-size:1.05rem">${texto}</p>`, boton, peligro, alEnviar: alConfirmar });
  }

  /* ---------- ayudantes de formulario ---------- */
  const campo = ({ nombre, etq, tipo = 'text', valor = '', requerido = false, ayuda = '', attrs = '' }) => `
    <div class="campo"><label for="f-${nombre}">${esc(etq)}${requerido ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
    <input id="f-${nombre}" name="${nombre}" type="${tipo}" value="${esc(valor)}" ${requerido ? 'required' : ''} ${attrs}>
    ${ayuda ? `<span class="ayuda">${ayuda}</span>` : ''}</div>`;
  const area = ({ nombre, etq, valor = '', requerido = false, ayuda = '', ph = '' }) => `
    <div class="campo"><label for="f-${nombre}">${esc(etq)}${requerido ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
    <textarea id="f-${nombre}" name="${nombre}" placeholder="${esc(ph)}" ${requerido ? 'required' : ''}>${esc(valor)}</textarea>
    ${ayuda ? `<span class="ayuda">${ayuda}</span>` : ''}</div>`;
  const seleccion = ({ nombre, etq, opciones, valor = '', requerido = false, ayuda = '', vacio = 'Selecciona una opción…', extra = '' }) => `
    <div class="campo"><label for="f-${nombre}">${esc(etq)}${requerido ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
    <select id="f-${nombre}" name="${nombre}" ${requerido ? 'required' : ''} ${extra}>
      ${vacio === null ? '' : `<option value="">${esc(vacio)}</option>`}
      ${opciones.map(([v, t]) => `<option value="${esc(v)}" ${v === valor ? 'selected' : ''}>${esc(t)}</option>`).join('')}
    </select>${ayuda ? `<span class="ayuda">${ayuda}</span>` : ''}</div>`;
  const casilla = ({ nombre, titulo, texto = '', marcado = false }) => `
    <label class="opcion-check"><input type="checkbox" name="${nombre}" ${marcado ? 'checked' : ''}><span><b>${esc(titulo)}</b>${texto ? `<small>${esc(texto)}</small>` : ''}</span></label>`;
  const lineas = (txt) => String(txt || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const vacioHtml = (icono, titulo, texto, boton = '') => `
    <div class="vacio"><div class="circulo">${ico(icono)}</div><h3>${esc(titulo)}</h3><p>${esc(texto)}</p>${boton}</div>`;
  const cargandoHtml = (t = 'Cargando…') => `<div class="cargando" role="status"><div class="rueda"></div><p>${esc(t)}</p></div>`;

  const opcionesClientes = () => (estado.datos.clientes || []).filter((c) => c.activo).map((c) => [c.id, c.nombre]);
  const etiquetaVehiculo = (v) => `${v.placas} · ${v.marca} ${v.modelo}`;
  const opcionesTecnicos = (soloLibres = false) => (estado.datos.tecnicos || [])
    .filter((t) => !soloLibres || t.disponible)
    .map((t) => [t.id, `${t.nombre} — ${t.especialidad}${t.disponible ? '' : ' (ocupado)'}`]);

  /* =====================================================================
     5. Estructura general: menú, perfil, rutas
     ===================================================================== */
  const puede = (accion) => (PERMISOS[accion] || []).includes(estado.perfil);

  function pintarMarco() {
    const p = PERFILES[estado.perfil];
    $('#chip-perfil').innerHTML = `<span class="avatar">${ico(p.icono)}</span><span class="t"><small>Trabajando como</small>${esc(p.nombre)}</span>`;
    $('#menu').innerHTML = p.menu.map((k) => {
      const m = MENU[k];
      const etq = estado.perfil === 'cliente' && m.etqCliente ? m.etqCliente : m.etq;
      return `<a href="#/${k}" data-ruta="${k}">${ico(m.icono)}<span>${esc(etq)}</span></a>`;
    }).join('');
  }

  function marcarMenu(seccion) {
    $$('#menu a').forEach((a) => { if (a.dataset.ruta === seccion) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }

  function elegirPerfil() {
    cerrarModal();
    const cont = $('#perfiles');
    cont.hidden = false;
    document.body.style.overflow = 'hidden';
    cont.innerHTML = `
      <div class="perfiles__caja">
        <div class="perfiles__marca"><span class="marca__logo">${ico('wrench')}</span><span class="marca__texto"><strong>AutoFix</strong> Pro</span></div>
        <h2>¿Con qué perfil vas a trabajar hoy?</h2>
        <p class="lema">Elige tu función en el taller. El sistema te mostrará solo lo que necesitas.</p>
        <div class="perfiles__rejilla">
          ${Object.entries(PERFILES).map(([k, p]) => `
            <button class="perfil-card ${k === estado.perfil ? 'actual' : ''}" data-perfil="${k}">
              <span class="avatar">${ico(p.icono)}</span>
              <h3>${esc(p.nombre)}</h3>
              <p>${esc(p.desc)}</p>
              <span class="ir">Entrar ${ico('arrow')}</span>
            </button>`).join('')}
        </div>
        <p class="perfiles__pie">Puedes cambiar de perfil en cualquier momento desde la esquina superior derecha.</p>
      </div>`;
    $$('[data-perfil]', cont).forEach((b) => b.addEventListener('click', () => {
      estado.perfil = b.dataset.perfil;
      localStorage.setItem('afp.perfil', estado.perfil);
      cont.hidden = true; document.body.style.overflow = '';
      cont.innerHTML = '';
      $('#app').hidden = false;
      pintarMarco();
      const seccion = (location.hash.split('?')[0].split('/')[1]) || 'inicio';
      if (!PERFILES[estado.perfil].menu.includes(seccion)) location.hash = '#/inicio'; else enrutar();
      aviso(`Ahora trabajas como ${PERFILES[estado.perfil].nombre}.`, 'ok', 'Perfil seleccionado');
    }));
  }

  const VISTAS = {
    inicio: { titulo: 'Inicio', f: vistaInicio },
    ordenes: { titulo: 'Órdenes de servicio', f: vistaOrdenes },
    clientes: { titulo: 'Clientes', f: vistaClientes },
    vehiculos: { titulo: 'Vehículos', f: vistaVehiculos },
    tecnicos: { titulo: 'Técnicos', f: vistaTecnicos },
    flotillas: { titulo: 'Flotillas (empresas)', f: vistaFlotillas },
    catalogo: { titulo: 'Servicios y precios', f: vistaCatalogo },
  };

  async function enrutar() {
    if (!estado.perfil || !PERFILES[estado.perfil]) return elegirPerfil();
    const partes = (location.hash || '#/inicio').split('?')[0].replace(/^#\/?/, '').split('/');
    let seccion = partes[0] || 'inicio';
    if (!VISTAS[seccion]) seccion = 'inicio';
    if (!PERFILES[estado.perfil].menu.includes(seccion)) { location.hash = '#/inicio'; return; }
    const token = ++estado.token;
    const cont = $('#contenido');
    cerrarMenuMovil();
    marcarMenu(seccion);
    let titulo = VISTAS[seccion].titulo;
    if (seccion === 'ordenes' && estado.perfil === 'cliente') titulo = 'Mis órdenes';
    $('#titulo-vista').textContent = titulo;
    document.title = `${titulo} · AutoFix Pro`;
    cont.innerHTML = cargandoHtml();
    try {
      const html = seccion === 'ordenes' && partes[1] ? await vistaDetalleOrden(decodeURIComponent(partes[1])) : await VISTAS[seccion].f();
      if (token !== estado.token) return;
      cont.innerHTML = html.html ?? html;
      iconos(cont);
      if (html.alMontar) html.alMontar(cont);
      if (!partes[1]) window.scrollTo({ top: 0 });
      cont.focus({ preventScroll: true });
    } catch (e) {
      if (token !== estado.token) return;
      cont.innerHTML = `<div class="tarjeta">${vacioHtml('alert', 'No pudimos mostrar esta pantalla', e.message, `<button class="btn btn--primario" data-act="recargar">${ico('refresh')} Intentar de nuevo</button>`)}</div>`;
      iconos(cont);
    }
  }

  function cerrarMenuMovil() { $('#lateral').classList.remove('abierto'); $('#velo').hidden = true; }

  /* =====================================================================
     6. Vistas
     ===================================================================== */

  /* ---------- Inicio ---------- */
  const PENDIENTES = {
    asesor_servicio: { 'Diagnosticado': 'Preparar la cotización', 'Autorizado': 'Asignar un técnico', 'En reparación': 'Dar seguimiento y revisar calidad' },
    tecnico: { 'Recibido': 'Hacer el diagnóstico', 'En reparación': 'Reparar y avisar al terminar' },
    compras: { 'En espera de refacción': 'Conseguir la refacción' },
    caja: { 'Listo para entrega': 'Cobrar y entregar' },
    cliente: { 'Cotizado': 'Autorizar o rechazar la cotización' },
  };

  async function vistaInicio() {
    const [ordenes] = await cargar('ordenes', 'clientes', 'vehiculos');
    const p = PERFILES[estado.perfil];
    const activas = ordenes.filter((o) => !['Cerrado', 'Cancelado'].includes(o.estado));
    const cuenta = (e) => ordenes.filter((o) => o.estado === e).length;
    const mios = ordenes.filter((o) => (PENDIENTES[estado.perfil] || {})[o.estado]);

    const tarjeta = (num, etq, icono, filtro) => `
      <a class="dato-grande" href="#/ordenes${filtro ? '?f=' + encodeURIComponent(filtro) : ''}">
        <span class="circulo">${ico(icono)}</span><span><div class="num">${num}</div><div class="etq">${esc(etq)}</div></span></a>`;

    const filas = mios.slice(0, 8).map((o) => {
      const c = porId(estado.datos.clientes, o.cliente_id), v = porId(estado.datos.vehiculos, o.vehiculo_id);
      return `<tr class="fila-click" data-ir="#/ordenes/${esc(o.id)}">
        <td data-etq="Orden" class="id">#${esc(corto(o.id))}</td>
        <td data-etq="Cliente">${esc(c ? c.nombre : '—')}<div class="peque">${esc(v ? etiquetaVehiculo(v) : '')}</div></td>
        <td data-etq="Estado">${insigniaEstado(o.estado)}</td>
        <td data-etq="Qué hacer"><b>${esc(PENDIENTES[estado.perfil][o.estado])}</b></td>
        <td class="der"><span class="btn btn--primario btn--chico">Atender ${ico('arrow')}</span></td></tr>`;
    }).join('');

    const rapidas = estado.perfil === 'asesor_servicio' ? `
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('plus')} Acciones rápidas</h3></div>
        <div class="acciones">
          <button class="btn btn--primario btn--grande" data-act="nueva-orden">${ico('plus')} Recibir un vehículo (nueva orden)</button>
          <button class="btn btn--secundario" data-act="nuevo-cliente">${ico('users')} Registrar cliente</button>
          <button class="btn btn--secundario" data-act="nuevo-vehiculo">${ico('car')} Registrar vehículo</button>
        </div>
      </div>` : '';

    return `
      <section class="tarjeta tarjeta--roja bienvenida">
        <span class="avatar">${ico(p.icono)}</span>
        <div><h2>¡Hola! Estás como ${esc(p.nombre)}</h2><p>${esc(p.saludo)}</p></div>
      </section>
      ${rapidas}
      <div class="rejilla rejilla--4" style="margin:1rem 0">
        ${tarjeta(activas.length, 'Órdenes en proceso', 'clipboard', 'activas')}
        ${tarjeta(cuenta('En espera de refacción'), 'Esperando refacción', 'box', 'En espera de refacción')}
        ${tarjeta(cuenta('Listo para entrega'), 'Listos para entregar', 'check', 'Listo para entrega')}
        ${tarjeta(cuenta('Cerrado'), 'Órdenes cerradas', 'card', 'Cerrado')}
      </div>
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('clock')} Pendientes para ti</h3>
          ${mios.length > 8 ? `<a class="btn btn--suave btn--chico" href="#/ordenes">Ver todas</a>` : ''}</div>
        ${mios.length ? `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Orden</th><th>Cliente y vehículo</th><th>Estado</th><th>Qué hacer</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`
          : vacioHtml('check', '¡Todo al día!', 'No tienes órdenes pendientes por atender en este momento.')}
      </div>
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('help')} Así funciona una orden, paso a paso</h3></div>
        <ol class="ayuda-pasos">${ETAPAS.map((e) => `<li><div><b>${esc(e.titulo)} <span class="badge badge--rojo">${esc(nombrePerfil(e.quien))}</span></b><span>${esc(e.texto)}</span></div></li>`).join('')}</ol>
      </div>`;
  }

  /* ---------- Listado de órdenes ---------- */
  async function vistaOrdenes() {
    await cargar('ordenes', 'clientes', 'vehiculos');
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    let filtro = params.get('f') || 'todas';
    const ordenes = estado.datos.ordenes;
    const grupos = [['todas', 'Todas'], ['activas', 'En proceso'], ...['Recibido', 'Diagnosticado', 'Cotizado', 'Autorizado', 'En reparación', 'En espera de refacción', 'Listo para entrega', 'Cerrado', 'Cancelado'].map((e) => [e, e])];

    const html = `
      <div class="vista-cab">
        <div><h2>${estado.perfil === 'cliente' ? 'Mis órdenes' : 'Órdenes de servicio'}</h2>
          <p>${estado.perfil === 'cliente' ? 'Busca tu vehículo por placas o por tu nombre y revisa cómo va.' : 'Toca una orden para ver todo su detalle y los pasos siguientes.'}</p></div>
        ${puede('cotizar') ? `<button class="btn btn--primario btn--grande" data-act="nueva-orden">${ico('plus')} Nueva orden</button>` : ''}
      </div>
      <div class="barra-filtros">
        <div class="buscador"><span>${ico('search')}</span><input type="search" id="buscar" placeholder="Buscar por cliente, placas, marca o número de orden…" aria-label="Buscar órdenes"></div>
      </div>
      <div class="filtros" id="filtros" style="margin-bottom:1rem" role="group" aria-label="Filtrar por estado"></div>
      <div id="lista-ordenes"></div>`;

    return {
      html,
      alMontar(cont) {
        const caja = $('#filtros', cont), lista = $('#lista-ordenes', cont), buscar = $('#buscar', cont);
        const pintar = () => {
          caja.innerHTML = grupos.map(([k, t]) => `<button class="filtro" data-f="${esc(k)}" aria-pressed="${k === filtro}">${esc(t)}</button>`).join('');
          const q = quitarAcentos(buscar.value.trim());
          const visibles = ordenes.filter((o) => {
            if (filtro === 'activas' && ['Cerrado', 'Cancelado'].includes(o.estado)) return false;
            if (!['todas', 'activas'].includes(filtro) && o.estado !== filtro) return false;
            if (!q) return true;
            const c = porId(estado.datos.clientes, o.cliente_id), v = porId(estado.datos.vehiculos, o.vehiculo_id);
            return quitarAcentos([o.id, c && c.nombre, v && v.placas, v && v.marca, v && v.modelo, o.motivo_ingreso].join(' ')).includes(q);
          });
          if (!visibles.length) {
            lista.innerHTML = `<div class="tarjeta">${vacioHtml('clipboard', ordenes.length ? 'No encontramos órdenes con ese criterio' : 'Todavía no hay órdenes', ordenes.length ? 'Prueba con otra búsqueda o cambia el filtro.' : 'Cuando se reciba un vehículo, su orden aparecerá aquí.', puede('cotizar') && !ordenes.length ? `<button class="btn btn--primario" data-act="nueva-orden">${ico('plus')} Crear la primera orden</button>` : '')}</div>`;
          } else {
            lista.innerHTML = `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Orden</th><th>Cliente y vehículo</th><th>Motivo</th><th>Estado</th><th>Entrega estimada</th><th class="der">Autorizado</th></tr></thead><tbody>
              ${visibles.map((o) => {
                const c = porId(estado.datos.clientes, o.cliente_id), v = porId(estado.datos.vehiculos, o.vehiculo_id);
                return `<tr class="fila-click" tabindex="0" data-ir="#/ordenes/${esc(o.id)}">
                  <td data-etq="Orden" class="id">#${esc(corto(o.id))}</td>
                  <td data-etq="Cliente"><b>${esc(c ? c.nombre : '—')}</b>${o.es_flotilla ? ' ' + insignia('Flotilla', 'badge--rojo') : ''}<div class="peque">${esc(v ? `${v.placas} · ${v.marca} ${v.modelo}` : '')}</div></td>
                  <td data-etq="Motivo" style="min-width:170px">${esc(o.motivo_ingreso.length > 60 ? o.motivo_ingreso.slice(0, 60) + '…' : o.motivo_ingreso)}<div class="peque">Recibido: ${esc(fecha(o.creada_en))}</div></td>
                  <td data-etq="Estado">${insigniaEstado(o.estado)}</td>
                  <td data-etq="Entrega">${esc(o.fecha_entrega ? fechaHora(o.fecha_entrega) : 'Sin fecha')}</td>
                  <td data-etq="Autorizado" class="der">${Number(o.total_autorizado) ? esc(dinero(o.total_autorizado)) : '—'}</td></tr>`;
              }).join('')}</tbody></table></div>
              <p class="peque" style="margin-top:.6rem;color:var(--texto-suave)">${plural(visibles.length, 'orden', 'órdenes')}</p>`;
          }
        };
        caja.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; pintar(); } });
        buscar.addEventListener('input', pintar);
        pintar();
      },
    };
  }

  /* ---------- Detalle de orden ---------- */
  function conceptosAutorizadosRefaccion(o) {
    const cots = [o.cotizacion, ...o.solicitudes_ampliacion.map((s) => s.cotizacion)].filter(Boolean);
    return cots.flatMap((c) => c.conceptos).filter((k) => k.tipo === 'refaccion' && k.estado === 'autorizado');
  }

  /** Lista de cosas que hay que hacer ahora en la orden y quién las hace. */
  function tareasDe(o) {
    const t = [];
    const add = (rol, titulo, detalle, acciones) => t.push({ rol, titulo, detalle, acciones });
    switch (o.estado) {
      case 'Recibido': add('tecnico', 'Hacer el diagnóstico', 'Revisar el vehículo y anotar lo que se encuentra.', [{ id: 'diagnostico', txt: 'Registrar diagnóstico' }]); break;
      case 'Diagnosticado': add('asesor_servicio', 'Preparar la cotización', 'Armar el presupuesto con la mano de obra y las refacciones.', [{ id: 'cotizar', txt: 'Crear cotización' }]); break;
      case 'Cotizado': add('cliente', 'Autorizar o rechazar la cotización', 'Se puede aprobar todo, solo una parte o rechazarla.', [{ id: 'responder', txt: 'Responder cotización' }]); break;
      case 'Autorizado': add('asesor_servicio', 'Asignar el trabajo a un técnico', 'Se crearán los trabajos solo con lo que el cliente autorizó.', [{ id: 'asignar', txt: 'Asignar técnico' }]); break;
      case 'Listo para entrega': add('caja', `Cobrar ${dinero(o.total_autorizado)}`, 'Se cobra exactamente lo autorizado y la orden se cierra.', [{ id: 'cobro', txt: 'Registrar cobro' }]); break;
      case 'En reparación':
      case 'En espera de refacción': {
        o.trabajos.filter((x) => x.estado === 'En reparación').forEach((x) => add('tecnico', `Terminar: ${x.descripcion}`, 'Avisar cuando el trabajo esté hecho.', [{ id: 'finalizar', txt: 'Ya lo terminé', arg: x.id }]));
        o.trabajos.filter((x) => x.estado === 'Pendiente de revisión').forEach((x) => add('asesor_servicio', `Revisar la calidad: ${x.descripcion}`, 'Comprobar que el trabajo quedó bien.', [{ id: 'revisar', txt: 'Aprobar calidad', arg: x.id }]));
        o.solicitudes_refaccion.filter((x) => x.estado === 'pendiente').forEach((x) => add('compras', `Conseguir refacción: ${x.descripcion}`, x.reposicion_estimada ? `Llegada estimada: ${fechaHora(x.reposicion_estimada)}` : 'Aún sin fecha estimada de llegada.', [{ id: 'reposicion', txt: 'Actualizar fecha de llegada', arg: x.id }, { id: 'recepcion', txt: 'Ya llegó', arg: x.id }]));
        o.solicitudes_ampliacion.forEach((x) => {
          if (x.estado === 'pendiente_cotizacion') add('asesor_servicio', `Cotizar falla adicional: ${x.descripcion_falla}`, 'El técnico encontró algo más. Nada se repara sin autorización.', [{ id: 'cotizar_amp', txt: 'Cotizar falla', arg: x.id }]);
          if (x.estado === 'pendiente_autorizacion') add('cliente', `Autorizar falla adicional: ${x.descripcion_falla}`, 'Hay una cotización complementaria esperando respuesta.', [{ id: 'responder_amp', txt: 'Responder', arg: x.id }]);
        });
        if (!t.length && o.estado === 'En reparación' && o.trabajos.length) add('asesor_servicio', 'Marcar la orden como lista para entrega', 'Todos los trabajos ya fueron revisados.', [{ id: 'listo', txt: 'Marcar lista para entrega' }]);
        break;
      }
      default: break;
    }
    return t;
  }

  function tablaConceptos(cot) {
    const insEst = { pendiente: ['Pendiente', 'badge'], autorizado: ['Autorizado', 'badge--ok'], rechazado: ['Rechazado', 'badge--oscuro'] };
    return `<div class="tabla-caja"><table class="tabla tabla--interna responsive"><thead><tr><th>Concepto</th><th>Tipo</th><th class="der">Cantidad</th><th class="der">Precio</th><th class="der">Importe</th><th>Decisión</th></tr></thead><tbody>
      ${cot.conceptos.map((k) => `<tr>
        <td data-etq="Concepto">${esc(k.descripcion)}</td>
        <td data-etq="Tipo">${k.tipo === 'refaccion' ? 'Refacción' : 'Mano de obra'}</td>
        <td data-etq="Cantidad" class="der">${esc(Number(k.cantidad))}</td>
        <td data-etq="Precio" class="der">${esc(dinero(k.precio_unitario))}</td>
        <td data-etq="Importe" class="der">${esc(dinero(k.importe))}</td>
        <td data-etq="Decisión">${insignia(...insEst[k.estado] || [k.estado])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="totales" style="margin-top:.8rem;max-width:340px;margin-left:auto">
        <div class="suave"><span>Subtotal</span><span>${esc(dinero(cot.subtotal))}</span></div>
        ${Number(cot.descuento) ? `<div class="suave"><span>Descuento de flotilla</span><span>− ${esc(dinero(cot.descuento))}</span></div>` : ''}
        <div class="suave"><span>Impuestos (IVA)</span><span>${esc(dinero(cot.impuestos))}</span></div>
        <div class="fuerte"><span>Total cotizado</span><span>${esc(dinero(cot.total))}</span></div>
        ${cot.resultado !== 'pendiente' ? `<div><span>Total autorizado</span><b>${esc(dinero(cot.total_autorizado))}</b></div>` : ''}
      </div>`;
  }

  async function vistaDetalleOrden(id) {
    const [o] = await Promise.all([api('GET', `/ordenes/${encodeURIComponent(id)}`), cargar('clientes', 'vehiculos', 'tecnicos')]);
    estado.ordenActual = o;
    return { html: htmlOrden(o), alMontar() { $('#titulo-vista').textContent = `Orden #${corto(o.id)}`; } };
  }

  function htmlOrden(o) {
    const cliente = porId(estado.datos.clientes, o.cliente_id) || {};
    const veh = porId(estado.datos.vehiculos, o.vehiculo_id) || {};
    const cancelada = o.estado === 'Cancelado';
    const idxEtapa = o.estado === 'En espera de refacción' ? 4 : ETAPAS.findIndex((e) => e.estado === o.estado);
    const tareas = tareasDe(o);
    const abierta = !['Cerrado', 'Cancelado'].includes(o.estado);
    const nivel = COMBUSTIBLE.findIndex(([v]) => v === o.combustible) + 1;
    const nombreTec = (id) => (porId(estado.datos.tecnicos, id) || {}).nombre || '—';

    const pasos = `<ol class="pasos ${cancelada ? 'apagado' : ''}" aria-label="Avance de la orden">${ETAPAS.map((e, i) => {
      let c = '';
      if (!cancelada) { if (o.estado === 'Cerrado' || i < idxEtapa) c = 'hecho'; else if (i === idxEtapa) c = o.estado === 'En espera de refacción' ? 'actual espera' : 'actual'; }
      return `<li class="${c}" ${c.includes('actual') ? 'aria-current="step"' : ''}>${esc(e.estado === 'En reparación' && o.estado === 'En espera de refacción' ? 'Esperando refacción' : e.estado)}</li>`;
    }).join('')}</ol>`;

    // ---- siguiente paso ----
    let siguiente;
    if (cancelada) siguiente = `<div class="aviso">${ico('x')}<div><b>Esta orden fue cancelada.</b><br>Ya no se pueden hacer más cambios.</div></div>`;
    else if (o.estado === 'Cerrado') siguiente = `<div class="aviso aviso--ok">${ico('check')}<div><b>¡Orden cerrada!</b><br>Se cobró ${esc(dinero(o.monto_cobrado))} y el vehículo fue entregado.</div></div>`;
    else siguiente = `<div class="tarjeta__cab"><h2>${ico('arrow')} Siguiente paso</h2></div>
      ${o.estado === 'En espera de refacción' ? `<div class="aviso aviso--aviso">${ico('clock')}<div>La reparación está en pausa porque falta una refacción. Compras ya fue avisado.</div></div>` : ''}
      ${tareas.length ? tareas.map((t) => {
        const mio = t.acciones.some((a) => puede(a.id));
        return `<div class="tarea ${mio ? '' : 'tarea--bloqueada'}">
          <div class="tarea__texto"><b>${esc(t.titulo)}</b><span>${esc(t.detalle)}</span></div>
          ${t.acciones.map((a) => puede(a.id)
            ? `<button class="btn ${a === t.acciones[0] ? 'btn--primario' : 'btn--secundario'}" data-accion="${a.id}" ${a.arg ? `data-arg="${esc(a.arg)}"` : ''}>${esc(a.txt)}</button>` : '').join('')}
          ${mio ? '' : `<button class="btn btn--suave btn--chico" data-act="usar-perfil" data-id="${esc(t.rol)}" title="Cambiar a este perfil para hacer el paso">${ico('swap')} Lo hace: ${esc(nombrePerfil(t.rol))} · Cambiar a ese perfil</button>`}
        </div>`;
      }).join('') : `<p>No hay pasos pendientes por ahora.</p>`}`;

    // ---- acciones extra ----
    const hayRefacciones = conceptosAutorizadosRefaccion(o).length > 0;
    const enRep = ['En reparación', 'En espera de refacción'].includes(o.estado);
    const extra = [];
    if (abierta && puede('fecha')) extra.push(`<button class="btn btn--secundario" data-accion="fecha">${ico('calendar')} ${o.fecha_entrega ? 'Cambiar fecha de entrega' : 'Programar fecha de entrega'}</button>`);
    if (enRep && hayRefacciones && puede('reportar_ref')) extra.push(`<button class="btn btn--secundario" data-accion="reportar_ref">${ico('box')} Reportar refacción sin existencia</button>`);
    if (o.estado === 'En reparación' && puede('falla')) extra.push(`<button class="btn btn--secundario" data-accion="falla">${ico('alert')} Reportar falla adicional</button>`);
    if (['Recibido', 'Diagnosticado', 'Cotizado', 'Autorizado'].includes(o.estado) && puede('cancelar')) extra.push(`<button class="btn btn--fantasma" data-accion="cancelar">${ico('x')} Cancelar orden</button>`);

    // ---- listo para entrega: lista de requisitos ----
    const reqs = o.estado === 'En reparación' ? (() => {
      const items = [
        [o.trabajos.length > 0 && o.trabajos.every((x) => x.estado === 'Revisado'), 'Todos los trabajos están terminados y revisados'],
        [o.solicitudes_ampliacion.every((x) => x.estado === 'resuelta'), 'No hay fallas adicionales sin resolver'],
        [!o.solicitudes_refaccion.some((x) => x.estado === 'pendiente'), 'No hay refacciones pendientes'],
      ];
      return `<ul class="chequeo" aria-label="Requisitos para entregar">${items.map(([ok, t]) => `<li class="${ok ? 'si' : 'no'}">${ico(ok ? 'check' : 'x')}<span style="color:var(--texto)">${esc(t)}</span></li>`).join('')}</ul>`;
    })() : '';

    const total = Number(o.cotizacion ? o.cotizacion.total : 0) + o.solicitudes_ampliacion.reduce((s, a) => s + Number(a.cotizacion ? a.cotizacion.total : 0), 0);

    const izquierda = `
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('car')} Datos de ingreso</h3></div>
        <dl class="pares">
          <div><dt>Cliente</dt><dd>${esc(cliente.nombre || '—')}<small>${esc([cliente.telefono, cliente.email].filter(Boolean).join(' · '))}</small></dd></div>
          <div><dt>Vehículo</dt><dd>${esc(veh.placas || '—')}<small>${esc([veh.marca, veh.modelo].filter(Boolean).join(' '))}</small></dd></div>
          <div><dt>Kilometraje</dt><dd>${esc(Number(o.kilometraje).toLocaleString('es-MX'))} km</dd></div>
          <div><dt>Combustible</dt><dd>${esc((COMBUSTIBLE.find(([v]) => v === o.combustible) || [0, o.combustible])[1])}
            <div class="combustible" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= nivel ? 'on' : ''}"></i>`).join('')}</div></dd></div>
          <div><dt>Recibido</dt><dd>${esc(fechaHora(o.creada_en))}</dd></div>
          <div><dt>Tipo de cliente</dt><dd>${o.es_flotilla ? 'Flotilla (empresa)' : 'Particular'}${o.promocion_activa ? '<small>Con promoción vigente</small>' : ''}</dd></div>
        </dl>
        <hr style="border:0;border-top:1px solid var(--linea);margin:1rem 0">
        <p style="font-weight:700;margin-bottom:.3rem">Motivo de la visita</p><p>${esc(o.motivo_ingreso)}</p>
        <p style="font-weight:700;margin:.8rem 0 .3rem">Daños visibles al recibirlo</p>
        ${o.danos_visibles.length ? `<div class="fichas">${o.danos_visibles.map((d) => `<span class="ficha">${esc(d)}</span>`).join('')}</div>` : '<p style="color:var(--texto-suave)">Sin daños reportados.</p>'}
      </div>

      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('search')} Diagnóstico</h3></div>
        ${o.hallazgos.length ? `<ul class="lista-simple">${o.hallazgos.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '<p style="color:var(--texto-suave)">Todavía no se ha registrado el diagnóstico.</p>'}
      </div>

      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('file')} Cotización</h3>
          ${o.cotizacion ? insignia({ pendiente: 'Esperando respuesta del cliente', autorizada: 'Autorizada', parcial: 'Autorizada parcialmente', rechazada: 'Rechazada' }[o.cotizacion.resultado], { pendiente: 'badge--aviso', autorizada: 'badge--ok', parcial: 'badge--rojo', rechazada: 'badge--oscuro' }[o.cotizacion.resultado], 'badge--grande') : ''}</div>
        ${o.cotizacion ? tablaConceptos(o.cotizacion) : '<p style="color:var(--texto-suave)">Aún no hay cotización.</p>'}
      </div>

      ${o.trabajos.length || o.solicitudes_refaccion.length || o.solicitudes_ampliacion.length ? `
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('wrench')} Reparación</h3></div>
        ${o.trabajos.length ? `<div class="tabla-caja"><table class="tabla tabla--interna responsive"><thead><tr><th>Trabajo</th><th>Técnico</th><th>Estado</th></tr></thead><tbody>
          ${o.trabajos.map((x) => `<tr><td data-etq="Trabajo">${esc(x.descripcion)}</td><td data-etq="Técnico">${esc(nombreTec(x.tecnico_id))}</td>
            <td data-etq="Estado">${insignia(x.estado, { 'En reparación': 'badge--rojo', 'Pendiente de revisión': 'badge--aviso', 'Revisado': 'badge--ok' }[x.estado])}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${o.solicitudes_refaccion.length ? `<h4 style="margin:1rem 0 .5rem">Refacciones solicitadas a Compras</h4><div class="tabla-caja"><table class="tabla tabla--interna responsive"><thead><tr><th>Refacción</th><th>Estado</th><th>Llegada estimada</th></tr></thead><tbody>
          ${o.solicitudes_refaccion.map((x) => `<tr><td data-etq="Refacción">${esc(x.descripcion)}</td><td data-etq="Estado">${insignia(x.estado === 'pendiente' ? 'Pendiente' : 'Recibida', x.estado === 'pendiente' ? 'badge--aviso' : 'badge--ok')}</td><td data-etq="Llegada">${esc(x.reposicion_estimada ? fechaHora(x.reposicion_estimada) : 'Sin fecha')}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${o.solicitudes_ampliacion.length ? `<h4 style="margin:1rem 0 .25rem">Fallas adicionales encontradas</h4>${o.solicitudes_ampliacion.map((a) => `
          <div class="ampliacion"><div class="tarjeta__cab" style="margin-bottom:.5rem"><b>${esc(a.descripcion_falla)}</b>
            ${insignia({ pendiente_cotizacion: 'Falta cotizar', pendiente_autorizacion: 'Esperando autorización', resuelta: 'Resuelta' }[a.estado], { pendiente_cotizacion: 'badge--aviso', pendiente_autorizacion: 'badge--aviso', resuelta: 'badge--ok' }[a.estado])}</div>
            <p class="peque" style="color:var(--texto-suave)">Reportada por ${esc(nombreTec(a.tecnico_id))}</p>
            ${a.cotizacion ? tablaConceptos(a.cotizacion) : ''}</div>`).join('')}` : ''}
      </div>` : ''}`;

    const derecha = `
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('dollar')} Resumen de dinero</h3></div>
        <div class="totales">
          <div class="suave"><span>Total cotizado</span><span>${total ? esc(dinero(total)) : '—'}</span></div>
          <div><span>Total autorizado</span><b>${esc(dinero(o.total_autorizado))}</b></div>
          <div class="fuerte"><span>${o.monto_cobrado != null ? 'Cobrado' : 'Por cobrar'}</span><span>${esc(dinero(o.monto_cobrado != null ? o.monto_cobrado : o.total_autorizado))}</span></div>
        </div>
      </div>
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('calendar')} Fecha de entrega</h3></div>
        ${o.fecha_entrega ? `<p style="font-size:1.25rem;font-weight:800;color:var(--rojo-oscuro)">${esc(fechaHora(o.fecha_entrega))}</p>` : '<p style="color:var(--texto-suave)">Aún no se ha programado una fecha.</p>'}
        ${o.historial_fechas.length ? `<p style="font-weight:700;margin:.8rem 0 0">Cambios anteriores</p><ul class="historial">${o.historial_fechas.map((c) => `<li>${esc(fechaHora(c.anterior))} → <b>${esc(fechaHora(c.nueva))}</b><small>Motivo: ${esc(c.justificacion)}</small></li>`).join('')}</ul>` : ''}
      </div>
      <div class="tarjeta">
        <div class="tarjeta__cab"><h3>${ico('info')} Número de orden</h3></div>
        <p style="word-break:break-all;font-family:ui-monospace,Consolas,monospace;font-size:.9rem">${esc(o.id)}</p>
        <p class="peque" style="color:var(--texto-suave)">Dale este número al taller si necesitas preguntar por tu orden.</p>
      </div>`;

    return `
      <a class="volver" href="#/ordenes">${ico('back')} Volver a las órdenes</a>
      <div class="orden-cab">
        <h2>Orden #${esc(corto(o.id))}</h2>${insigniaEstado(o.estado, 'badge--grande')}
        <span class="sub">${esc(cliente.nombre || '')} · ${esc(veh.placas || '')}</span>
        <div class="acciones" style="margin-left:auto"><button class="btn btn--suave btn--chico" data-act="recargar">${ico('refresh')} Actualizar</button></div>
      </div>
      <div class="tarjeta" style="margin-bottom:1rem">${pasos}</div>
      <div class="tarjeta tarjeta--paso" style="margin-bottom:1rem">${reqs}${siguiente}${extra.length ? `<div class="acciones" style="margin-top:1rem;padding-top:1rem;border-top:1px dashed var(--linea)">${extra.join('')}</div>` : ''}</div>
      <div class="dos-col"><div>${izquierda}</div><div>${derecha}</div></div>`;
  }

  /* ---------- Clientes ---------- */
  async function vistaClientes() {
    await cargar('clientes', 'flotillas');
    const lista = estado.datos.clientes;
    const filas = lista.map((c) => {
      const f = porId(estado.datos.flotillas, c.cuenta_flotilla_id);
      return `<tr>
        <td data-etq="Cliente"><b>${esc(c.nombre)}</b></td>
        <td data-etq="Contacto">${esc(c.telefono || '—')}<div class="peque">${esc(c.email || '')}</div></td>
        <td data-etq="Tipo">${f ? insignia('Flotilla: ' + f.razon_social, 'badge--rojo') : insignia('Particular')} ${c.es_preferente ? insignia('Preferente', 'badge--aviso') : ''}</td>
        <td data-etq="Estado">${c.activo ? insignia('Activo', 'badge--ok') : insignia('De baja', 'badge--oscuro')}</td>
        <td class="der">${puede('cotizar') ? `<button class="btn btn--suave btn--chico" data-act="${c.activo ? 'baja-cliente' : 'alta-cliente'}" data-id="${esc(c.id)}">${c.activo ? 'Dar de baja' : 'Reactivar'}</button>` : ''}</td></tr>`;
    }).join('');
    return `
      <div class="vista-cab"><div><h2>Clientes</h2><p>Personas y empresas que traen sus vehículos al taller.</p></div>
        <button class="btn btn--primario btn--grande" data-act="nuevo-cliente">${ico('plus')} Nuevo cliente</button></div>
      ${lista.length ? `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Cliente</th><th>Contacto</th><th>Tipo</th><th>Estado</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`
        : `<div class="tarjeta">${vacioHtml('users', 'Aún no hay clientes', 'Registra al primer cliente para poder recibir su vehículo.', `<button class="btn btn--primario" data-act="nuevo-cliente">${ico('plus')} Registrar cliente</button>`)}</div>`}`;
  }

  /* ---------- Vehículos ---------- */
  async function vistaVehiculos() {
    await cargar('vehiculos', 'flotillas');
    const lista = estado.datos.vehiculos;
    const filas = lista.map((v) => {
      const f = porId(estado.datos.flotillas, v.cuenta_flotilla_id);
      return `<tr>
        <td data-etq="Placas" class="id">${esc(v.placas)}</td>
        <td data-etq="Vehículo"><b>${esc(v.marca)} ${esc(v.modelo)}</b>${v.vin ? `<div class="peque">VIN ${esc(v.vin)}</div>` : ''}</td>
        <td data-etq="Kilometraje">${esc(Number(v.kilometraje).toLocaleString('es-MX'))} km</td>
        <td data-etq="Tipo">${f ? insignia('Flotilla: ' + f.razon_social, 'badge--rojo') : insignia('Particular')}</td>
        <td class="der"><button class="btn btn--suave btn--chico" data-act="historial" data-id="${esc(v.id)}">Ver historial</button></td></tr>`;
    }).join('');
    return `
      <div class="vista-cab"><div><h2>Vehículos</h2><p>Todos los vehículos registrados y su historial de servicios.</p></div>
        ${puede('cotizar') ? `<button class="btn btn--primario btn--grande" data-act="nuevo-vehiculo">${ico('plus')} Nuevo vehículo</button>` : ''}</div>
      ${lista.length ? `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Placas</th><th>Vehículo</th><th>Kilometraje</th><th>Tipo</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`
        : `<div class="tarjeta">${vacioHtml('car', 'Aún no hay vehículos', 'Registra un vehículo para poder abrir su orden de servicio.', `<button class="btn btn--primario" data-act="nuevo-vehiculo">${ico('plus')} Registrar vehículo</button>`)}</div>`}`;
  }

  /* ---------- Técnicos ---------- */
  async function vistaTecnicos() {
    await cargar('tecnicos');
    const lista = estado.datos.tecnicos;
    return `
      <div class="vista-cab"><div><h2>Técnicos</h2><p>Equipo mecánico del taller. «Ocupado» significa que ya tiene trabajos asignados.</p></div>
        <button class="btn btn--primario btn--grande" data-act="nuevo-tecnico">${ico('plus')} Nuevo técnico</button></div>
      ${lista.length ? `<div class="rejilla rejilla--3">${lista.map((t) => `
        <div class="tarjeta"><div class="persona"><span class="avatar">${ico('wrench')}</span>
          <div style="flex:1"><h3>${esc(t.nombre)}</h3><p>${esc(t.especialidad)}</p></div>
          ${t.disponible ? insignia('Disponible', 'badge--ok') : insignia('Ocupado', 'badge--aviso')}</div></div>`).join('')}</div>`
        : `<div class="tarjeta">${vacioHtml('wrench', 'Aún no hay técnicos', 'Registra a los técnicos para poder asignarles reparaciones.', `<button class="btn btn--primario" data-act="nuevo-tecnico">${ico('plus')} Registrar técnico</button>`)}</div>`}`;
  }

  /* ---------- Flotillas ---------- */
  async function vistaFlotillas() {
    await cargar('flotillas', 'clientes');
    const lista = estado.datos.flotillas;
    const filas = lista.map((f) => `<tr>
      <td data-etq="Empresa"><b>${esc(f.razon_social)}</b></td>
      <td data-etq="Quién autoriza">${esc((porId(estado.datos.clientes, f.autorizador_corporativo_id) || {}).nombre || '—')}</td>
      <td data-etq="Descuento">${esc(Number(f.descuento_pct))} %</td>
      <td data-etq="Prioridad">${esc(f.prioridad)}</td>
      <td data-etq="Crédito">${esc(f.dias_credito)} días</td></tr>`).join('');
    return `
      <div class="vista-cab"><div><h2>Flotillas</h2><p>Empresas con varios vehículos. Una sola persona autoriza todas sus reparaciones.</p></div>
        <button class="btn btn--primario btn--grande" data-act="nueva-flotilla">${ico('plus')} Nueva flotilla</button></div>
      ${lista.length ? `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Empresa</th><th>Quién autoriza</th><th>Descuento</th><th>Prioridad</th><th>Crédito</th></tr></thead><tbody>${filas}</tbody></table></div>`
        : `<div class="tarjeta">${vacioHtml('briefcase', 'Aún no hay flotillas', 'Primero registra a la persona que autoriza por la empresa y luego crea la flotilla.', `<button class="btn btn--primario" data-act="nueva-flotilla">${ico('plus')} Registrar flotilla</button>`)}</div>`}`;
  }

  /* ---------- Catálogo ---------- */
  async function vistaCatalogo() {
    await cargar('catalogo');
    const lista = estado.datos.catalogo;
    const filas = lista.map((i) => `<tr>
      <td data-etq="Servicio o refacción"><b>${esc(i.descripcion)}</b></td>
      <td data-etq="Precio" class="der">${esc(dinero(i.precio_mxn))}</td>
      <td data-etq="Disponibles" class="der">${esc(i.capacidad)}</td>
      <td data-etq="Estado">${i.habilitado ? insignia('Disponible', 'badge--ok') : insignia('No disponible', 'badge--oscuro')}</td></tr>`).join('');
    return `
      <div class="vista-cab"><div><h2>Servicios y precios</h2><p>Lista oficial de servicios y refacciones con su precio.</p></div>
        ${puede('cotizar') ? `<button class="btn btn--primario btn--grande" data-act="nuevo-recurso">${ico('plus')} Nuevo servicio o refacción</button>` : ''}</div>
      ${lista.length ? `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Servicio o refacción</th><th class="der">Precio</th><th class="der">Disponibles</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table></div>`
        : `<div class="tarjeta">${vacioHtml('tag', 'El catálogo está vacío', 'Agrega servicios y refacciones para usarlos al cotizar.', puede('cotizar') ? `<button class="btn btn--primario" data-act="nuevo-recurso">${ico('plus')} Agregar el primero</button>` : '')}</div>`}`;
  }

  /* =====================================================================
     7. Formularios de alta
     ===================================================================== */
  const refrescar = () => enrutar();

  async function formCliente(despues) {
    await cargar('flotillas');
    modal({
      titulo: 'Nuevo cliente', subtitulo: 'Datos de la persona o empresa que trae el vehículo.', boton: 'Guardar cliente',
      html: `
        ${campo({ nombre: 'nombre', etq: 'Nombre completo', requerido: true, attrs: 'maxlength="150" autocomplete="off"' })}
        <div class="aviso aviso--info">${ico('info')}<div>Necesitamos al menos <b>un teléfono o un correo</b> para avisarle del avance de su vehículo.</div></div>
        <div class="fila-campos">
          ${campo({ nombre: 'telefono', etq: 'Teléfono (celular)', tipo: 'tel', ayuda: 'Ejemplo: 8112345678', attrs: 'inputmode="tel"' })}
          ${campo({ nombre: 'email', etq: 'Correo electrónico', tipo: 'email', ayuda: 'Ejemplo: ana@correo.com' })}
        </div>
        ${estado.datos.flotillas.length ? seleccion({ nombre: 'flotilla', etq: '¿Pertenece a una flotilla?', opciones: estado.datos.flotillas.map((f) => [f.id, f.razon_social]), vacio: 'No, es cliente particular' }) : ''}
        ${casilla({ nombre: 'preferente', titulo: 'Cliente preferente', texto: 'Marca a clientes frecuentes o con beneficios especiales.' })}`,
      async alEnviar(f) {
        const d = new FormData(f);
        if (!d.get('telefono').trim() && !d.get('email').trim()) throw new ErroValidacion('Escribe un teléfono o un correo electrónico para poder contactar al cliente.');
        const r = await api('POST', '/clientes', {
          nombre: d.get('nombre').trim(), telefono: d.get('telefono').trim() || null, email: d.get('email').trim() || null,
          cuenta_flotilla_id: d.get('flotilla') || null, es_preferente: d.get('preferente') === 'on',
        });
        cerrarModal(); aviso('El cliente quedó registrado.', 'ok', 'Cliente guardado');
        despues ? despues(r.id) : refrescar();
      },
    });
  }

  async function formVehiculo(despues) {
    await cargar('flotillas');
    modal({
      titulo: 'Nuevo vehículo', subtitulo: 'Datos para identificar el vehículo.', boton: 'Guardar vehículo',
      html: `
        <div class="fila-campos">
          ${campo({ nombre: 'placas', etq: 'Placas', requerido: true, ayuda: 'Ejemplo: ABC-123', attrs: 'maxlength="10" style="text-transform:uppercase" autocomplete="off"' })}
          ${campo({ nombre: 'kilometraje', etq: 'Kilometraje actual', tipo: 'number', requerido: true, attrs: 'min="0" step="1" inputmode="numeric"', ayuda: 'Lo que marca el odómetro' })}
        </div>
        <div class="fila-campos">
          ${campo({ nombre: 'marca', etq: 'Marca', requerido: true, ayuda: 'Ejemplo: Nissan' })}
          ${campo({ nombre: 'modelo', etq: 'Modelo', requerido: true, ayuda: 'Ejemplo: Versa 2020' })}
        </div>
        ${campo({ nombre: 'vin', etq: 'Número de serie (VIN) — opcional', ayuda: '17 letras y números, sin I, O ni Q. Está en la tarjeta de circulación.', attrs: 'maxlength="17" style="text-transform:uppercase" autocomplete="off"' })}
        ${estado.datos.flotillas.length ? seleccion({ nombre: 'flotilla', etq: '¿Es de una flotilla?', opciones: estado.datos.flotillas.map((f) => [f.id, f.razon_social]), vacio: 'No, es particular' }) : ''}`,
      async alEnviar(f) {
        const d = new FormData(f);
        const r = await api('POST', '/vehiculos', {
          placas: d.get('placas').trim(), marca: d.get('marca').trim(), modelo: d.get('modelo').trim(),
          kilometraje: parseInt(d.get('kilometraje'), 10), vin: d.get('vin').trim() || null, cuenta_flotilla_id: d.get('flotilla') || null,
        });
        cerrarModal(); aviso('El vehículo quedó registrado.', 'ok', 'Vehículo guardado');
        despues ? despues(r.id) : refrescar();
      },
    });
  }

  function formTecnico() {
    modal({
      titulo: 'Nuevo técnico', boton: 'Guardar técnico',
      html: `${campo({ nombre: 'nombre', etq: 'Nombre completo', requerido: true })}
             ${campo({ nombre: 'especialidad', etq: 'Especialidad', requerido: true, ayuda: 'Ejemplo: Frenos, Motor, Suspensión, Electricidad' })}`,
      async alEnviar(f) {
        const d = new FormData(f);
        await api('POST', '/tecnicos', { nombre: d.get('nombre').trim(), especialidad: d.get('especialidad').trim() });
        cerrarModal(); aviso('El técnico quedó registrado.', 'ok', 'Técnico guardado'); refrescar();
      },
    });
  }

  async function formFlotilla() {
    await cargar('clientes');
    if (!estado.datos.clientes.length) {
      return modal({ titulo: 'Nueva flotilla', sinPie: true, html: `${vacioHtml('users', 'Primero registra al autorizador', 'Una flotilla necesita una persona que autorice las reparaciones. Registra a esa persona como cliente y vuelve aquí.', `<button type="button" class="btn btn--primario" id="ir-cliente">${ico('plus')} Registrar cliente</button>`)}`,
        alAbrir(f) { $('#ir-cliente', f).onclick = () => formCliente(); } });
    }
    modal({
      titulo: 'Nueva flotilla', subtitulo: 'Empresa con varios vehículos.', boton: 'Guardar flotilla',
      html: `
        ${campo({ nombre: 'razon_social', etq: 'Nombre de la empresa', requerido: true })}
        ${seleccion({ nombre: 'autorizador', etq: '¿Quién autoriza las reparaciones?', opciones: opcionesClientes(), requerido: true, ayuda: 'Es la única persona que podrá aprobar cotizaciones de esta empresa.' })}
        <div class="fila-campos">
          ${campo({ nombre: 'descuento', etq: 'Descuento (%)', tipo: 'number', valor: '0', attrs: 'min="0" max="100" step="0.01"', ayuda: 'Pon 0 si no hay descuento' })}
          ${campo({ nombre: 'credito', etq: 'Días de crédito', tipo: 'number', valor: '0', attrs: 'min="0" step="1"' })}
          ${campo({ nombre: 'prioridad', etq: 'Prioridad', tipo: 'number', valor: '0', attrs: 'min="0" step="1"', ayuda: 'Más alto = más urgente' })}
        </div>`,
      async alEnviar(f) {
        const d = new FormData(f);
        await api('POST', '/flotillas', {
          razon_social: d.get('razon_social').trim(), autorizador_corporativo_id: d.get('autorizador'),
          descuento_pct: String(d.get('descuento') || 0), prioridad: parseInt(d.get('prioridad') || 0, 10), dias_credito: parseInt(d.get('credito') || 0, 10),
        });
        cerrarModal(); aviso('La flotilla quedó registrada.', 'ok', 'Flotilla guardada'); refrescar();
      },
    });
  }

  function formRecurso() {
    modal({
      titulo: 'Nuevo servicio o refacción', boton: 'Guardar',
      html: `
        ${campo({ nombre: 'descripcion', etq: 'Nombre', requerido: true, ayuda: 'Ejemplo: Cambio de balatas delanteras' })}
        <div class="fila-campos">
          ${campo({ nombre: 'precio', etq: 'Precio (MXN)', tipo: 'number', requerido: true, attrs: 'min="0.01" step="0.01" inputmode="decimal"' })}
          ${campo({ nombre: 'capacidad', etq: '¿Cuántos hay disponibles?', tipo: 'number', requerido: true, valor: '1', attrs: 'min="0" step="1"', ayuda: 'Piezas en almacén o servicios que se pueden dar' })}
        </div>
        ${casilla({ nombre: 'habilitado', titulo: 'Disponible para cotizar', texto: 'Si lo desmarcas, no se podrá usar en cotizaciones.', marcado: true })}`,
      async alEnviar(f) {
        const d = new FormData(f);
        await api('POST', '/catalogo', { descripcion: d.get('descripcion').trim(), precio_mxn: Number(d.get('precio')).toFixed(2), capacidad: parseInt(d.get('capacidad'), 10), habilitado: d.get('habilitado') === 'on' });
        cerrarModal(); aviso('Quedó agregado al catálogo.', 'ok', 'Guardado'); refrescar();
      },
    });
  }

  /** Nueva orden: elegir cliente y vehículo, y anotar cómo llega el auto. */
  async function formOrden(previo = {}) {
    await cargar('clientes', 'vehiculos');
    const clientes = opcionesClientes();
    const vehs = estado.datos.vehiculos.map((v) => [v.id, etiquetaVehiculo(v)]);
    modal({
      titulo: 'Recibir un vehículo', subtitulo: 'Se abrirá una nueva orden de servicio.', boton: 'Abrir orden', ancho: true,
      html: `
        <div class="fila-campos">
          <div>${seleccion({ nombre: 'cliente_id', etq: 'Cliente', opciones: clientes, valor: previo.cliente_id || '', requerido: true, vacio: clientes.length ? 'Selecciona al cliente…' : 'Aún no hay clientes registrados' })}
            <button type="button" class="btn btn--suave btn--chico" id="otro-cliente" style="margin:-.4rem 0 1rem">${ico('plus')} Registrar cliente nuevo</button></div>
          <div>${seleccion({ nombre: 'vehiculo_id', etq: 'Vehículo', opciones: vehs, valor: previo.vehiculo_id || '', requerido: true, vacio: vehs.length ? 'Selecciona el vehículo…' : 'Aún no hay vehículos registrados' })}
            <button type="button" class="btn btn--suave btn--chico" id="otro-vehiculo" style="margin:-.4rem 0 1rem">${ico('plus')} Registrar vehículo nuevo</button></div>
        </div>
        <div class="fila-campos">
          ${campo({ nombre: 'kilometraje', etq: 'Kilometraje al recibirlo', tipo: 'number', requerido: true, valor: previo.kilometraje || '', attrs: 'min="0" step="1" inputmode="numeric"' })}
          <div class="campo"><span class="etq">Combustible <span class="req">*</span></span>
            <div class="segmentos" role="radiogroup" aria-label="Nivel de combustible">${COMBUSTIBLE.map(([v, t]) => `<label><input type="radio" name="combustible" value="${esc(v)}" required ${v === (previo.combustible || '1/2') ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></div>
        </div>
        ${area({ nombre: 'motivo', etq: '¿Qué le pasa al vehículo? (motivo de la visita)', requerido: true, valor: previo.motivo || '', ph: 'Ejemplo: Hace ruido al frenar y vibra el volante.' })}
        ${area({ nombre: 'danos', etq: 'Daños visibles al recibirlo — opcional', valor: previo.danos || '', ayuda: 'Escribe un daño por renglón. Sirve para evitar reclamos después.', ph: 'Rayón en la puerta derecha\nGolpe en el defensa trasera' })}
        ${casilla({ nombre: 'promo', titulo: 'Aplica una promoción vigente', marcado: !!previo.promo })}`,
      alAbrir(f) {
        const km = $('[name=kilometraje]', f), vsel = $('[name=vehiculo_id]', f);
        vsel.addEventListener('change', () => { const v = porId(estado.datos.vehiculos, vsel.value); if (v && !km.value) km.value = v.kilometraje; });
        const guardar = () => ({ cliente_id: f.cliente_id.value, vehiculo_id: f.vehiculo_id.value, kilometraje: km.value, combustible: (f.combustible.value || '1/2'), motivo: f.motivo.value, danos: f.danos.value, promo: f.promo.checked });
        $('#otro-cliente', f).onclick = () => { const p = guardar(); formCliente((id) => formOrden({ ...p, cliente_id: id })); };
        $('#otro-vehiculo', f).onclick = () => { const p = guardar(); formVehiculo(async (id) => { await cargar('vehiculos'); formOrden({ ...p, vehiculo_id: id, kilometraje: porId(estado.datos.vehiculos, id).kilometraje }); }); };
      },
      async alEnviar(f) {
        const d = new FormData(f);
        const o = await api('POST', '/ordenes', {
          cliente_id: d.get('cliente_id'), vehiculo_id: d.get('vehiculo_id'), kilometraje: parseInt(d.get('kilometraje'), 10),
          combustible: d.get('combustible'), motivo_ingreso: d.get('motivo').trim(), danos_visibles: lineas(d.get('danos')), promocion_activa: d.get('promo') === 'on',
        });
        cerrarModal(); aviso(`La orden #${corto(o.id)} quedó abierta. Sigue el diagnóstico del técnico.`, 'ok', 'Vehículo recibido');
        location.hash = `#/ordenes/${o.id}`;
      },
    });
  }

  async function verHistorial(id) {
    const [lista] = await Promise.all([api('GET', `/vehiculos/${encodeURIComponent(id)}/historial`), cargar('vehiculos')]);
    const v = porId(estado.datos.vehiculos, id) || {};
    modal({
      titulo: `Historial de ${v.placas || 'vehículo'}`, subtitulo: `${v.marca || ''} ${v.modelo || ''}`, sinPie: true, ancho: true,
      html: lista.length ? `<div class="tabla-caja"><table class="tabla responsive"><thead><tr><th>Orden</th><th>Fecha</th><th>Motivo</th><th>Estado</th><th></th></tr></thead><tbody>
        ${lista.map((o) => `<tr class="fila-click" data-ir="#/ordenes/${esc(o.id)}"><td data-etq="Orden" class="id">#${esc(corto(o.id))}</td><td data-etq="Fecha">${esc(fecha(o.creada_en))}</td><td data-etq="Motivo">${esc(o.motivo_ingreso)}</td><td data-etq="Estado">${insigniaEstado(o.estado)}</td><td class="der">${ico('arrow')}</td></tr>`).join('')}</tbody></table></div>`
        : vacioHtml('clipboard', 'Sin servicios todavía', 'Este vehículo aún no tiene órdenes de servicio.'),
    });
  }

  /* =====================================================================
     8. Acciones sobre una orden
     ===================================================================== */
  const actualizarOrden = (o, mensaje, titulo) => {
    cerrarModal();
    estado.ordenActual = o;
    $('#contenido').innerHTML = htmlOrden(o); iconos($('#contenido'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mensaje) aviso(mensaje, 'ok', titulo);
  };
  const ruta = (o, resto) => `/ordenes/${encodeURIComponent(o.id)}${resto}`;

  /** Filas de conceptos para cotizar. */
  function htmlFilaConcepto(i, catalogo) {
    return `<div class="concepto" data-fila="${i}">
      <div class="concepto__fila">
        <div class="campo"><label>¿Qué se va a cobrar?</label>
          <select data-c="origen"><option value="">Escribir manualmente</option>${catalogo.map((c) => `<option value="${esc(c.id)}">${esc(c.descripcion)} — ${esc(dinero(c.precio_mxn))}</option>`).join('')}</select></div>
        <div class="campo"><label>Tipo</label>
          <select data-c="tipo"><option value="mano_de_obra">Mano de obra</option><option value="refaccion">Refacción (pieza)</option></select></div>
      </div>
      <div class="concepto__fila ancho">
        <div class="campo"><label>Descripción</label><input type="text" data-c="desc" placeholder="Ejemplo: Cambio de balatas" required></div>
        <div class="campo"><label>Precio c/u</label><input type="number" data-c="precio" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" required></div>
        <div class="campo"><label>Cantidad</label><input type="number" data-c="cant" min="0.001" step="any" value="1" required></div>
      </div>
      <div class="concepto__pie"><span>Importe: <b data-c="importe">${esc(dinero(0))}</b></span>
        <button type="button" class="btn btn--fantasma btn--chico" data-c="quitar">${ico('trash')} Quitar</button></div></div>`;
  }

  function montarCotizacion(f, catalogo) {
    const caja = $('#conceptos', f); let n = 0;
    const total = () => {
      let s = 0;
      $$('.concepto', caja).forEach((fila) => {
        const p = Number($('[data-c=precio]', fila).value) || 0, c = Number($('[data-c=cant]', fila).value) || 0;
        $('[data-c=importe]', fila).textContent = dinero(p * c); s += p * c;
      });
      $('#subtotal', f).textContent = dinero(s);
    };
    const agregar = () => {
      caja.insertAdjacentHTML('beforeend', htmlFilaConcepto(n++, catalogo)); iconos(caja);
      const fila = caja.lastElementChild;
      const origen = $('[data-c=origen]', fila);
      origen.addEventListener('change', () => {
        const item = catalogo.find((c) => c.id === origen.value);
        const d = $('[data-c=desc]', fila), p = $('[data-c=precio]', fila);
        if (item) { d.value = item.descripcion; p.value = Number(item.precio_mxn).toFixed(2); d.readOnly = p.readOnly = true; }
        else { d.value = ''; p.value = ''; d.readOnly = p.readOnly = false; }
        total();
      });
      $('[data-c=quitar]', fila).addEventListener('click', () => { if ($$('.concepto', caja).length > 1) { fila.remove(); total(); } else aviso('La cotización necesita al menos un concepto.', 'error'); });
      fila.addEventListener('input', total);
      $('[data-c=desc]', fila).focus();
    };
    $('#agregar-concepto', f).addEventListener('click', agregar);
    agregar();
    return () => $$('.concepto', caja).map((fila) => {
      const origen = $('[data-c=origen]', fila).value, tipo = $('[data-c=tipo]', fila).value, cantidad = String($('[data-c=cant]', fila).value);
      return origen ? { tipo, recurso_id: origen, cantidad }
        : { tipo, descripcion: $('[data-c=desc]', fila).value.trim(), precio_unitario: Number($('[data-c=precio]', fila).value).toFixed(2), cantidad };
    });
  }

  async function formCotizacion({ titulo, subtitulo, enviar }) {
    await cargar('catalogo');
    const catalogo = estado.datos.catalogo.filter((c) => c.habilitado);
    let leer;
    modal({
      titulo, subtitulo, boton: 'Enviar cotización', ancho: true,
      html: `
        <div class="aviso aviso--info">${ico('info')}<div>Agrega cada trabajo y cada refacción. <b>El sistema calcula solo los impuestos y los descuentos.</b> Si eliges algo de la lista, se usa el precio oficial.</div></div>
        <div class="conceptos" id="conceptos"></div>
        <button type="button" class="btn btn--secundario" id="agregar-concepto">${ico('plus')} Agregar otro concepto</button>
        <p style="text-align:right;font-size:1.1rem;margin-top:1rem">Subtotal sin impuestos: <b id="subtotal">${esc(dinero(0))}</b></p>`,
      alAbrir(f) { leer = montarCotizacion(f, catalogo); },
      async alEnviar() { await enviar(leer()); },
    });
  }

  function formDecision({ titulo, cot, orden, enviar }) {
    const pendientes = cot.conceptos.filter((k) => k.estado === 'pendiente');
    modal({
      titulo, subtitulo: `Total cotizado: ${dinero(cot.total)} (incluye impuestos)`, boton: 'Confirmar mi decisión', ancho: true,
      html: `
        <div class="aviso aviso--info">${ico('info')}<div>Para cada concepto elige si lo <b>autorizas</b> o <b>no</b>. Solo se hará (y cobrará) lo que autorices.</div></div>
        <div class="acciones" style="margin-bottom:1rem">
          <button type="button" class="btn btn--suave btn--chico" data-todo="si">${ico('check')} Autorizar todo</button>
          <button type="button" class="btn btn--suave btn--chico" data-todo="no">${ico('x')} Rechazar todo</button>
        </div>
        ${pendientes.map((k) => `<div class="decision"><div><b>${esc(k.descripcion)}</b><small>${k.tipo === 'refaccion' ? 'Refacción' : 'Mano de obra'} · ${esc(Number(k.cantidad))} × ${esc(dinero(k.precio_unitario))} = <b>${esc(dinero(k.importe))}</b></small></div>
          <div class="segmentos si-no" role="radiogroup" aria-label="Decisión para ${esc(k.descripcion)}">
            <label><input type="radio" name="d_${esc(k.id)}" value="si" checked><span>${ico('check')} Autorizo</span></label>
            <label><input type="radio" name="d_${esc(k.id)}" value="no"><span>${ico('x')} No autorizo</span></label></div></div>`).join('')}
        ${seleccion({ nombre: 'canal', etq: '¿Cómo está respondiendo el cliente?', vacio: null, opciones: [['web', 'Desde el sitio web'], ['sms', 'Por mensaje SMS'], ['email', 'Por correo electrónico']] })}
        <p class="peque" style="color:var(--texto-suave)">El sistema guarda automáticamente la fecha, la hora y la dirección desde donde se autoriza, como comprobante.</p>
        <div id="aviso-rechazo"></div>`,
      alAbrir(f) {
        $$('[data-todo]', f).forEach((b) => b.addEventListener('click', () => { $$(`input[value="${b.dataset.todo}"]`, f).forEach((r) => { r.checked = true; }); revisar(); }));
        const revisar = () => {
          const todoNo = pendientes.every((k) => f.elements[`d_${k.id}`].value === 'no');
          $('#aviso-rechazo', f).innerHTML = todoNo && orden && !orden.__amp ? `<div class="aviso" style="margin-top:1rem">${ico('alert')}<div><b>Si rechazas todo, la orden se cancelará.</b></div></div>` : '';
        };
        f.addEventListener('change', revisar);
      },
      async alEnviar(f) {
        const decisiones = {};
        pendientes.forEach((k) => { decisiones[k.id] = f.elements[`d_${k.id}`].value === 'si'; });
        await enviar(decisiones, f.canal.value);
      },
    });
  }

  const ACCIONES = {
    async diagnostico(o) {
      modal({
        titulo: 'Registrar diagnóstico', subtitulo: 'Anota lo que encontraste al revisar el vehículo.', boton: 'Guardar diagnóstico',
        html: `${seleccion({ nombre: 'tecnico', etq: '¿Quién hizo el diagnóstico?', opciones: opcionesTecnicos(), requerido: true, vacio: opcionesTecnicos().length ? 'Selecciona al técnico…' : 'No hay técnicos registrados' })}
          ${area({ nombre: 'hallazgos', etq: 'Hallazgos', requerido: true, ayuda: 'Escribe un hallazgo por renglón.', ph: 'Balatas delanteras desgastadas\nDisco derecho rayado' })}`,
        async alEnviar(f) {
          const h = lineas(f.hallazgos.value);
          if (!h.length) throw new ErroValidacion('Escribe al menos un hallazgo.');
          actualizarOrden(await api('POST', ruta(o, '/diagnostico'), { tecnico_id: f.tecnico.value, hallazgos: h }), 'El asesor ya puede preparar la cotización.', 'Diagnóstico guardado');
        },
      });
    },
    cotizar(o) {
      return formCotizacion({ titulo: 'Crear cotización', subtitulo: 'Presupuesto que verá el cliente para autorizar.',
        enviar: async (conceptos) => actualizarOrden(await api('POST', ruta(o, '/cotizacion'), { conceptos }), 'Ahora el cliente debe autorizarla.', 'Cotización enviada') });
    },
    responder(o) {
      formDecision({ titulo: 'Responder la cotización', cot: o.cotizacion, orden: o,
        enviar: async (decisiones, canal) => {
          const r = await api('POST', ruta(o, '/cotizacion/respuesta'), { decisiones, canal });
          actualizarOrden(r, r.estado === 'Cancelado' ? 'La orden fue cancelada porque se rechazó toda la cotización.' : 'Gracias, ya registramos tu decisión.', 'Respuesta guardada');
        } });
    },
    async asignar(o) {
      await cargar('tecnicos');
      const libres = opcionesTecnicos(true);
      modal({
        titulo: 'Asignar técnico', subtitulo: 'Se crearán los trabajos con lo que el cliente autorizó.', boton: 'Asignar y empezar',
        html: libres.length ? seleccion({ nombre: 'tecnico', etq: '¿Quién hará la reparación?', opciones: libres, requerido: true, vacio: 'Selecciona al técnico…', ayuda: 'Solo aparecen los técnicos disponibles.' })
          : `<div class="aviso">${ico('alert')}<div>No hay técnicos disponibles ahora. Registra uno nuevo o espera a que se libere.</div></div>`,
        async alEnviar(f) { if (!f.tecnico) throw new ErroValidacion('No hay técnicos disponibles.'); actualizarOrden(await api('POST', ruta(o, '/trabajos'), { tecnico_id: f.tecnico.value }), 'La reparación comenzó.', 'Trabajo asignado'); },
      });
    },
    finalizar(o, arg) {
      confirmar({ titulo: '¿Terminaste este trabajo?', texto: 'Pasará a revisión de calidad con el asesor.', boton: 'Sí, ya lo terminé',
        alConfirmar: async () => actualizarOrden(await api('POST', ruta(o, `/trabajos/${encodeURIComponent(arg)}/finalizacion`)), 'Quedó pendiente de revisión de calidad.', 'Trabajo terminado') });
    },
    revisar(o, arg) {
      confirmar({ titulo: '¿El trabajo quedó bien?', texto: 'Al aprobar la calidad, este trabajo se da por revisado.', boton: 'Sí, aprobar calidad',
        alConfirmar: async () => actualizarOrden(await api('POST', ruta(o, `/trabajos/${encodeURIComponent(arg)}/revision`)), 'Calidad aprobada.', 'Trabajo revisado') });
    },
    reportar_ref(o) {
      const ya = new Set(o.solicitudes_refaccion.filter((s) => s.estado === 'pendiente').map((s) => s.concepto_id));
      const opciones = conceptosAutorizadosRefaccion(o).filter((k) => !ya.has(k.id)).map((k) => [k.id, k.descripcion]);
      modal({
        titulo: 'Refacción sin existencia', subtitulo: 'Se avisará a Compras y la reparación quedará en pausa.', boton: 'Avisar a Compras',
        html: opciones.length ? `${seleccion({ nombre: 'concepto', etq: '¿Qué refacción falta?', opciones, requerido: true })}
          ${campo({ nombre: 'fecha', etq: 'Llegada estimada — opcional', tipo: 'datetime-local', attrs: `min="${ahoraLocalInput()}"`, ayuda: 'Si ya la sabes. Compras puede actualizarla después.' })}`
          : `<div class="aviso aviso--info">${ico('info')}<div>No hay refacciones autorizadas pendientes de reportar.</div></div>`,
        async alEnviar(f) {
          if (!f.concepto) throw new ErroValidacion('No hay refacciones para reportar.');
          actualizarOrden(await api('POST', ruta(o, '/refacciones-faltantes'), { concepto_id: f.concepto.value, reposicion_estimada: f.fecha.value ? new Date(f.fecha.value).toISOString() : null }), 'Compras ya fue avisado.', 'Refacción reportada');
        },
      });
    },
    reposicion(o, arg) {
      modal({
        titulo: 'Nueva fecha de llegada', subtitulo: 'Se avisará al cliente del retraso y del nuevo tiempo estimado.', boton: 'Guardar y avisar al cliente',
        html: `${campo({ nombre: 'fecha', etq: 'Nueva fecha estimada de llegada', tipo: 'datetime-local', requerido: true, attrs: `min="${ahoraLocalInput()}"` })}
               ${area({ nombre: 'motivo', etq: 'Motivo del cambio', requerido: true, ph: 'Ejemplo: El proveedor se retrasó con el envío.' })}`,
        async alEnviar(f) {
          actualizarOrden(await api('PATCH', ruta(o, `/refacciones-faltantes/${encodeURIComponent(arg)}/reposicion`), { nueva_fecha: new Date(f.fecha.value).toISOString(), motivo: f.motivo.value.trim() }), 'Se notificó al cliente.', 'Fecha actualizada');
        },
      });
    },
    recepcion(o, arg) {
      confirmar({ titulo: '¿Ya llegó la refacción?', texto: 'Si no falta ninguna otra, la reparación se reanuda.', boton: 'Sí, ya llegó',
        alConfirmar: async () => actualizarOrden(await api('POST', ruta(o, `/refacciones-faltantes/${encodeURIComponent(arg)}/recepcion`)), 'La reparación puede continuar.', 'Refacción recibida') });
    },
    async falla(o) {
      await cargar('tecnicos');
      modal({
        titulo: 'Reportar falla adicional', subtitulo: 'Algo más que no estaba en la cotización. No se repara sin autorización del cliente.', boton: 'Reportar falla',
        html: `${seleccion({ nombre: 'tecnico', etq: '¿Quién la encontró?', opciones: opcionesTecnicos(), requerido: true })}
               ${area({ nombre: 'descripcion', etq: '¿Qué encontraste?', requerido: true, ph: 'Ejemplo: La banda de distribución está agrietada.' })}`,
        async alEnviar(f) { actualizarOrden(await api('POST', ruta(o, '/fallas-adicionales'), { tecnico_id: f.tecnico.value, descripcion: f.descripcion.value.trim() }), 'El asesor la cotizará para que el cliente decida.', 'Falla reportada'); },
      });
    },
    cotizar_amp(o, arg) {
      const a = o.solicitudes_ampliacion.find((x) => x.id === arg);
      return formCotizacion({ titulo: 'Cotizar falla adicional', subtitulo: a ? a.descripcion_falla : '',
        enviar: async (conceptos) => actualizarOrden(await api('POST', ruta(o, `/fallas-adicionales/${encodeURIComponent(arg)}/cotizacion`), { conceptos }), 'El cliente debe decidir si la autoriza.', 'Cotización enviada') });
    },
    responder_amp(o, arg) {
      const a = o.solicitudes_ampliacion.find((x) => x.id === arg);
      formDecision({ titulo: 'Falla adicional', cot: a.cotizacion, orden: { __amp: true },
        enviar: async (decisiones, canal) => actualizarOrden(await api('POST', ruta(o, `/fallas-adicionales/${encodeURIComponent(arg)}/respuesta`), { decisiones, canal }), 'Gracias, ya registramos tu decisión.', 'Respuesta guardada') });
    },
    fecha(o) {
      const hay = !!o.fecha_entrega;
      modal({
        titulo: hay ? 'Cambiar fecha de entrega' : 'Programar fecha de entrega', subtitulo: hay ? `Fecha actual: ${fechaHora(o.fecha_entrega)}` : 'Fecha en que el cliente podrá recoger su vehículo.', boton: hay ? 'Cambiar y avisar al cliente' : 'Guardar fecha',
        html: `${campo({ nombre: 'fecha', etq: 'Fecha y hora estimadas', tipo: 'datetime-local', requerido: true, attrs: `min="${ahoraLocalInput()}"` })}
          ${hay ? area({ nombre: 'justificacion', etq: '¿Por qué cambia la fecha?', requerido: true, ayuda: 'Se guarda en el historial y se le avisa al cliente.', ph: 'Ejemplo: Se encontró una falla adicional.' }) : ''}`,
        async alEnviar(f) {
          actualizarOrden(await api('PUT', ruta(o, '/fecha-entrega'), { fecha_estimada: new Date(f.fecha.value).toISOString(), justificacion: hay ? f.justificacion.value.trim() : null }), hay ? 'Se avisó al cliente del cambio.' : 'La fecha quedó programada.', 'Fecha guardada');
        },
      });
    },
    listo(o) {
      confirmar({ titulo: '¿Marcar como lista para entrega?', texto: 'El cliente podrá recoger su vehículo y Caja podrá cobrar.', boton: 'Sí, está lista',
        alConfirmar: async () => actualizarOrden(await api('POST', ruta(o, '/listo-para-entrega')), 'Ahora Caja puede cobrar.', 'Lista para entrega') });
    },
    cobro(o) {
      modal({
        titulo: 'Cobrar y cerrar la orden', subtitulo: 'Se cobra exactamente lo que el cliente autorizó.', boton: 'Registrar cobro',
        html: `<div class="aviso aviso--info">${ico('dollar')}<div>Total autorizado: <b style="font-size:1.2rem">${esc(dinero(o.total_autorizado))}</b></div></div>
               ${campo({ nombre: 'monto', etq: 'Monto cobrado (MXN)', tipo: 'number', requerido: true, valor: Number(o.total_autorizado).toFixed(2), attrs: 'min="0.01" step="0.01" inputmode="decimal"', ayuda: 'Debe ser igual al total autorizado.' })}`,
        async alEnviar(f) { actualizarOrden(await api('POST', ruta(o, '/cobro'), { monto: Number(f.monto.value).toFixed(2) }), 'La orden quedó cerrada y el vehículo entregado.', '¡Cobro registrado!'); },
      });
    },
    cancelar(o) {
      modal({
        titulo: 'Cancelar la orden', subtitulo: 'Esta acción no se puede deshacer.', boton: 'Sí, cancelar orden', peligro: true,
        html: `<div class="aviso">${ico('alert')}<div>Solo se puede cancelar antes de que empiece la reparación.</div></div>
               ${area({ nombre: 'motivo', etq: 'Motivo de la cancelación', requerido: true, ph: 'Ejemplo: El cliente decidió llevarlo a otro taller.' })}`,
        async alEnviar(f) { actualizarOrden(await api('POST', ruta(o, '/cancelacion'), { motivo: f.motivo.value.trim() }), 'La orden quedó cancelada.', 'Orden cancelada'); },
      });
    },
  };

  /* =====================================================================
     9. Ayuda
     ===================================================================== */
  function verAyuda() {
    modal({
      titulo: '¿Cómo funciona AutoFix Pro?', subtitulo: 'Cada orden avanza por estos pasos. Cada persona hace solo lo suyo.', sinPie: true, ancho: true,
      html: `<ol class="ayuda-pasos">${ETAPAS.map((e) => `<li><div><b>${esc(e.titulo)} <span class="badge badge--rojo">${esc(nombrePerfil(e.quien))}</span></b><span>${esc(e.texto)}</span></div></li>`).join('')}</ol>
        <div class="aviso aviso--info" style="margin-top:1.2rem">${ico('info')}<div><b>Consejos</b><br>
          • Si una orden no avanza, entra a ella: te dirá qué paso falta y quién debe hacerlo.<br>
          • Usa <b>Cambiar perfil</b> (arriba a la derecha) para hacer los pasos de otra persona.<br>
          • Si el sistema te dice que algo no se puede, léelo con calma: te explica el motivo.</div></div>
        <div style="text-align:right;margin-top:1rem"><button type="button" class="btn btn--primario" data-cerrar>Entendido</button></div>`,
    });
  }

  /* =====================================================================
     10. Eventos globales y arranque
     ===================================================================== */
  const MANEJADORES = {
    'cambiar-perfil': () => elegirPerfil(),
    'usar-perfil': (_, rol) => {
      if (!PERFILES[rol]) return;
      estado.perfil = rol; localStorage.setItem('afp.perfil', rol);
      pintarMarco(); enrutar();
      aviso(`Ahora trabajas como ${PERFILES[rol].nombre}.`, 'ok', 'Perfil cambiado');
    },
    'menu-abrir': () => { $('#lateral').classList.add('abierto'); $('#velo').hidden = false; },
    'menu-cerrar': cerrarMenuMovil,
    ayuda: verAyuda,
    recargar: () => enrutar(),
    'nueva-orden': () => formOrden(),
    'nuevo-cliente': () => formCliente(),
    'nuevo-vehiculo': () => formVehiculo(),
    'nuevo-tecnico': formTecnico,
    'nueva-flotilla': formFlotilla,
    'nuevo-recurso': formRecurso,
    historial: (_, id) => verHistorial(id),
    'baja-cliente': (b, id) => confirmar({ titulo: '¿Dar de baja a este cliente?', texto: 'No podrá abrir nuevas órdenes mientras esté de baja. Podrás reactivarlo cuando quieras.', boton: 'Sí, dar de baja', peligro: true,
      alConfirmar: async () => { await api('PATCH', `/clientes/${encodeURIComponent(id)}/estado`, { activo: false }); cerrarModal(); aviso('El cliente quedó de baja.'); refrescar(); } }),
    'alta-cliente': async (b, id) => { try { await api('PATCH', `/clientes/${encodeURIComponent(id)}/estado`, { activo: true }); aviso('El cliente está activo otra vez.'); refrescar(); } catch (e) { aviso(e.message, 'error'); } },
  };

  document.addEventListener('click', async (e) => {
    const fila = e.target.closest('[data-ir]');
    const btn = e.target.closest('[data-act], [data-accion]');
    if (btn) {
      try {
        if (btn.dataset.accion) { const o = estado.ordenActual; if (o) await ACCIONES[btn.dataset.accion](o, btn.dataset.arg); }
        else if (MANEJADORES[btn.dataset.act]) await MANEJADORES[btn.dataset.act](btn, btn.dataset.id);
      } catch (err) { aviso(err.message || 'Ocurrió un error.', 'error'); }
      return;
    }
    if (fila) { cerrarModal(); location.hash = fila.dataset.ir; }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-ir]')) { e.preventDefault(); location.hash = e.target.dataset.ir; }
  });

  async function revisarSistema() {
    const el = $('#estado-sistema'), txt = $('span', el);
    try {
      const r = await fetch('/health'); if (!r.ok) throw 0;
      el.className = 'sistema ok'; txt.textContent = 'Sistema en línea';
    } catch { el.className = 'sistema mal'; txt.textContent = 'Sin conexión con el sistema'; }
  }

  window.addEventListener('hashchange', enrutar);
  iconos();
  revisarSistema(); setInterval(revisarSistema, 30000);
  if (estado.perfil && PERFILES[estado.perfil]) { $('#app').hidden = false; pintarMarco(); enrutar(); }
  else { elegirPerfil(); }
})();
