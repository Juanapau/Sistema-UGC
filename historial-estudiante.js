// ===================================================================
// HISTORIAL DEL ESTUDIANTE — módulo compartido para vistas de consulta
// Replica EXACTAMENTE el historial del panel admin: resumen, contacto,
// citaciones, línea de tiempo, comparativa por año y exportación a PDF.
// Se carga al final de la página y sobrescribe el historial anterior.
// ===================================================================

// Derivar URLs de Config y Citaciones a partir de una URL existente
(function(){
  function _swapHoja(url, hoja){ return url ? url.replace(/hoja=[^&]+/, 'hoja=' + hoja) : ''; }
  if (typeof CONFIG !== 'undefined' && CONFIG) {
    if (!CONFIG.urlConfig)     CONFIG.urlConfig     = _swapHoja(CONFIG.urlIncidencias || CONFIG.urlTardanzas, 'Config');
    if (!CONFIG.urlCitaciones) CONFIG.urlCitaciones = _swapHoja(CONFIG.urlIncidencias || CONFIG.urlTardanzas, 'Citaciones');
  }
})();

var _comparativaAnualCache = { nombre: null, datos: null };
var ANIO_ACTIVO = (typeof ANIO_ACTIVO !== 'undefined') ? ANIO_ACTIVO : '';
var ANIOS_DISPONIBLES = (typeof ANIOS_DISPONIBLES !== 'undefined') ? ANIOS_DISPONIBLES : [];
var datosCitaciones = (typeof datosCitaciones !== 'undefined') ? datosCitaciones : [];

// En la consulta los datos ya llegan filtrados al año consultado.
function esAnioActivo() { return true; }
// Vista de solo lectura: sin encabezado/botón de condicional.
function htmlCondicionalEncabezadoInner() { return ''; }

// Cargar año activo, años disponibles y citaciones del año consultado
(async function _initHistorialConsulta(){
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.urlConfig && typeof cargarDatosDesdeGoogleSheets === 'function') {
      const cfg = await cargarDatosDesdeGoogleSheets(CONFIG.urlConfig);
      const c = Array.isArray(cfg) ? (cfg[0] || {}) : (cfg || {});
      ANIO_ACTIVO = String(c['añoActivo'] || c['anoActivo'] || ANIO_ACTIVO || '').trim();
      const disp = String(c['añosDisponibles'] || c['anosDisponibles'] || '').trim();
      if (disp) ANIOS_DISPONIBLES = disp.split(',').map(s => s.trim()).filter(Boolean);
    }
  } catch (e) { console.warn('Historial: no se pudo cargar Config', e); }
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.urlCitaciones && typeof cargarDatosDesdeGoogleSheets === 'function') {
      const anio = (typeof ANIO_CONSULTA !== 'undefined' && ANIO_CONSULTA) ? ANIO_CONSULTA : '';
      const url = anio ? (CONFIG.urlCitaciones + '&anio=' + encodeURIComponent(anio)) : CONFIG.urlCitaciones;
      const cit = await cargarDatosDesdeGoogleSheets(url);
      datosCitaciones = Array.isArray(cit) ? cit : [];
    }
  } catch (e) { console.warn('Historial: no se pudo cargar Citaciones', e); }
})();

// ===== normalizarNombreCmp =====
function normalizarNombreCmp(nombre) {
    return String(nombre || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,;:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .sort()
        .join(' ');
}

// ===== formatearFechaCorta =====
function formatearFechaCorta(valor) {
    if (!valor) return '';
    const s = String(valor).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${parseInt(m[3], 10)}/${parseInt(m[2], 10)}/${m[1]}`;
    return s;
}

// ===== leerAsistio =====
function leerAsistio(r) {
    if (!r) return false;
    let v = r['Asistió'];
    if (v === undefined) v = r['¿Asistió?'];
    if (v === undefined) v = r['Asistio'];
    if (v === undefined) v = r['asistio'];
    if (v === undefined) v = r.asistio;
    if (v === true) return true;
    if (v === false || v === null || v === undefined) return false;
    v = String(v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return v === 'si' || v === 's' || v === 'yes' || v === 'y' ||
           v === 'true' || v === 'verdadero' || v === 'x' || v === '1';
}

// ===== colorAsistencia =====
function colorAsistencia(a) {
    a = a || 'Pendiente';
    return a === 'Asistió' ? '#16a34a' : a === 'No asistió' ? '#dc2626' : a === 'Reprogramada' ? '#7c3aed' : '#f59e0b';
}

// ===== colorCumplimiento =====
function colorCumplimiento(c) {
    c = c || 'Sin revisar';
    return c === 'Cumplido' ? '#16a34a' : c === 'Parcial' ? '#f59e0b' : c === 'Incumplido' ? '#dc2626' : '#6b7280';
}

// ===== obtenerComparativaAnual =====
async function obtenerComparativaAnual(nombreEstudiante) {
    const nombreLC = (nombreEstudiante || '').toLowerCase();
    const nombreNorm = normalizarNombreCmp(nombreEstudiante);
    if (_comparativaAnualCache.nombre === nombreLC && _comparativaAnualCache.datos) {
        return _comparativaAnualCache.datos;
    }

    const anios = (ANIOS_DISPONIBLES && ANIOS_DISPONIBLES.length)
        ? ANIOS_DISPONIBLES.slice()
        : (ANIO_ACTIVO ? [ANIO_ACTIVO] : []);
    if (!anios.length) return [];

    // Ordenar cronológicamente por el año de inicio (ej. "2025-2026" -> 2025)
    anios.sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));

    const tipoDe = (i) => (i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '');
    const nombreDe = (r) => (r['Nombre Estudiante'] || r.estudiante || '');

    const datos = await Promise.all(anios.map(async (anio) => {
        let inc = [], tar = [];
        if (CONFIG.urlIncidencias) {
            inc = await cargarDatosDesdeGoogleSheets(CONFIG.urlIncidencias + '&anio=' + encodeURIComponent(anio)) || [];
        }
        if (CONFIG.urlTardanzas) {
            tar = await cargarDatosDesdeGoogleSheets(CONFIG.urlTardanzas + '&anio=' + encodeURIComponent(anio)) || [];
        }
        const incEst = inc.filter(i => normalizarNombreCmp(nombreDe(i)) === nombreNorm);
        const tarEst = tar.filter(t => normalizarNombreCmp(nombreDe(t)) === nombreNorm);
        return {
            anio,
            leves:     incEst.filter(i => tipoDe(i) === 'Leve').length,
            graves:    incEst.filter(i => tipoDe(i) === 'Grave').length,
            muyGraves: incEst.filter(i => tipoDe(i) === 'Muy Grave').length,
            tardanzas: tarEst.length
        };
    }));

    _comparativaAnualCache = { nombre: nombreLC, datos };
    return datos;
}

// ===== renderComparativaAnual =====
async function renderComparativaAnual(nombreEstudiante) {
    const cont = document.getElementById('comparativaAnualContent');
    if (!cont) return;
    try {
        const datos = await obtenerComparativaAnual(nombreEstudiante);
        if (!datos.length) {
            cont.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:24px;">No hay años escolares configurados para comparar.</p>';
            return;
        }
        cont.innerHTML = construirGraficoComparativa(datos);
    } catch (e) {
        console.error('Error al cargar comparativa anual:', e);
        cont.innerHTML = '<p style="text-align:center;color:#dc3545;padding:24px;">No se pudo cargar la comparativa por año. Intenta recargar el historial.</p>';
    }
}

// ===== construirGraficoComparativa =====
function construirGraficoComparativa(datos) {
    const esOscuro  = document.body.classList.contains('dark-mode');
    const cText     = esOscuro ? '#e2e8f0' : '#374151';
    const cTextSoft = esOscuro ? '#94a3b8' : '#6b7280';
    const cGrid     = esOscuro ? '#334155' : '#e5e7eb';
    const cAxis     = esOscuro ? '#475569' : '#9ca3af';
    const cPanel    = esOscuro ? '#0f172a' : '#f8fafc';

    const series = [
        { key: 'leves',     label: 'Leves',      color: '#22c55e' },
        { key: 'graves',    label: 'Graves',     color: '#f97316' },
        { key: 'muyGraves', label: 'Muy Graves', color: '#dc2626' },
        { key: 'tardanzas', label: 'Tardanzas',  color: '#f59e0b' }
    ];

    const totalGlobal = datos.reduce((s, d) => s + d.leves + d.graves + d.muyGraves + d.tardanzas, 0);
    if (totalGlobal === 0) {
        return '<p style="text-align:center;color:' + cTextSoft + ';padding:30px;">Este estudiante no tiene incidencias ni tardanzas registradas en ningún año escolar.</p>';
    }

    // ---- Texto de tendencia: compara los dos últimos años CON registros ----
    const conDatos = datos.filter(d => (d.leves + d.graves + d.muyGraves + d.tardanzas) > 0);
    let trendHTML = '';
    if (conDatos.length >= 2) {
        const ult  = conDatos[conDatos.length - 1];
        const prev = conDatos[conDatos.length - 2];
        const fUlt  = ult.leves + ult.graves + ult.muyGraves;
        const fPrev = prev.leves + prev.graves + prev.muyGraves;
        const diff = fUlt - fPrev;
        const enCurso = (ult.anio === ANIO_ACTIVO) ? ' (año en curso, aún incompleto)' : '';
        let icono, color, texto;
        if (diff < 0)      { icono = '▼'; color = '#16a34a'; texto = 'Mejoría: las faltas bajaron de ' + fPrev + ' a ' + fUlt; }
        else if (diff > 0) { icono = '▲'; color = '#dc2626'; texto = 'Atención: las faltas subieron de ' + fPrev + ' a ' + fUlt; }
        else               { icono = '='; color = cTextSoft; texto = 'Las faltas se mantuvieron en ' + fUlt; }
        trendHTML =
            '<div style="background:' + cPanel + ';border-left:4px solid ' + color + ';padding:12px 16px;border-radius:8px;margin-bottom:18px;">' +
                '<span style="color:' + color + ';font-weight:700;font-size:1.1em;margin-right:6px;">' + icono + '</span>' +
                '<span style="color:' + cText + ';font-weight:600;">' + texto + '</span>' +
                '<span style="color:' + cTextSoft + ';"> en ' + ult.anio + ' respecto a ' + prev.anio + enCurso + '.</span>' +
            '</div>';
    } else {
        trendHTML = '<div style="background:' + cPanel + ';border-left:4px solid ' + cAxis + ';padding:12px 16px;border-radius:8px;margin-bottom:18px;color:' + cTextSoft + ';">Aún no hay otro año escolar con registros para comparar.</div>';
    }

    // ---- Gráfico de barras agrupadas (SVG, compatible con modo claro/oscuro) ----
    const W = 720, H = 360;
    const padL = 44, padR = 16, padT = 24, padB = 64;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const nGroups = datos.length;
    const groupW = plotW / nGroups;
    const innerPad = groupW * 0.14;
    const barGap = 4;
    const barsAreaW = groupW - innerPad * 2;
    const barW = Math.max(6, (barsAreaW - barGap * (series.length - 1)) / series.length);

    const maxVal = Math.max(1, ...datos.flatMap(d => series.map(s => d[s.key])));
    const steps = 4;
    const yTop = Math.max(steps, Math.ceil(maxVal / steps) * steps);
    const yToPix = (v) => padT + plotH - (v / yTop) * plotH;

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit;display:block;">';

    // Líneas guía y etiquetas del eje Y
    for (let i = 0; i <= steps; i++) {
        const val = Math.round(yTop * i / steps);
        const y = yToPix(val);
        svg += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '" stroke="' + cGrid + '" stroke-width="1"/>';
        svg += '<text x="' + (padL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="' + cTextSoft + '">' + val + '</text>';
    }

    // Grupos de barras por año
    datos.forEach((d, gi) => {
        const gx = padL + gi * groupW;
        series.forEach((s, si) => {
            const v = d[s.key];
            const bx = gx + innerPad + si * (barW + barGap);
            const by = yToPix(v);
            const bh = (padT + plotH) - by;
            if (v > 0) {
                svg += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3" fill="' + s.color + '"/>';
                svg += '<text x="' + (bx + barW / 2).toFixed(1) + '" y="' + (by - 4).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="700" fill="' + cText + '">' + v + '</text>';
            }
        });
        const etiqueta = d.anio + (d.anio === ANIO_ACTIVO ? ' • en curso' : '');
        svg += '<text x="' + (gx + groupW / 2).toFixed(1) + '" y="' + (padT + plotH + 20) + '" text-anchor="middle" font-size="12" font-weight="600" fill="' + cText + '">' + etiqueta + '</text>';
    });

    // Eje X
    svg += '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '" stroke="' + cAxis + '" stroke-width="1.5"/>';

    // Leyenda
    const legendY = H - 22;
    let lx = padL;
    series.forEach(s => {
        svg += '<rect x="' + lx + '" y="' + (legendY - 10) + '" width="12" height="12" rx="2" fill="' + s.color + '"/>';
        svg += '<text x="' + (lx + 17) + '" y="' + legendY + '" font-size="12" fill="' + cTextSoft + '">' + s.label + '</text>';
        lx += 17 + s.label.length * 7 + 20;
    });

    svg += '</svg>';
    return trendHTML + '<div style="overflow-x:auto;">' + svg + '</div>';
}

// ===== dibujarComparativaAnualPDF =====
function dibujarComparativaAnualPDF(doc, datos, yPos) {
    const totalGlobal = datos.reduce((s, d) => s + d.leves + d.graves + d.muyGraves + d.tardanzas, 0);

    // Reservar espacio: si el bloque no cabe en la página, pasar a una nueva
    const espacioNecesario = (totalGlobal === 0) ? 24 : 92;
    if (yPos > 277 - espacioNecesario) {
        doc.addPage();
        yPos = 20;
    }

    // Encabezado de sección
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('COMPARATIVA POR AÑO ESCOLAR', 14, yPos);
    yPos += 6;
    doc.setTextColor(0, 0, 0);

    if (totalGlobal === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Sin incidencias ni tardanzas registradas en ningún año escolar.', 14, yPos);
        doc.setTextColor(0, 0, 0);
        return yPos + 6;
    }

    // Texto de tendencia (compara los dos últimos años con registros)
    const conDatos = datos.filter(d => (d.leves + d.graves + d.muyGraves + d.tardanzas) > 0);
    if (conDatos.length >= 2) {
        const ult = conDatos[conDatos.length - 1];
        const prev = conDatos[conDatos.length - 2];
        const fUlt = ult.leves + ult.graves + ult.muyGraves;
        const fPrev = prev.leves + prev.graves + prev.muyGraves;
        const diff = fUlt - fPrev;
        const enCurso = (ult.anio === ANIO_ACTIVO) ? ' (en curso, aún incompleto)' : '';
        let texto, rgb;
        if (diff < 0)      { rgb = [22, 163, 74];  texto = 'Mejoría: las faltas bajaron de ' + fPrev + ' a ' + fUlt + ' en ' + ult.anio + ' respecto a ' + prev.anio + enCurso + '.'; }
        else if (diff > 0) { rgb = [220, 38, 38];  texto = 'Atención: las faltas subieron de ' + fPrev + ' a ' + fUlt + ' en ' + ult.anio + ' respecto a ' + prev.anio + enCurso + '.'; }
        else               { rgb = [90, 90, 90];   texto = 'Las faltas se mantuvieron en ' + fUlt + ' en ' + ult.anio + ' respecto a ' + prev.anio + enCurso + '.'; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const lineas = doc.splitTextToSize(texto, 182);
        doc.text(lineas, 14, yPos);
        yPos += lineas.length * 4 + 3;
        doc.setTextColor(0, 0, 0);
    } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Aún no hay otro año escolar con registros para comparar.', 14, yPos);
        yPos += 6;
        doc.setTextColor(0, 0, 0);
    }

    // Gráfico de barras agrupadas (nativo, mismos colores que en pantalla)
    const series = [
        { key: 'leves',     label: 'Leves',      rgb: [34, 197, 94] },
        { key: 'graves',    label: 'Graves',     rgb: [249, 115, 22] },
        { key: 'muyGraves', label: 'Muy Graves', rgb: [220, 38, 38] },
        { key: 'tardanzas', label: 'Tardanzas',  rgb: [245, 158, 11] }
    ];
    const axisX = 24, rightX = 196;
    const plotW = rightX - axisX;
    const topY = yPos + 2;
    const plotH = 48;
    const baseY = topY + plotH;

    const maxVal = Math.max(1, ...datos.flatMap(d => series.map(s => d[s.key])));
    const steps = 4;
    const yTop = Math.max(steps, Math.ceil(maxVal / steps) * steps);

    // Líneas guía + etiquetas del eje Y
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    for (let i = 0; i <= steps; i++) {
        const val = Math.round(yTop * i / steps);
        const gy = baseY - (val / yTop) * plotH;
        doc.setDrawColor(226, 228, 232);
        doc.setLineWidth(0.2);
        doc.line(axisX, gy, rightX, gy);
        doc.setTextColor(120, 120, 120);
        doc.text(String(val), axisX - 2, gy + 1.4, { align: 'right' });
    }

    // Barras por año
    const nGroups = datos.length;
    const groupW = plotW / nGroups;
    const innerPad = groupW * 0.14;
    const barGap = 1.5;
    const barsAreaW = groupW - innerPad * 2;
    const barW = Math.max(2, (barsAreaW - barGap * (series.length - 1)) / series.length);

    datos.forEach((d, gi) => {
        const gx = axisX + gi * groupW;
        series.forEach((s, si) => {
            const v = d[s.key];
            if (v > 0) {
                const bh = (v / yTop) * plotH;
                const bx = gx + innerPad + si * (barW + barGap);
                const by = baseY - bh;
                doc.setFillColor(s.rgb[0], s.rgb[1], s.rgb[2]);
                doc.rect(bx, by, barW, bh, 'F');
                doc.setTextColor(70, 70, 70);
                doc.setFontSize(6);
                doc.text(String(v), bx + barW / 2, by - 1, { align: 'center' });
            }
        });
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const etq = d.anio + (d.anio === ANIO_ACTIVO ? ' (en curso)' : '');
        doc.text(etq, gx + groupW / 2, baseY + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
    });

    // Eje X
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(axisX, baseY, rightX, baseY);

    // Leyenda
    let ly = baseY + 9, lx = axisX;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    series.forEach(s => {
        doc.setFillColor(s.rgb[0], s.rgb[1], s.rgb[2]);
        doc.rect(lx, ly - 2.5, 3, 3, 'F');
        doc.setTextColor(80, 80, 80);
        doc.text(s.label, lx + 4.5, ly);
        lx += 4.5 + doc.getTextWidth(s.label) + 6;
    });

    doc.setTextColor(0, 0, 0);
    return ly + 6;
}

// ===== agregarEncabezadoCENSA =====
function agregarEncabezadoCENSA(doc, tipoReporte) {
    // Logo del Politécnico Nuestra Señora de la Altagracia en base64
    const logoBase64 = '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';
    
    // Obtener dimensiones de página
    const anchoTotal = doc.internal.pageSize.getWidth();
    const centroX = anchoTotal / 2;
    
    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, anchoTotal, 40, 'F');
    
    // Agregar logo pequeño a la izquierda
    try {
        doc.addImage(logoBase64, 'JPEG', 10, 5, 20, 20);
    } catch (error) {
        console.log('Error al cargar logo:', error);
    }
    
    // Colores institucionales
    const azulOscuro = [30, 58, 138]; // Azul del encabezado
    const verde = [76, 175, 80]; // Verde de MINERD
    
    // Título principal en azul oscuro - TEXTO PEQUEÑO Y DESPLAZADO A LA DERECHA
    doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('POLITECNICO NUESTRA SEÑORA DE LA ALTAGRACIA', centroX + 5, 9, { align: 'center' });
    
    // Subtítulo en verde - TEXTO PEQUEÑO
    doc.setTextColor(verde[0], verde[1], verde[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('MINERD-Red de Escuelas Salesianas (FMA)', centroX + 5, 15, { align: 'center' });
    
    // Unidad de Gestión en negro - TEXTO PEQUEÑO
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Unidad de Gestión de la Convivencia', centroX + 5, 21, { align: 'center' });
    
    // Línea separadora azul
    doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setLineWidth(0.5);
    doc.line(10, 28, anchoTotal - 10, 28);
    
    // Tipo de reporte en azul - TEXTO PEQUEÑO
    doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(tipoReporte, centroX, 35, { align: 'center' });
    
    // Restablecer color de texto a negro
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    return 42; // Posición Y donde comienza el contenido
}

// ===== cerrarHistorialEstudiante =====
function cerrarHistorialEstudiante() {
    const modal = document.getElementById('modalHistorialEstudiante');
    if (modal) {
        modal.remove();
    }
}

// ===== abrirHistorialEstudiante =====
function abrirHistorialEstudiante(nombreEstudiante) {
    // Buscar información del estudiante
    const estudiante = datosEstudiantes.find(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        return normalizarNombreCmp(nombre) === normalizarNombreCmp(nombreEstudiante);
    });
    
    if (!estudiante) {
        alert('Estudiante no encontrado');
        return;
    }
    
    const nombre = estudiante['Nombre Completo'] || estudiante.nombre || '';
    const curso = estudiante['Curso'] || estudiante.curso || '';
    
    // Recopilar toda la información
    const incidencias = datosIncidencias.filter(i => {
        const nom = i['Nombre Estudiante'] || i.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    const tardanzas = datosTardanzas.filter(t => {
        const nom = t['Nombre Estudiante'] || t.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    const reuniones = datosReuniones.filter(r => {
        if (!esAnioActivo(r)) return false;  // solo reuniones del año activo
        const nom = r['Nombre Estudiante'] || r.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    const contacto = datosContactos.find(c => {
        const nom = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    // Citaciones a padres de este estudiante
    const citacionesEst = (typeof datosCitaciones !== 'undefined' && Array.isArray(datosCitaciones))
        ? datosCitaciones.filter(c => {
            if (!esAnioActivo(c)) return false;  // solo citaciones del año activo
            const nom = c['Estudiante'] || c['Nombre Estudiante'] || c.estudiante || '';
            return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
        })
        : [];
    
    // Contar incidencias por tipo
    const incidenciasLeves = incidencias.filter(i => {
        const tipo = i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '';
        return tipo === 'Leve';
    }).length;
    
    const incidenciasGraves = incidencias.filter(i => {
        const tipo = i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '';
        return tipo === 'Grave';
    }).length;
    
    const incidenciasMuyGraves = incidencias.filter(i => {
        const tipo = i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '';
        return tipo === 'Muy Grave';
    }).length;
    
    // Total de tardanzas (todas)
    const tardanzasTotales = tardanzas.length;
    
    // Determinar estado basado en todas las tardanzas y faltas graves/muy graves
    const faltasGravesYMuyGraves = incidenciasGraves + incidenciasMuyGraves;
    let estadoColor = '#059669';
    let estadoTexto = 'Normal';
    let estadoIcono = '✅';
    
    if (faltasGravesYMuyGraves >= 3 || tardanzasTotales >= 10) {
        estadoColor = '#dc2626';
        estadoTexto = 'Requiere Atención Urgente';
        estadoIcono = '🚨';
    } else if (faltasGravesYMuyGraves >= 1 || tardanzasTotales >= 5) {
        estadoColor = '#f59e0b';
        estadoTexto = 'Requiere Atención';
        estadoIcono = '⚠️';
    }
    
    // Generar HTML de contactos
    let htmlContactos = '';
    if (contacto) {
        const nombrePadre = contacto['Nombre Padre'] || contacto.nombrePadre || '';
        const telPadre = contacto['Contacto Padre'] || contacto.telPadre || '';
        const nombreMadre = contacto['Nombre Madre'] || contacto.nombreMadre || '';
        const telMadre = contacto['Contacto Madre'] || contacto.telMadre || '';
        const telEmergencia = contacto['Contacto Emergencia'] || contacto.telEmergencia || '';
        
        if (nombrePadre && telPadre) {
            htmlContactos += `
                <div style="background:#f8f9fa;padding:15px;border-radius:8px;">
                    <h4 style="color:#333;margin-bottom:8px;">👨 Padre</h4>
                    <p style="margin-bottom:10px;">${nombrePadre}<br>☎️ ${telPadre}</p>
                    <button class="btn btn-success" style="background:#25D366;padding:8px 15px;font-size:0.9em;" onclick="abrirWhatsApp('${telPadre}', 'Saludos,\\n\\n')">💬 WhatsApp</button>
                </div>
            `;
        }
        
        if (nombreMadre && telMadre) {
            htmlContactos += `
                <div style="background:#f8f9fa;padding:15px;border-radius:8px;">
                    <h4 style="color:#333;margin-bottom:8px;">👩 Madre</h4>
                    <p style="margin-bottom:10px;">${nombreMadre}<br>☎️ ${telMadre}</p>
                    <button class="btn btn-success" style="background:#25D366;padding:8px 15px;font-size:0.9em;" onclick="abrirWhatsApp('${telMadre}', 'Saludos,\\n\\n')">💬 WhatsApp</button>
                </div>
            `;
        }
        
        if (telEmergencia) {
            htmlContactos += `
                <div style="background:#f8f9fa;padding:15px;border-radius:8px;">
                    <h4 style="color:#333;margin-bottom:8px;">🚨 Emergencia</h4>
                    <p style="margin-bottom:10px;">☎️ ${telEmergencia}</p>
                    <button class="btn btn-success" style="background:#25D366;padding:8px 15px;font-size:0.9em;" onclick="abrirWhatsApp('${telEmergencia}', 'Saludos,\\n\\n')">💬 WhatsApp</button>
                </div>
            `;
        }
    }
    
    if (!htmlContactos) {
        htmlContactos = '<p style="color:#f59e0b;font-style:italic;">⚠️ Sin contactos registrados</p>';
    }
    
    // Generar línea de tiempo combinando todo
    let eventos = [];
    
    incidencias.forEach(inc => {
        eventos.push({
            fecha: new Date(inc['Fecha y Hora'] || inc['Fecha'] || inc.fecha || ''),
            tipo: 'incidencia',
            titulo: inc['Tipo de Conducta'] || inc.tipoConducta || 'Incidencia',
            descripcion: inc['Descripción'] || inc.descripcion || '',
            gravedad: inc['Tipo'] || inc['Tipo de falta'] || inc['Tipo de Falta'] || inc.tipoFalta || inc.tipo || 'Sin clasificar',
            docente: inc['Docente'] || inc['Docente que Reporta'] || inc.docenteReporta || inc.docente || 'No especificado'
        });
    });
    
    tardanzas.forEach(tard => {
        eventos.push({
            fecha: new Date(tard['Fecha'] || tard.fecha || ''),
            tipo: 'tardanza',
            titulo: 'Tardanza',
            descripcion: 'Llegada tardía',
            motivo: tard['Motivo'] || tard.motivo || ''
        });
    });
    
    reuniones.forEach(reun => {
        eventos.push({
            fecha: new Date(reun['Fecha y Hora'] || reun['Fecha'] || reun.fecha || ''),
            tipo: 'reunion',
            titulo: 'Reunión con Padres',
            descripcion: reun['Motivo'] || reun.motivo || '',
            asistio: leerAsistio(reun) ? 'Sí' : 'No',
            acuerdos: reun['Acuerdos Establecidos'] || reun['Acuerdos'] || reun.acuerdos || ''
        });
    });
    
    // Ordenar por fecha (más reciente primero)
    eventos.sort((a, b) => b.fecha - a.fecha);
    
    // Generar HTML de línea de tiempo
    let htmlTimeline = '';
    if (eventos.length === 0) {
        htmlTimeline = '<p style="color:#999;text-align:center;padding:40px;">No hay eventos registrados</p>';
    } else {
        eventos.slice(0, 15).forEach(evento => {
            const fechaTexto = (evento.fecha && !isNaN(evento.fecha)) ? evento.fecha.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin fecha';
            const horaTexto = evento.fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
            
            let iconoTipo = '';
            let colorBorde = '';
            let labelTipo = '';
            let detalles = '';
            
            if (evento.tipo === 'incidencia') {
                iconoTipo = '📋';
                colorBorde = evento.gravedad === 'Grave' || evento.gravedad === 'Muy Grave' ? '#dc2626' : '#f59e0b';
                labelTipo = `<span style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:4px;font-size:0.85em;font-weight:600;">📋 Incidencia</span>`;
                detalles = `
                    <strong>${evento.titulo}</strong><br>
                    ${evento.descripcion}<br>
                    <span style="color:#666;font-size:0.9em;">Tipo de Falta: ${evento.gravedad} | Docente: ${evento.docente}</span>
                `;
            } else if (evento.tipo === 'tardanza') {
                iconoTipo = '⏰';
                colorBorde = '#f59e0b';
                labelTipo = `<span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:4px;font-size:0.85em;font-weight:600;">⏰ Tardanza</span>`;
                detalles = `<strong>${evento.titulo}</strong><br>${evento.descripcion}${evento.motivo ? '<br><span style="color:#666;font-size:0.9em;">Motivo: ' + evento.motivo + '</span>' : ''}`;
            } else {
                iconoTipo = '🤝';
                colorBorde = '#3b82f6';
                labelTipo = `<span style="background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:4px;font-size:0.85em;font-weight:600;">🤝 Reunión</span>`;
                detalles = `
                    <strong>${evento.titulo}</strong><br>
                    ${evento.descripcion}<br>
                    <span style="color:#666;font-size:0.9em;">Asistió: ${evento.asistio === 'Sí' ? '✅ Sí' : '❌ No'}</span>
                    ${evento.acuerdos ? '<br><span style="color:#666;font-size:0.9em;">Acuerdos: ' + evento.acuerdos + '</span>' : ''}
                `;
            }
            
            htmlTimeline += `
                <div style="position:relative;margin-bottom:25px;background:#f8f9fa;padding:15px;border-radius:8px;border-left:4px solid ${colorBorde};">
                    <div style="color:#666;font-size:0.85em;margin-bottom:8px;">${fechaTexto} - ${horaTexto}</div>
                    ${labelTipo}
                    <div style="margin-top:10px;color:#333;line-height:1.6;">${detalles}</div>
                </div>
            `;
        });
        
        if (eventos.length > 15) {
            htmlTimeline += `<p style="text-align:center;color:#666;font-style:italic;">Mostrando los 15 eventos más recientes de ${eventos.length} totales</p>`;
        }
    }
    
    // Construir sección de citaciones a padres
    let htmlCitaciones = '';
    if (!citacionesEst || citacionesEst.length === 0) {
        htmlCitaciones = '<p style="color:#999;font-style:italic;">Sin citaciones registradas</p>';
    } else {
        htmlCitaciones = citacionesEst.map(c => {
            const fecha = formatearFechaCorta(c['Fecha de la cita'] || c['Fecha de citación'] || '');
            const motivo = c['Motivo'] || '';
            const asist = c['Asistencia'] || 'Pendiente';
            const cumpl = c['Cumplimiento'] || 'Sin revisar';
            const acuerdos = c['Acuerdos'] || '';
            const excusa = c['Excusa'] || '';
            const cAsist = (typeof colorAsistencia === 'function') ? colorAsistencia(asist) : '#f59e0b';
            const cCumpl = (typeof colorCumplimiento === 'function') ? colorCumplimiento(cumpl) : '#6b7280';
            return `
                <div style="background:#f8f9fa;border-left:4px solid ${cAsist};border-radius:8px;padding:12px 15px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                        <strong style="color:#333;">${motivo}</strong>
                        <span style="color:#666;font-size:0.9em;">${fecha ? '🗓️ ' + fecha : ''}</span>
                    </div>
                    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                        <span style="background:${cAsist};color:white;padding:2px 10px;border-radius:12px;font-size:0.8em;">${asist}</span>
                        <span style="background:${cCumpl};color:white;padding:2px 10px;border-radius:12px;font-size:0.8em;">${cumpl}</span>
                    </div>
                    ${excusa ? `<div style="margin-top:4px;color:#666;font-size:0.9em;"><strong>Excusa:</strong> ${excusa}</div>` : ''}
                </div>`;
        }).join('');
    }
    
    // Crear modal
    const modalHTML = `
<div id="modalHistorialEstudiante" class="modal" style="display:block;">
    <div class="modal-content" style="max-width:1000px;max-height:90vh;display:flex;flex-direction:column;">
        <div class="modal-header" style="background:linear-gradient(135deg, #000000 0%, #1a1a1a 100%);color:white;flex-shrink:0;">
            <h2>👤 ${nombre}</h2>
            <span class="close" onclick="cerrarHistorialEstudiante()">&times;</span>
        </div>
        <div style="background:linear-gradient(135deg, #000000 0%, #1a1a1a 100%);color:white;padding:0 25px 25px 25px;flex-shrink:0;">
            <p style="font-size:1.1em;opacity:0.9;">${curso}</p>
            <div id="condicionalHistorialArea">${htmlCondicionalEncabezadoInner(nombre, curso)}</div>
        </div>
        <div class="modal-body" style="overflow-y:auto;flex:1;max-height:calc(90vh - 180px);">
            
            <!-- RESUMEN GENERAL -->
            <h3 style="color:#333;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #e0e0e0;display:flex;align-items:center;gap:10px;">
                📊 Resumen General
            </h3>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:15px;margin-bottom:30px;">
                <div class="resumen-card" style="background:#fef2f2;border-left:4px solid #dc2626;padding:20px;border-radius:8px;">
                    <div style="font-size:2em;font-weight:bold;color:#333;">${incidencias.length}</div>
                    <div style="color:#666;font-size:0.9em;margin-top:5px;">Incidencias Totales</div>
                </div>
                <div class="resumen-card" style="background:#fffbeb;border-left:4px solid #f59e0b;padding:20px;border-radius:8px;">
                    <div style="font-size:2em;font-weight:bold;color:#333;">${tardanzasTotales}</div>
                    <div style="color:#666;font-size:0.9em;margin-top:5px;">Tardanzas Totales</div>
                </div>
                <div class="resumen-card" style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;border-radius:8px;">
                    <div style="font-size:2em;font-weight:bold;color:#333;">${reuniones.length}</div>
                    <div style="color:#666;font-size:0.9em;margin-top:5px;">Reuniones con Padres</div>
                </div>
                <div class="resumen-card" style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px;border-radius:8px;">
                    <div style="font-size:2em;font-weight:bold;color:#333;">${incidenciasLeves}</div>
                    <div style="color:#666;font-size:0.9em;margin-top:5px;">Faltas Leves</div>
                </div>
                <div class="resumen-card" style="background:#fff7ed;border-left:4px solid #f97316;padding:20px;border-radius:8px;">
                    <div style="font-size:2em;font-weight:bold;color:#333;">${incidenciasGraves}</div>
                    <div style="color:#666;font-size:0.9em;margin-top:5px;">Faltas Graves</div>
                </div>
                <div class="resumen-card" style="background:#fef2f2;border-left:4px solid #dc2626;padding:20px;border-radius:8px;">
                    <div style="font-size:2em;font-weight:bold;color:#333;">${incidenciasMuyGraves}</div>
                    <div style="color:#666;font-size:0.9em;margin-top:5px;">Faltas Muy Graves</div>
                </div>
            </div>
            
            <!-- ESTADO DEL ESTUDIANTE -->
            <div class="resumen-card" style="background:${estadoColor === '#dc2626' ? '#fef2f2' : estadoColor === '#f59e0b' ? '#fffbeb' : '#f0fdf4'};border-left:4px solid ${estadoColor};padding:20px;border-radius:8px;margin-bottom:30px;text-align:center;">
                <div style="font-size:2.5em;font-weight:bold;color:#333;">${estadoIcono}</div>
                <div style="color:#666;font-size:1.1em;margin-top:5px;font-weight:600;">${estadoTexto}</div>
            </div>
            
            <!-- CONTACTOS -->
            <h3 style="color:#333;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #e0e0e0;display:flex;align-items:center;gap:10px;">
                📞 Información de Contacto
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:15px;margin-bottom:30px;">
                ${htmlContactos}
            </div>
            
            <!-- CITACIONES A PADRES -->
            <h3 style="color:#333;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #e0e0e0;display:flex;align-items:center;gap:10px;">
                📨 Citaciones a Padres
            </h3>
            <div style="margin-bottom:30px;">
                ${htmlCitaciones}
            </div>
            
            <!-- LÍNEA DE TIEMPO -->
            <h3 style="color:#333;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #e0e0e0;display:flex;align-items:center;gap:10px;">
                📅 Línea de Tiempo (Últimos eventos)
            </h3>
            <div style="position:relative;padding-left:40px;">
                <div style="position:absolute;left:15px;top:0;bottom:0;width:2px;background:#e0e0e0;"></div>
                ${htmlTimeline}
            </div>
            
            <!-- COMPARATIVA POR AÑO ESCOLAR -->
            <h3 style="color:#333;margin-top:30px;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #e0e0e0;display:flex;align-items:center;gap:10px;">
                📈 Comparativa por Año Escolar
            </h3>
            <div id="comparativaAnualContent" style="margin-bottom:10px;">
                <p style="text-align:center;color:#9ca3af;padding:24px;">⏳ Cargando comparativa por año...</p>
            </div>
            
            <!-- BOTÓN EXPORTAR -->
            <div style="margin-top:30px;text-align:center;">
                <button class="btn btn-success" onclick="exportarHistorialPDF('${nombre.replace(/'/g, "\\'")}')">📄 Exportar Historial Completo a PDF</button>
            </div>
            
        </div>
    </div>
</div>`;
    
    // Anexar sin re-serializar el contenedor (innerHTML += destruiría los event listeners
    // del autocompletado de la sección Reportes y Estadísticas que también vive aquí).
    document.getElementById('modalContainer').insertAdjacentHTML('beforeend', modalHTML);

    // Comparativa de comportamiento por año escolar (carga asíncrona al final del historial)
    renderComparativaAnual(nombre);
}

// ===== exportarHistorialPDF =====
async function exportarHistorialPDF(nombreEstudiante) {
  try {
    // Buscar información del estudiante
    const estudiante = datosEstudiantes.find(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        return normalizarNombreCmp(nombre) === normalizarNombreCmp(nombreEstudiante);
    });
    
    if (!estudiante) {
        alert('Estudiante no encontrado');
        return;
    }
    
    const nombre = estudiante['Nombre Completo'] || estudiante.nombre || '';
    const curso = estudiante['Curso'] || estudiante.curso || '';
    
    // Recopilar toda la información
    const incidencias = datosIncidencias.filter(i => {
        const nom = i['Nombre Estudiante'] || i.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    const tardanzas = datosTardanzas.filter(t => {
        const nom = t['Nombre Estudiante'] || t.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    const reuniones = datosReuniones.filter(r => {
        if (!esAnioActivo(r)) return false;  // solo reuniones del año activo
        const nom = r['Nombre Estudiante'] || r.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });
    
    const contacto = datosContactos.find(c => {
        const nom = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '';
        return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
    });

    // Citaciones a padres del estudiante (año activo)
    const citacionesEst = (typeof datosCitaciones !== 'undefined' && Array.isArray(datosCitaciones))
        ? datosCitaciones.filter(c => {
            if (!esAnioActivo(c)) return false;
            const nom = c['Estudiante'] || c['Nombre Estudiante'] || c.estudiante || '';
            return normalizarNombreCmp(nom) === normalizarNombreCmp(nombreEstudiante);
        })
        : [];

    // Contar incidencias por tipo
    const incidenciasLeves = incidencias.filter(i => {
        const tipo = i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '';
        return tipo === 'Leve';
    }).length;

    const incidenciasGraves = incidencias.filter(i => {
        const tipo = i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '';
        return tipo === 'Grave';
    }).length;
    
    const incidenciasMuyGraves = incidencias.filter(i => {
        const tipo = i['Tipo'] || i['Tipo de falta'] || i['Tipo de Falta'] || i.tipoFalta || i.tipo || '';
        return tipo === 'Muy Grave';
    }).length;
    
    // Total de tardanzas (todas)
    const tardanzasTotales = tardanzas.length;
    
    // Inicializar PDF
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('No se pudo generar el PDF: la librería de PDF no cargó. Verifica tu conexión y recarga la página (Ctrl+Shift+R).');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Agregar encabezado institucional
    const startY = agregarEncabezadoCENSA(doc, `Historial Completo del Estudiante`);
    
    let yPos = startY + 5;
    
    // Información del estudiante
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // Verde institucional
    doc.text(nombre, 14, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Curso: ${curso}`, 14, yPos);
    yPos += 8;
    
    // SECCIÓN: RESUMEN ESTADÍSTICO
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // Azul oscuro
    doc.text('RESUMEN ESTADÍSTICO', 14, yPos);
    yPos += 6;
    
    // Configuración de tarjetas (3 columnas x 2 filas)
    const anchoTarjeta = 62;
    const altoTarjeta = 18;
    const espacioEntreTarjetas = 3;
    const inicioPrimeraFila = yPos;
    const inicioSegundaFila = yPos + altoTarjeta + 4;
    
    // PRIMERA FILA
    // Tarjeta 1: Incidencias Totales
    doc.setFillColor(220, 53, 69); // Rojo
    doc.rect(14, inicioPrimeraFila, anchoTarjeta, altoTarjeta, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Incidencias Totales', 14 + anchoTarjeta/2, inicioPrimeraFila + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(incidencias.length), 14 + anchoTarjeta/2, inicioPrimeraFila + 13, { align: 'center' });
    
    // Tarjeta 2: Tardanzas Totales
    doc.setFillColor(245, 158, 11); // Naranja
    doc.rect(14 + anchoTarjeta + espacioEntreTarjetas, inicioPrimeraFila, anchoTarjeta, altoTarjeta, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Tardanzas Totales', 14 + anchoTarjeta + espacioEntreTarjetas + anchoTarjeta/2, inicioPrimeraFila + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(tardanzasTotales), 14 + anchoTarjeta + espacioEntreTarjetas + anchoTarjeta/2, inicioPrimeraFila + 13, { align: 'center' });
    
    // Tarjeta 3: Reuniones con Padres
    doc.setFillColor(59, 130, 246); // Azul
    doc.rect(14 + (anchoTarjeta + espacioEntreTarjetas) * 2, inicioPrimeraFila, anchoTarjeta, altoTarjeta, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Reuniones con Padres', 14 + (anchoTarjeta + espacioEntreTarjetas) * 2 + anchoTarjeta/2, inicioPrimeraFila + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(reuniones.length), 14 + (anchoTarjeta + espacioEntreTarjetas) * 2 + anchoTarjeta/2, inicioPrimeraFila + 13, { align: 'center' });
    
    // SEGUNDA FILA
    // Tarjeta 4: Faltas Leves
    doc.setFillColor(34, 197, 94); // Verde
    doc.rect(14, inicioSegundaFila, anchoTarjeta, altoTarjeta, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Faltas Leves', 14 + anchoTarjeta/2, inicioSegundaFila + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(incidenciasLeves), 14 + anchoTarjeta/2, inicioSegundaFila + 13, { align: 'center' });
    
    // Tarjeta 5: Faltas Graves
    doc.setFillColor(249, 115, 22); // Naranja oscuro
    doc.rect(14 + anchoTarjeta + espacioEntreTarjetas, inicioSegundaFila, anchoTarjeta, altoTarjeta, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Faltas Graves', 14 + anchoTarjeta + espacioEntreTarjetas + anchoTarjeta/2, inicioSegundaFila + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(incidenciasGraves), 14 + anchoTarjeta + espacioEntreTarjetas + anchoTarjeta/2, inicioSegundaFila + 13, { align: 'center' });
    
    // Tarjeta 6: Faltas Muy Graves
    doc.setFillColor(220, 38, 38); // Rojo oscuro
    doc.rect(14 + (anchoTarjeta + espacioEntreTarjetas) * 2, inicioSegundaFila, anchoTarjeta, altoTarjeta, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Faltas Muy Graves', 14 + (anchoTarjeta + espacioEntreTarjetas) * 2 + anchoTarjeta/2, inicioSegundaFila + 5, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(incidenciasMuyGraves), 14 + (anchoTarjeta + espacioEntreTarjetas) * 2 + anchoTarjeta/2, inicioSegundaFila + 13, { align: 'center' });
    
    yPos = inicioSegundaFila + altoTarjeta + 10;
    doc.setTextColor(0, 0, 0);
    
    // SECCIÓN: INFORMACIÓN DE CONTACTO
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('INFORMACIÓN DE CONTACTO', 14, yPos);
    yPos += 6;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (contacto) {
        const nombrePadre = String(contacto['Nombre Padre'] || contacto.nombrePadre || 'No registrado');
        const telPadre = String(contacto['Contacto Padre'] || contacto.telPadre || 'Sin teléfono');
        const nombreMadre = String(contacto['Nombre Madre'] || contacto.nombreMadre || 'No registrado');
        const telMadre = String(contacto['Contacto Madre'] || contacto.telMadre || 'Sin teléfono');
        const telEmergencia = String(contacto['Contacto Emergencia'] || contacto.telEmergencia || 'No registrado');
        
        doc.setFont('helvetica', 'bold');
        doc.text('Padre:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${nombrePadre} - Tel: ${telPadre}`, 28, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Madre:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${nombreMadre} - Tel: ${telMadre}`, 28, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Emergencia:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(telEmergencia, 38, yPos);
        yPos += 8;
    } else {
        doc.setTextColor(245, 158, 11);
        doc.text('Sin contactos registrados', 14, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);
    }
    
    // SECCIÓN: LÍNEA DE TIEMPO
    // Combinar todos los eventos
    let eventos = [];
    
    incidencias.forEach(inc => {
        eventos.push({
            fecha: new Date(inc['Fecha y Hora'] || inc['Fecha'] || inc.fecha || ''),
            tipo: 'incidencia',
            titulo: inc['Tipo de Conducta'] || inc.tipoConducta || 'Incidencia',
            descripcion: inc['Descripción'] || inc.descripcion || '',
            gravedad: inc['Tipo'] || inc['Tipo de falta'] || inc['Tipo de Falta'] || inc.tipoFalta || inc.tipo || 'Sin clasificar',
            docente: inc['Docente'] || inc['Docente que Reporta'] || inc.docenteReporta || inc.docente || 'No especificado'
        });
    });
    
    tardanzas.forEach(tard => {
        eventos.push({
            fecha: new Date(tard['Fecha'] || tard.fecha || ''),
            tipo: 'tardanza',
            titulo: 'Tardanza',
            descripcion: 'Llegada tardía',
            motivo: tard['Motivo'] || tard.motivo || ''
        });
    });
    
    reuniones.forEach(reun => {
        eventos.push({
            fecha: new Date(reun['Fecha y Hora'] || reun['Fecha'] || reun.fecha || ''),
            tipo: 'reunion',
            titulo: 'Reunión con Padres',
            descripcion: reun['Motivo'] || reun.motivo || '',
            asistio: leerAsistio(reun) ? 'Sí' : 'No',
            acuerdos: reun['Acuerdos Establecidos'] || reun['Acuerdos'] || reun.acuerdos || ''
        });
    });
    
    citacionesEst.forEach(cit => {
        eventos.push({
            fecha: new Date(cit['Fecha de la cita'] || cit['Fecha de citación'] || ''),
            tipo: 'citacion',
            titulo: 'Citación a Padres',
            descripcion: cit['Motivo'] || '',
            asistio: cit['Asistencia'] || 'Pendiente',
            acuerdos: cit['Acuerdos'] || '',
            cumplimiento: cit['Cumplimiento'] || 'Sin revisar',
            excusa: cit['Excusa'] || ''
        });
    });
    
    // Agrupar por categoría (Citaciones, Reuniones, Tardanzas, Incidencias),
    // cada grupo ordenado por fecha (más reciente primero).
    const _ordenGrupos = [
        { tipo: 'citacion',   label: 'CITACIONES A PADRES' },
        { tipo: 'reunion',    label: 'REUNIONES CON PADRES' },
        { tipo: 'tardanza',   label: 'TARDANZAS' },
        { tipo: 'incidencia', label: 'INCIDENCIAS' }
    ];
    const eventosAgrupados = [];
    _ordenGrupos.forEach(g => {
        const delGrupo = eventos.filter(e => e.tipo === g.tipo).sort((a, b) => b.fecha - a.fecha);
        if (delGrupo.length) {
            eventosAgrupados.push({ __header: g.label });
            delGrupo.forEach(e => eventosAgrupados.push(e));
        }
    });

    if (yPos > 230) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('HISTORIAL POR CATEGORÍAS', 14, yPos);
    yPos += 6;

    doc.setTextColor(0, 0, 0);

    if (eventos.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('No hay eventos registrados', 14, yPos);
    } else {
        eventosAgrupados.forEach((evento, index) => {
            // Encabezado de grupo/categoría
            if (evento.__header) {
                if (yPos > 250) { doc.addPage(); yPos = 20; }
                yPos += 3;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 58, 138);
                doc.text(evento.__header, 14, yPos);
                doc.setDrawColor(30, 58, 138);
                doc.setLineWidth(0.4);
                doc.line(14, yPos + 1.5, 196, yPos + 1.5);
                yPos += 7;
                doc.setTextColor(0, 0, 0);
                return;
            }
            // Verificar espacio en página
            if (yPos > 260) {
                doc.addPage();
                yPos = 20;
            }
            
            const fechaTexto = (evento.fecha && !isNaN(evento.fecha)) ? evento.fecha.toLocaleDateString('es-DO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Sin fecha';
            
            // Icono y color según tipo
            let icono = '';
            let colorFondo = [0, 0, 0];
            
            if (evento.tipo === 'incidencia') {
                icono = 'INCIDENCIA';
                if (evento.gravedad === 'Muy Grave') {
                    colorFondo = [220, 38, 38]; // Rojo
                } else if (evento.gravedad === 'Grave') {
                    colorFondo = [249, 115, 22]; // Naranja
                } else {
                    colorFondo = [34, 197, 94]; // Verde (Leve)
                }
            } else if (evento.tipo === 'tardanza') {
                icono = 'TARDANZA';
                colorFondo = [245, 158, 11]; // Naranja
            } else if (evento.tipo === 'citacion') {
                icono = 'CITACIÓN';
                colorFondo = [124, 58, 237]; // Morado
            } else {
                icono = 'REUNIÓN';
                colorFondo = [59, 130, 246]; // Azul
            }
            
            // Fondo de la etiqueta
            doc.setFillColor(colorFondo[0], colorFondo[1], colorFondo[2]);
            doc.rect(14, yPos - 3, 30, 5, 'F');
            
            // Texto de la etiqueta
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(icono, 29, yPos, { align: 'center' });
            
            // Fecha
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(fechaTexto, 46, yPos);
            yPos += 5;
            
            // Título del evento
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            const tituloLineas = doc.splitTextToSize(evento.titulo, 180);
            doc.text(tituloLineas, 14, yPos);
            yPos += tituloLineas.length * 4;
            
            // Descripción
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const descripcionLineas = doc.splitTextToSize(evento.descripcion, 180);
            doc.text(descripcionLineas, 14, yPos);
            yPos += descripcionLineas.length * 4;
            
            // Detalles adicionales según tipo
            if (evento.tipo === 'incidencia') {
                doc.setTextColor(100, 100, 100);
                doc.text(`Tipo de Falta: ${evento.gravedad} | Docente: ${evento.docente}`, 14, yPos);
                yPos += 4;
            } else if (evento.tipo === 'tardanza' && evento.motivo) {
                doc.setTextColor(100, 100, 100);
                doc.text(`Motivo: ${evento.motivo}`, 14, yPos);
                yPos += 4;
            } else if (evento.tipo === 'reunion') {
                doc.setTextColor(100, 100, 100);
                doc.text(`Asistió: ${evento.asistio === 'Sí' ? 'Sí' : 'No'}`, 14, yPos);
                yPos += 4;
                if (evento.acuerdos) {
                    const acuerdosLineas = doc.splitTextToSize(`Acuerdos: ${evento.acuerdos}`, 180);
                    doc.text(acuerdosLineas, 14, yPos);
                    yPos += acuerdosLineas.length * 4;
                }
            } else if (evento.tipo === 'citacion') {
                doc.setTextColor(100, 100, 100);
                doc.text(`Asistencia: ${evento.asistio} | Cumplimiento: ${evento.cumplimiento || 'Sin revisar'}`, 14, yPos);
                yPos += 4;
                if (evento.excusa) {
                    const excusaLineas = doc.splitTextToSize(`Excusa: ${evento.excusa}`, 180);
                    doc.text(excusaLineas, 14, yPos);
                    yPos += excusaLineas.length * 4;
                }
            }
            
            // Línea separadora
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(14, yPos + 1, 196, yPos + 1);
            yPos += 6;
            
            doc.setTextColor(0, 0, 0);
        });
    }
    
    // SECCIÓN: COMPARATIVA POR AÑO ESCOLAR (gráfico de evolución por año)
    // Best-effort con límite de tiempo: si la descarga por año se demora,
    // se omite la comparativa y el PDF se genera igual (no se bloquea la descarga).
    try {
        const limiteTiempo = new Promise((resolve) => setTimeout(() => resolve('__timeout__'), 6000));
        const datosComparativa = await Promise.race([obtenerComparativaAnual(nombreEstudiante), limiteTiempo]);
        if (datosComparativa !== '__timeout__') {
            yPos = dibujarComparativaAnualPDF(doc, datosComparativa, yPos + 4);
        } else {
            console.warn('Comparativa anual omitida (tardó demasiado); el PDF se genera sin ella.');
        }
    } catch (e) {
        console.error('No se pudo incluir la comparativa anual en el PDF:', e);
    }
    
    // Pie de página con fecha de generación
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(
            `Generado el ${new Date().toLocaleDateString('es-DO')} - Página ${i} de ${totalPaginas}`,
            105,
            285,
            { align: 'center' }
        );
    }
    
    // Guardar PDF
    const nombreArchivo = nombre.replace(/ /g, '_');
    doc.save(`Historial_Completo_${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('Error al generar el PDF del historial:', err);
    alert('No se pudo generar el PDF del historial.\n\nDetalle del error: ' + (err && err.message ? err.message : err));
  }
}

// ===== abrirWhatsApp =====
function abrirWhatsApp(numero, mensaje) {
    // Limpiar el número (quitar espacios, guiones, paréntesis)
    const numeroLimpio = numero.replace(/[\s\-\(\)]/g, '');
    
    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Crear URL de WhatsApp
    // Si el número no tiene código de país, agregar +1 (República Dominicana usa +1)
    const numeroCompleto = numeroLimpio.startsWith('+') ? numeroLimpio : `+1${numeroLimpio}`;
    
    const urlWhatsApp = `https://wa.me/${numeroCompleto.replace('+', '')}?text=${mensajeCodificado}`;
    
    // Abrir WhatsApp en nueva pestaña
    window.open(urlWhatsApp, '_blank');
    
    console.log('✅ WhatsApp abierto para:', numeroCompleto);
}