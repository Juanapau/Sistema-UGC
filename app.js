// ========================================
// SISTEMA DE GESTIÓN DE CONVIVENCIA CENSA
// ========================================

// Configuración global
let CONFIG = {
    urlIncidencias: '',
    urlTardanzas: '',
    urlContactos: '',
    urlEstudiantes: ''
};

// Almacenamiento de datos local
let datosIncidencias = [];
let datosTardanzas = [];
let datosContactos = [];
let datosEstudiantes = [];

// Cursos disponibles
const CURSOS = ['1roA','1roB','1roC','2doA','2doB','2doC','3roA','3roB','3roC',
                '4toA','4toB','4toC','5toA','5toB','5toC','6toA','6toB','6toC'];

// ==================
// FUNCIONES PARA CARGAR DATOS DESDE GOOGLE SHEETS
// ==================
async function cargarDatosDesdeGoogleSheets(url) {
    if (!url) return [];
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Datos cargados desde Google Sheets:', data);
            return data;
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
    return [];
}

// ==================
// INICIALIZACIÓN
// ==================
window.onload = function() {
    const configGuardada = localStorage.getItem('censaConfig');
    if (configGuardada) {
        CONFIG = JSON.parse(configGuardada);
    }
    cargarDatosEjemplo();
};

// ==================
// NAVEGACIÓN
// ==================
function openModule(moduleName) {
    const modals = {
        'incidencias': crearModalIncidencias,
        'tardanzas': crearModalTardanzas,
        'contactos': crearModalContactos,
        'estudiantes': crearModalEstudiantes,
        'configuracion': crearModalConfiguracion,
        'reportes': crearModalReportes
    };
    
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';
    modals[moduleName]();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// ==================
// MODAL INCIDENCIAS
// ==================
function crearModalIncidencias() {
    const html = `
<div id="modalIncidencias" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>📋 Registro de Incidencias</h2>
            <span class="close" onclick="closeModal('modalIncidencias')">&times;</span>
        </div>
        <div class="modal-body">
            <div class="alert alert-success" id="alertIncidencias" style="display:none;"></div>
            
            <h3>Nueva Incidencia</h3>
            <form id="formIncidencia" onsubmit="registrarIncidencia(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha y Hora *</label>
                        <input type="datetime-local" id="fechaIncidencia" required>
                    </div>
                    <div class="form-group">
                        <label>Estudiante *</label>
                        <input type="text" id="nombreEstudianteInc" required list="listaEst1">
                        <datalist id="listaEst1">${datosEstudiantes.map(e => `<option value="${e.nombre}">`).join('')}</datalist>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Curso *</label>
                        <select id="cursoIncidencia" required>
                            <option value="">Seleccione</option>
                            ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Falta *</label>
                        <select id="tipoFalta" required>
                            <option value="">Seleccione</option>
                            <option value="Leve">Falta Leve</option>
                            <option value="Grave">Falta Grave</option>
                            <option value="Muy Grave">Falta Muy Grave</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Docente que Reporta *</label>
                    <input type="text" id="docenteReporta" required>
                </div>
                <div class="form-group">
                    <label>Descripción *</label>
                    <textarea id="descripcionIncidencia" required></textarea>
                </div>
                <div class="form-group">
                    <label>Acciones del Docente *</label>
                    <textarea id="accionesDocente" required></textarea>
                </div>
                <div class="form-group">
                    <label>Seguimiento UGC</label>
                    <textarea id="seguimientoUGC"></textarea>
                </div>
                <div class="form-group">
                    <label>Otras Observaciones</label>
                    <textarea id="otrasObservaciones"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">💾 Registrar</button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('formIncidencia').reset()">🔄 Limpiar</button>
            </form>
            
            <hr style="margin: 40px 0;">
            <h3>Consultar Incidencias</h3>
            <div class="search-bar">
                <input type="text" id="buscarInc" placeholder="🔍 Buscar estudiante...">
                <select id="filtrarCursoInc">
                    <option value="">Todos los cursos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="filtrarTipo">
                    <option value="">Todos los tipos</option>
                    <option value="Leve">Leve</option>
                    <option value="Grave">Grave</option>
                    <option value="Muy Grave">Muy Grave</option>
                </select>
                <button class="btn btn-primary" onclick="buscarIncidencias()">🔍 Buscar</button>
                <button class="btn btn-success" onclick="exportarIncidencias()">📥 Exportar</button>
            </div>
            <div class="table-container">
                <table id="tablaIncidencias">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Estudiante</th>
                            <th>Curso</th>
                            <th>Tipo</th>
                            <th>Docente</th>
                            <th>Descripción</th>
                            <th>Seguimiento UGC</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody id="bodyIncidencias"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
    document.getElementById('fechaIncidencia').value = new Date().toISOString().slice(0,16);
    
    // Actualizar datalist con estudiantes
    actualizarDatalistsEstudiantes();
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlIncidencias) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlIncidencias).then(datos => {
            if (datos && datos.length > 0) {
                datosIncidencias = datos;
                cargarTablaIncidencias();
            } else {
                cargarTablaIncidencias();
            }
        });
    } else {
        cargarTablaIncidencias();
    }
}

function registrarIncidencia(e) {
    e.preventDefault();
    const inc = {
        'Fecha y Hora': document.getElementById('fechaIncidencia').value,
        'Nombre Estudiante': document.getElementById('nombreEstudianteInc').value,
        'Curso': document.getElementById('cursoIncidencia').value,
        'Tipo de falta': document.getElementById('tipoFalta').value,
        'Docente': document.getElementById('docenteReporta').value,
        'Descripción': document.getElementById('descripcionIncidencia').value,
        'Acciones Docente': document.getElementById('accionesDocente').value,
        'Seguimiento UGC': document.getElementById('seguimientoUGC').value,
        'Observaciones': document.getElementById('otrasObservaciones').value
    };
    
    datosIncidencias.push(inc);
    if (CONFIG.urlIncidencias) enviarGoogleSheets(CONFIG.urlIncidencias, inc);
    mostrarAlerta('alertIncidencias', '✅ Incidencia registrada');
    document.getElementById('formIncidencia').reset();
    cargarTablaIncidencias();
}

function cargarTablaIncidencias() {
    const tbody = document.getElementById('bodyIncidencias');
    if (datosIncidencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No hay incidencias</td></tr>';
        return;
    }
    tbody.innerHTML = datosIncidencias.map((inc, i) => {
        const fecha = inc['Fecha y Hora'] || inc.fecha || '';
        const estudiante = inc['Nombre Estudiante'] || inc.estudiante || '';
        const curso = inc['Curso'] || inc.curso || '';
        const tipo = inc['Tipo de falta'] || inc.tipoFalta || '';
        const docente = inc['Docente'] || inc.docente || '';
        const descripcion = inc['Descripción'] || inc.descripcion || '';
        const seguimiento = inc['Seguimiento UGC'] || inc.seguimiento || '';
        const observaciones = inc['Observaciones'] || inc.observaciones || '';
        
        return `
        <tr>
            <td>${fecha ? new Date(fecha).toLocaleDateString('es-DO') : ''}</td>
            <td><strong>${estudiante}</strong></td>
            <td>${curso}</td>
            <td><span class="status-badge badge-${tipo.toLowerCase().replace(' ', '-')}">${tipo}</span></td>
            <td>${docente}</td>
            <td>${descripcion.substring(0,80)}${descripcion.length > 80 ? '...' : ''}</td>
            <td>${seguimiento ? seguimiento.substring(0,60) + '...' : '-'}</td>
            <td>${observaciones ? observaciones.substring(0,60) + '...' : '-'}</td>
        </tr>
    `;
    }).join('');
}

function buscarIncidencias() {
    const buscar = document.getElementById('buscarInc').value.toLowerCase();
    const curso = document.getElementById('filtrarCursoInc').value;
    const tipo = document.getElementById('filtrarTipo').value;
    
    const filtrados = datosIncidencias.filter(inc => {
        const matchNombre = inc.estudiante.toLowerCase().includes(buscar);
        const matchCurso = !curso || inc.curso === curso;
        const matchTipo = !tipo || inc.tipoFalta === tipo;
        return matchNombre && matchCurso && matchTipo;
    });
    
    const tbody = document.getElementById('bodyIncidencias');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    tbody.innerHTML = filtrados.map(inc => `
        <tr>
            <td>${new Date(inc.fecha).toLocaleDateString('es-DO')}</td>
            <td><strong>${inc.estudiante}</strong></td>
            <td>${inc.curso}</td>
            <td><span class="status-badge badge-${inc.tipoFalta.toLowerCase().replace(' ', '-')}">${inc.tipoFalta}</span></td>
            <td>${inc.docente}</td>
            <td>${inc.descripcion.substring(0,80)}...</td>
            <td>${inc.seguimiento ? inc.seguimiento.substring(0,60) + '...' : '-'}</td>
            <td>${inc.observaciones ? inc.observaciones.substring(0,60) + '...' : '-'}</td>
        </tr>
    `).join('');
}

function exportarIncidencias() {
    if (datosIncidencias.length === 0) return alert('No hay datos');
    const ws = XLSX.utils.json_to_sheet(datosIncidencias);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
    XLSX.writeFile(wb, `Incidencias_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ==================
// MODAL TARDANZAS
// ==================
function crearModalTardanzas() {
    const html = `
<div id="modalTardanzas" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>⏰ Registro de Tardanzas</h2>
            <span class="close" onclick="closeModal('modalTardanzas')">&times;</span>
        </div>
        <div class="modal-body">
            <div class="alert alert-success" id="alertTardanzas" style="display:none;"></div>
            
            <h3>Registrar Tardanza</h3>
            <form id="formTardanza" onsubmit="registrarTardanza(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" id="fechaTardanza" required>
                    </div>
                    <div class="form-group">
                        <label>Estudiante *</label>
                        <input type="text" id="estudianteTard" required list="listaEst2">
                        <datalist id="listaEst2">${datosEstudiantes.map(e => `<option value="${e.nombre}">`).join('')}</datalist>
                    </div>
                    <div class="form-group">
                        <label>Curso *</label>
                        <select id="cursoTard" required>
                            <option value="">Seleccione</option>
                            ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">💾 Registrar</button>
            </form>
            
            <div id="contadorTardanzas" style="display:none;margin:20px 0;padding:15px;background:#fff3cd;border-radius:8px;">
                <h4>Resumen</h4>
                <p><strong>Estudiante:</strong> <span id="estNombre"></span></p>
                <p><strong>Tardanzas del mes:</strong> <span id="totalMes"></span></p>
                <p><strong>Acción:</strong> <span id="accionReq"></span></p>
                <button class="btn btn-success" id="btnCircular" style="display:none;" onclick="generarCircular()">📄 Generar Circular</button>
            </div>
            
            <hr style="margin: 40px 0;">
            <h3>Consultar Tardanzas</h3>
            <div class="search-bar">
                <input type="text" id="buscarTard" placeholder="🔍 Buscar...">
                <select id="filtrarCursoTard">
                    <option value="">Todos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="buscarTardanzas()">🔍 Buscar</button>
                <button class="btn btn-success" onclick="exportarTardanzas()">📥 Exportar</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Estudiante</th>
                            <th>Curso</th>
                            <th>Mes</th>
                            <th>Total Mes</th>
                        </tr>
                    </thead>
                    <tbody id="bodyTardanzas"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
    document.getElementById('fechaTardanza').value = new Date().toISOString().split('T')[0];
    
    // Actualizar datalist con estudiantes
    actualizarDatalistsEstudiantes();
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlTardanzas) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlTardanzas).then(datos => {
            if (datos && datos.length > 0) {
                datosTardanzas = datos;
                cargarTablaTardanzas();
            } else {
                cargarTablaTardanzas();
            }
        });
    } else {
        cargarTablaTardanzas();
    }
}

function registrarTardanza(e) {
    e.preventDefault();
    const fecha = document.getElementById('fechaTardanza').value;
    const estudiante = document.getElementById('estudianteTard').value;
    const curso = document.getElementById('cursoTard').value;
    
    const fechaObj = new Date(fecha);
    const mes = fechaObj.toLocaleString('es', {month: 'long'});
    const año = fechaObj.getFullYear();
    
    const tard = {
        'Fecha': fecha,
        'Nombre Estudiante': estudiante,
        'Curso': curso,
        'Mes': mes,
        'Año': año
    };
    
    datosTardanzas.push(tard);
    if (CONFIG.urlTardanzas) enviarGoogleSheets(CONFIG.urlTardanzas, tard);
    
    // Contar tardanzas del mes - usar nombres de campos correctos
    const tardanzasMes = datosTardanzas.filter(t => {
        const estT = t['Nombre Estudiante'] || t.estudiante || '';
        const mesT = t['Mes'] || t.mes || '';
        const añoT = t['Año'] || t.año || '';
        return estT === estudiante && mesT === mes && añoT == año;
    }).length;
    
    document.getElementById('contadorTardanzas').style.display = 'block';
    document.getElementById('estNombre').textContent = estudiante;
    document.getElementById('totalMes').textContent = tardanzasMes;
    
    if (tardanzasMes >= 3) {
        document.getElementById('accionReq').textContent = tardanzasMes === 3 ? 'Citar padres por escrito' : 'Llamar y citar padres';
        document.getElementById('btnCircular').style.display = 'inline-block';
        document.getElementById('btnCircular').dataset.estudiante = estudiante;
        document.getElementById('btnCircular').dataset.curso = curso;
        document.getElementById('btnCircular').dataset.mes = mes;
        document.getElementById('btnCircular').dataset.año = año;
    } else {
        document.getElementById('accionReq').textContent = 'Sin acción requerida';
        document.getElementById('btnCircular').style.display = 'none';
    }
    
    mostrarAlerta('alertTardanzas', '✅ Tardanza registrada');
    document.getElementById('formTardanza').reset();
    cargarTablaTardanzas();
}

function cargarTablaTardanzas() {
    const tbody = document.getElementById('bodyTardanzas');
    if (datosTardanzas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">No hay tardanzas</td></tr>';
        return;
    }
    
    const agrupado = {};
    datosTardanzas.forEach(t => {
        const estudiante = t['Nombre Estudiante'] || t.estudiante || '';
        const mes = t['Mes'] || t.mes || '';
        const año = t['Año'] || t.año || '';
        const curso = t['Curso'] || t.curso || '';
        const fecha = t['Fecha'] || t.fecha || '';
        
        const key = `${estudiante}-${mes}-${año}`;
        if (!agrupado[key]) {
            agrupado[key] = {estudiante, curso, mes, año, fechas: [], total: 0};
        }
        agrupado[key].fechas.push(fecha);
        agrupado[key].total++;
    });
    
    tbody.innerHTML = Object.values(agrupado).map(g => `
        <tr>
            <td>${g.fechas[g.fechas.length-1] ? new Date(g.fechas[g.fechas.length-1]).toLocaleDateString('es-DO') : '-'}</td>
            <td><strong>${g.estudiante}</strong></td>
            <td>${g.curso}</td>
            <td>${g.mes} ${g.año}</td>
            <td><strong>${g.total}</strong></td>
        </tr>
    `).join('');
}

function buscarTardanzas() {
    const buscar = document.getElementById('buscarTard').value.toLowerCase();
    const curso = document.getElementById('filtrarCursoTard').value;
    
    const filtrados = datosTardanzas.filter(t => {
        const matchNombre = t.estudiante.toLowerCase().includes(buscar);
        const matchCurso = !curso || t.curso === curso;
        return matchNombre && matchCurso;
    });
    
    const tbody = document.getElementById('bodyTardanzas');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    
    const agrupado = {};
    filtrados.forEach(t => {
        const key = `${t.estudiante}-${t.mes}-${t.año}`;
        if (!agrupado[key]) {
            agrupado[key] = {estudiante: t.estudiante, curso: t.curso, mes: t.mes, año: t.año, fechas: [], total: 0};
        }
        agrupado[key].fechas.push(t.fecha);
        agrupado[key].total++;
    });
    
    tbody.innerHTML = Object.values(agrupado).map(g => `
        <tr>
            <td>${new Date(g.fechas[g.fechas.length-1]).toLocaleDateString('es-DO')}</td>
            <td><strong>${g.estudiante}</strong></td>
            <td>${g.curso}</td>
            <td>${g.mes} ${g.año}</td>
            <td><strong>${g.total}</strong></td>
        </tr>
    `).join('');
}

function exportarTardanzas() {
    if (datosTardanzas.length === 0) return alert('No hay datos');
    const ws = XLSX.utils.json_to_sheet(datosTardanzas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tardanzas");
    XLSX.writeFile(wb, `Tardanzas_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function generarCircular() {
    const btn = document.getElementById('btnCircular');
    const estudiante = btn.dataset.estudiante;
    const curso = btn.dataset.curso;
    const mes = btn.dataset.mes;
    const año = btn.dataset.año;
    
    const tardanzasMes = datosTardanzas.filter(t => 
        t.estudiante === estudiante && t.mes === mes && t.año == año
    );
    
    const tabla = tardanzasMes.map(t => {
        const fecha = new Date(t.fecha);
        return `<tr><td style="border:1px solid #000;padding:8px;">${fecha.toLocaleDateString('es-DO')}</td></tr>`;
    }).join('');
    
    const circular = `
        <div style="padding:40px;font-family:'Times New Roman',serif;">
            <div style="text-align:center;margin-bottom:30px;">
                <h3>CENTRO EDUCATIVO NUESTRA SEÑORA DE LA ALTAGRACIA</h3>
                <h4>UNIDAD DE GESTIÓN DE LA CONVIVENCIA</h4>
                <p><strong>Comunicación</strong></p>
            </div>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-DO')}</p>
            <p><strong>Estudiante:</strong> ${estudiante}</p>
            <p><strong>Curso:</strong> ${curso}</p>
            <p style="margin-top:20px;">Saludos cordiales estimado Padre/Madre/Tutor!</p>
            <p style="text-align:justify;line-height:1.8;">Le estamos enviando esta comunicación porque su hijo/a ha llegado tarde al centro en ${tardanzasMes.length} ocasiones en el mes de ${mes} y según el reglamento si el estudiante acumula 3 tardanzas en un mes, los padres o tutores serán citados para firmar acuerdos y compromisos.</p>
            <h4>Registro de Tardanzas del Mes:</h4>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <thead><tr style="background:#2a5298;color:white;"><th style="border:1px solid #000;padding:8px;">Fecha</th></tr></thead>
                <tbody>${tabla}</tbody>
            </table>
            <p style="text-align:center;margin-top:40px;font-weight:bold;color:red;">Nota: Favor devolver esta comunicación firmada</p>
        </div>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(circular);
    ventana.document.close();
    ventana.print();
}

// ==================
// MODAL CONTACTOS
// ==================
function crearModalContactos() {
    const html = `
<div id="modalContactos" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>📞 Contactos de Padres</h2>
            <span class="close" onclick="closeModal('modalContactos')">&times;</span>
        </div>
        <div class="modal-body">
            <div class="alert alert-success" id="alertContactos" style="display:none;"></div>
            
            <h3>Importar desde Excel</h3>
            <div class="file-upload-area" onclick="document.getElementById('fileContactos').click()">
                <div style="font-size:3em;">📁</div>
                <p><strong>Click para seleccionar archivo Excel</strong></p>
                <input type="file" id="fileContactos" style="display:none;" accept=".xlsx,.xls" onchange="importarContactos(event)">
            </div>
            
            <hr style="margin:30px 0;">
            <h3>Registrar Contacto Individual</h3>
            <form id="formContacto" onsubmit="registrarContacto(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Estudiante *</label>
                        <input type="text" id="estContacto" required>
                    </div>
                    <div class="form-group">
                        <label>Curso *</label>
                        <select id="cursoContacto" required>
                            <option value="">Seleccione</option>
                            ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre del Padre</label>
                        <input type="text" id="nombrePadre">
                    </div>
                    <div class="form-group">
                        <label>Tel. Padre</label>
                        <input type="tel" id="telPadre">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre de la Madre</label>
                        <input type="text" id="nombreMadre">
                    </div>
                    <div class="form-group">
                        <label>Tel. Madre</label>
                        <input type="tel" id="telMadre">
                    </div>
                </div>
                <div class="form-group">
                    <label>Tel. Emergencia</label>
                    <input type="tel" id="telEmergencia">
                </div>
                <button type="submit" class="btn btn-primary">💾 Registrar</button>
            </form>
            
            <hr style="margin:40px 0;">
            <h3>Buscar Contactos</h3>
            <div class="search-bar">
                <input type="text" id="buscarContacto" placeholder="🔍 Buscar...">
                <button class="btn btn-primary" onclick="buscarContactos()">🔍 Buscar</button>
                <button class="btn btn-success" onclick="exportarContactos()">📥 Exportar</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Estudiante</th>
                            <th>Curso</th>
                            <th>Padre</th>
                            <th>Tel. Padre</th>
                            <th>Madre</th>
                            <th>Tel. Madre</th>
                            <th>Emergencia</th>
                        </tr>
                    </thead>
                    <tbody id="bodyContactos"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlContactos) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlContactos).then(datos => {
            if (datos && datos.length > 0) {
                datosContactos = datos;
                cargarTablaContactos();
            } else {
                cargarTablaContactos();
            }
        });
    } else {
        cargarTablaContactos();
    }
}

function registrarContacto(e) {
    e.preventDefault();
    const contacto = {
        'Nombre Estudiante': document.getElementById('estContacto').value,
        'Curso': document.getElementById('cursoContacto').value,
        'Nombre Padre': document.getElementById('nombrePadre').value,
        'Contacto Padre': document.getElementById('telPadre').value,
        'Nombre Madre': document.getElementById('nombreMadre').value,
        'Contacto Madre': document.getElementById('telMadre').value,
        'Contacto Emergencia': document.getElementById('telEmergencia').value
    };
    datosContactos.push(contacto);
    if (CONFIG.urlContactos) enviarGoogleSheets(CONFIG.urlContactos, contacto);
    mostrarAlerta('alertContactos', '✅ Contacto registrado');
    document.getElementById('formContacto').reset();
    cargarTablaContactos();
}

function importarContactos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        let importados = 0;
        jsonData.forEach(row => {
            const contacto = {
                'Nombre Estudiante': row['Nombre del Estudiante'] || row['Estudiante'] || row['Nombre Estudiante'] || '',
                'Curso': row['Curso'] || '',
                'Nombre Padre': row['Nombre del Padre'] || row['Padre'] || row['Nombre Padre'] || '',
                'Contacto Padre': row['Contacto del Padre'] || row['Tel. Padre'] || row['Contacto Padre'] || '',
                'Nombre Madre': row['Nombre de la Madre'] || row['Madre'] || row['Nombre Madre'] || '',
                'Contacto Madre': row['Contacto de la Madre'] || row['Tel. Madre'] || row['Contacto Madre'] || '',
                'Contacto Emergencia': row['Contacto de Emergencia'] || row['Emergencia'] || row['Contacto Emergencia'] || ''
            };
            if (contacto['Nombre Estudiante'] && contacto['Curso']) {
                datosContactos.push(contacto);
                importados++;
                if (CONFIG.urlContactos) enviarGoogleSheets(CONFIG.urlContactos, contacto);
            }
        });
        
        mostrarAlerta('alertContactos', `✅ ${importados} contactos importados`);
        cargarTablaContactos();
    };
    reader.readAsArrayBuffer(file);
}

function cargarTablaContactos() {
    const tbody = document.getElementById('bodyContactos');
    if (datosContactos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No hay contactos</td></tr>';
        return;
    }
    tbody.innerHTML = datosContactos.map(c => {
        const estudiante = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '-';
        const curso = c['Curso'] || c.curso || '-';
        const nombrePadre = c['Nombre Padre'] || c.nombrePadre || '-';
        const telPadre = c['Contacto Padre'] || c.telPadre || '-';
        const nombreMadre = c['Nombre Madre'] || c.nombreMadre || '-';
        const telMadre = c['Contacto Madre'] || c.telMadre || '-';
        const telEmergencia = c['Contacto Emergencia'] || c.telEmergencia || '-';
        
        return `
        <tr>
            <td><strong>${estudiante}</strong></td>
            <td>${curso}</td>
            <td>${nombrePadre}</td>
            <td>${telPadre}</td>
            <td>${nombreMadre}</td>
            <td>${telMadre}</td>
            <td>${telEmergencia}</td>
        </tr>
    `;
    }).join('');
}

function buscarContactos() {
    const buscar = document.getElementById('buscarContacto').value.toLowerCase();
    const filtrados = datosContactos.filter(c => 
        c.estudiante.toLowerCase().includes(buscar) ||
        c.nombrePadre.toLowerCase().includes(buscar) ||
        c.nombreMadre.toLowerCase().includes(buscar)
    );
    
    const tbody = document.getElementById('bodyContactos');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    tbody.innerHTML = filtrados.map(c => `
        <tr>
            <td><strong>${c.estudiante}</strong></td>
            <td>${c.curso}</td>
            <td>${c.nombrePadre || '-'}</td>
            <td>${c.telPadre || '-'}</td>
            <td>${c.nombreMadre || '-'}</td>
            <td>${c.telMadre || '-'}</td>
            <td>${c.telEmergencia || '-'}</td>
        </tr>
    `).join('');
}

function exportarContactos() {
    if (datosContactos.length === 0) return alert('No hay datos');
    const ws = XLSX.utils.json_to_sheet(datosContactos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contactos");
    XLSX.writeFile(wb, `Contactos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ==================
// MODAL ESTUDIANTES
// ==================
function crearModalEstudiantes() {
    const html = `
<div id="modalEstudiantes" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>👥 Listado de Estudiantes</h2>
            <span class="close" onclick="closeModal('modalEstudiantes')">&times;</span>
        </div>
        <div class="modal-body">
            <div class="alert alert-success" id="alertEstudiantes" style="display:none;"></div>
            
            <h3>Importar desde Excel</h3>
            <div class="file-upload-area" onclick="document.getElementById('fileEstudiantes').click()">
                <div style="font-size:3em;">📁</div>
                <p><strong>Click para seleccionar archivo Excel</strong></p>
                <input type="file" id="fileEstudiantes" style="display:none;" accept=".xlsx,.xls" onchange="importarEstudiantes(event)">
            </div>
            
            <hr style="margin:30px 0;">
            <h3>Agregar Estudiante</h3>
            <form id="formEstudiante" onsubmit="registrarEstudiante(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" id="nombreEst" required>
                    </div>
                    <div class="form-group">
                        <label>Curso *</label>
                        <select id="cursoEst" required>
                            <option value="">Seleccione</option>
                            ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">💾 Agregar</button>
            </form>
            
            <hr style="margin:40px 0;">
            <h3>Buscar Estudiantes</h3>
            <div class="search-bar">
                <input type="text" id="buscarEst" placeholder="🔍 Buscar...">
                <select id="filtrarCursoEst">
                    <option value="">Todos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="buscarEstudiantes()">🔍 Buscar</button>
                <button class="btn btn-success" onclick="exportarEstudiantes()">📥 Exportar</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Curso</th>
                        </tr>
                    </thead>
                    <tbody id="bodyEstudiantes"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlEstudiantes) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes).then(datos => {
            if (datos && datos.length > 0) {
                datosEstudiantes = datos;
                cargarTablaEstudiantes();
            } else {
                cargarTablaEstudiantes();
            }
        });
    } else {
        cargarTablaEstudiantes();
    }
}

function registrarEstudiante(e) {
    e.preventDefault();
    const est = {
        'Nombre Completo': document.getElementById('nombreEst').value,
        'Curso': document.getElementById('cursoEst').value
    };
    datosEstudiantes.push(est);
    if (CONFIG.urlEstudiantes) enviarGoogleSheets(CONFIG.urlEstudiantes, est);
    mostrarAlerta('alertEstudiantes', '✅ Estudiante agregado');
    document.getElementById('formEstudiante').reset();
    cargarTablaEstudiantes();
}

function importarEstudiantes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        let importados = 0;
        const nuevosEstudiantes = [];
        
        jsonData.forEach(row => {
            const est = {
                'Nombre Completo': row['Nombre Completo'] || row['Nombre'] || '',
                'Curso': row['Curso'] || ''
            };
            if (est['Nombre Completo'] && est['Curso']) {
                datosEstudiantes.push(est);
                nuevosEstudiantes.push(est);
                importados++;
            }
        });
        
        // Mostrar mensaje inmediatamente
        mostrarAlerta('alertEstudiantes', `📤 Guardando ${importados} estudiantes en Google Sheets...`);
        cargarTablaEstudiantes();
        actualizarDatalistsEstudiantes(); // Actualizar las listas desplegables
        
        // Enviar a Google Sheets de forma masiva (todos de una vez)
        if (CONFIG.urlEstudiantes && nuevosEstudiantes.length > 0) {
            const exitoso = await enviarGoogleSheetsMasivo(CONFIG.urlEstudiantes, nuevosEstudiantes);
            if (exitoso) {
                mostrarAlerta('alertEstudiantes', `✅ ${importados} estudiantes importados y guardados correctamente`);
            } else {
                mostrarAlerta('alertEstudiantes', `⚠️ ${importados} estudiantes importados (algunos pueden no haberse guardado en Google Sheets)`);
            }
        } else {
            mostrarAlerta('alertEstudiantes', `✅ ${importados} estudiantes importados`);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Función para actualizar todos los datalists de estudiantes
function actualizarDatalistsEstudiantes() {
    // Actualizar datalist en Incidencias
    const listaEst1 = document.getElementById('listaEst1');
    if (listaEst1) {
        listaEst1.innerHTML = datosEstudiantes.map(e => {
            const nombre = e['Nombre Completo'] || e.nombre || '';
            return `<option value="${nombre}">`;
        }).join('');
    }
    
    // Actualizar datalist en Tardanzas
    const listaEst2 = document.getElementById('listaEst2');
    if (listaEst2) {
        listaEst2.innerHTML = datosEstudiantes.map(e => {
            const nombre = e['Nombre Completo'] || e.nombre || '';
            return `<option value="${nombre}">`;
        }).join('');
    }
    
    // Actualizar datalist en Reportes
    const listaEstReporte = document.getElementById('listaEstReporte');
    if (listaEstReporte) {
        listaEstReporte.innerHTML = datosEstudiantes.map(e => {
            const nombre = e['Nombre Completo'] || e.nombre || '';
            return `<option value="${nombre}">`;
        }).join('');
    }
}

// Alias para compatibilidad
const actualizarListasEstudiantes = actualizarDatalistsEstudiantes;

function cargarTablaEstudiantes() {
    const tbody = document.getElementById('bodyEstudiantes');
    if (datosEstudiantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#999;">No hay estudiantes</td></tr>';
        return;
    }
    tbody.innerHTML = datosEstudiantes.map(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '-';
        const curso = e['Curso'] || e.curso || '-';
        
        return `
        <tr>
            <td><strong>${nombre}</strong></td>
            <td>${curso}</td>
        </tr>
    `;
    }).join('');
}

function buscarEstudiantes() {
    const buscar = document.getElementById('buscarEst').value.toLowerCase();
    const curso = document.getElementById('filtrarCursoEst').value;
    
    const filtrados = datosEstudiantes.filter(e => {
        const matchNombre = e.nombre.toLowerCase().includes(buscar);
        const matchCurso = !curso || e.curso === curso;
        return matchNombre && matchCurso;
    });
    
    const tbody = document.getElementById('bodyEstudiantes');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    tbody.innerHTML = filtrados.map(e => `
        <tr>
            <td><strong>${e.nombre}</strong></td>
            <td>${e.curso}</td>
        </tr>
    `).join('');
}

function exportarEstudiantes() {
    if (datosEstudiantes.length === 0) return alert('No hay datos');
    const ws = XLSX.utils.json_to_sheet(datosEstudiantes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(wb, `Estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ==================
// MODAL CONFIGURACIÓN
// ==================
function crearModalConfiguracion() {
    const html = `
<div id="modalConfiguracion" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>⚙️ Configuración</h2>
            <span class="close" onclick="closeModal('modalConfiguracion')">&times;</span>
        </div>
        <div class="modal-body">
            <div class="alert alert-success" id="alertConfig" style="display:none;"></div>
            
            <div class="config-section">
                <h3>🔗 Conexión con Google Sheets</h3>
                <p>Siga estos pasos para conectar el sistema:</p>
                
                <h4>Paso 1: Crear Google Sheets</h4>
                <p>Cree 4 hojas de cálculo en Google Sheets con los siguientes nombres:</p>
                <ul style="line-height:2;">
                    <li>Incidencias</li>
                    <li>Tardanzas</li>
                    <li>Contactos</li>
                    <li>Estudiantes</li>
                </ul>
                
                <h4>Paso 2: Apps Script</h4>
                <p>En cada hoja, vaya a <strong>Extensiones → Apps Script</strong> y pegue el siguiente código:</p>
                <textarea readonly style="width:100%;height:200px;font-family:monospace;padding:10px;background:#f5f5f5;border-radius:8px;">
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var row = [];
  for (var key in data) { row.push(data[key]); }
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var jsonData = [];
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    jsonData.push(row);
  }
  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}</textarea>
                
                <h4>Paso 3: Implementar</h4>
                <p>Click en <strong>Implementar → Nueva implementación</strong>, seleccione <strong>Aplicación web</strong>, configure acceso como <strong>Cualquier persona</strong>, y copie la URL generada.</p>
                
                <h4>Paso 4: Configurar URLs</h4>
                <form id="formConfig" onsubmit="guardarConfig(event)">
                    <div class="form-group">
                        <label>URL Incidencias</label>
                        <input type="url" id="urlInc" value="${CONFIG.urlIncidencias}">
                    </div>
                    <div class="form-group">
                        <label>URL Tardanzas</label>
                        <input type="url" id="urlTard" value="${CONFIG.urlTardanzas}">
                    </div>
                    <div class="form-group">
                        <label>URL Contactos</label>
                        <input type="url" id="urlCont" value="${CONFIG.urlContactos}">
                    </div>
                    <div class="form-group">
                        <label>URL Estudiantes</label>
                        <input type="url" id="urlEst" value="${CONFIG.urlEstudiantes}">
                    </div>
                    <button type="submit" class="btn btn-success">💾 Guardar</button>
                </form>
            </div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

function guardarConfig(e) {
    e.preventDefault();
    CONFIG.urlIncidencias = document.getElementById('urlInc').value;
    CONFIG.urlTardanzas = document.getElementById('urlTard').value;
    CONFIG.urlContactos = document.getElementById('urlCont').value;
    CONFIG.urlEstudiantes = document.getElementById('urlEst').value;
    localStorage.setItem('censaConfig', JSON.stringify(CONFIG));
    mostrarAlerta('alertConfig', '✅ Configuración guardada');
}

// ==================
// MODAL REPORTES
// ==================
function crearModalReportes() {
    const html = `
<div id="modalReportes" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>📊 Reportes y Estadísticas</h2>
            <span class="close" onclick="closeModal('modalReportes')">&times;</span>
        </div>
        <div class="modal-body">
            <h3>Estadísticas Generales</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Incidencias</h4>
                    <div class="number">${datosIncidencias.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Tardanzas</h4>
                    <div class="number">${datosTardanzas.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Estudiantes</h4>
                    <div class="number">${datosEstudiantes.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Contactos</h4>
                    <div class="number">${datosContactos.length}</div>
                </div>
            </div>
            
            <hr style="margin:40px 0;">
            <h3>Reporte por Curso</h3>
            <div class="form-group">
                <label>Seleccione Curso</label>
                <select id="cursoReporte">
                    <option value="">Todos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <button class="btn btn-primary" onclick="generarReporte()">📊 Generar Reporte por Curso</button>
            
            <hr style="margin:40px 0;">
            <h3>Reporte por Estudiante</h3>
            <div class="form-group">
                <label>Buscar Estudiante</label>
                <input type="text" id="estudianteReporte" placeholder="Escriba el nombre del estudiante..." list="listaEstReporte">
                <datalist id="listaEstReporte">${datosEstudiantes.map(e => `<option value="${e.nombre}">`).join('')}</datalist>
            </div>
            <button class="btn btn-primary" onclick="generarReporteEstudiante()">📊 Generar Reporte Individual</button>
            
            <hr style="margin:40px 0;">
            <button class="btn btn-success" onclick="exportarTodo()">📥 Exportar Todo el Sistema</button>
            
            <div id="contenidoReporte" style="margin-top:30px;"></div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
}

function generarReporte() {
    const curso = document.getElementById('cursoReporte').value;
    const contenedor = document.getElementById('contenidoReporte');
    
    if (!curso) {
        contenedor.innerHTML = '<div class="alert alert-info" style="display:block;">Seleccione un curso</div>';
        return;
    }
    
    const incCurso = datosIncidencias.filter(i => (i['Curso'] || i.curso) === curso);
    const tardCurso = datosTardanzas.filter(t => (t['Curso'] || t.curso) === curso);
    const estCurso = datosEstudiantes.filter(e => (e['Curso'] || e.curso) === curso);
    
    contenedor.innerHTML = `
        <div class="config-section">
            <h3>Reporte: ${curso}</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Estudiantes</h4>
                    <div class="number">${estCurso.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Incidencias</h4>
                    <div class="number">${incCurso.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Tardanzas</h4>
                    <div class="number">${tardCurso.length}</div>
                </div>
            </div>
            <h4>Desglose de Incidencias:</h4>
            <ul style="line-height:2;">
                <li>Leves: ${incCurso.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Leve').length}</li>
                <li>Graves: ${incCurso.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Grave').length}</li>
                <li>Muy Graves: ${incCurso.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Muy Grave').length}</li>
            </ul>
        </div>
    `;
}

function generarReporteEstudiante() {
    const estudiante = document.getElementById('estudianteReporte').value;
    const contenedor = document.getElementById('contenidoReporte');
    
    if (!estudiante) {
        contenedor.innerHTML = '<div class="alert alert-info" style="display:block;">Escriba el nombre de un estudiante</div>';
        return;
    }
    
    // Buscar información del estudiante con compatibilidad de nombres
    const infoEstudiante = datosEstudiantes.find(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    
    if (!infoEstudiante) {
        contenedor.innerHTML = '<div class="alert alert-info" style="display:block;">Estudiante no encontrado en el sistema</div>';
        return;
    }
    
    const cursoEst = infoEstudiante['Curso'] || infoEstudiante.curso || '';
    
    // Buscar incidencias del estudiante
    const incEstudiante = datosIncidencias.filter(i => {
        const nombre = i['Nombre Estudiante'] || i.estudiante || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    
    // Buscar tardanzas del estudiante
    const tardEstudiante = datosTardanzas.filter(t => {
        const nombre = t['Nombre Estudiante'] || t.estudiante || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    
    // Buscar contactos
    const contactoEstudiante = datosContactos.find(c => {
        const nombre = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    
    // Generar reporte detallado
    let htmlIncidencias = '';
    if (incEstudiante.length > 0) {
        htmlIncidencias = '<h4>Incidencias Registradas:</h4><ul style="line-height:2;">';
        incEstudiante.forEach(inc => {
            const fechaInc = inc['Fecha y Hora'] || inc.fecha || '';
            const tipoFalta = inc['Tipo de falta'] || inc.tipoFalta || '';
            const descripcion = inc['Descripción'] || inc.descripcion || '';
            const fecha = fechaInc ? new Date(fechaInc).toLocaleDateString('es-DO') : '';
            htmlIncidencias += `<li><strong>${fecha}</strong> - ${tipoFalta}: ${descripcion}</li>`;
        });
        htmlIncidencias += '</ul>';
    } else {
        htmlIncidencias = '<p style="color:#28a745;">✅ Sin incidencias registradas</p>';
    }
    
    let htmlTardanzas = '';
    if (tardEstudiante.length > 0) {
        // Agrupar por mes
        const tardanzasPorMes = {};
        tardEstudiante.forEach(t => {
            const mes = t['Mes'] || t.mes || '';
            const año = t['Año'] || t.año || '';
            const fecha = t['Fecha'] || t.fecha || '';
            const key = `${mes} ${año}`;
            if (!tardanzasPorMes[key]) tardanzasPorMes[key] = [];
            tardanzasPorMes[key].push(fecha);
        });
        
        htmlTardanzas = '<h4>Tardanzas Registradas:</h4><ul style="line-height:2;">';
        Object.keys(tardanzasPorMes).forEach(mes => {
            const cantidad = tardanzasPorMes[mes].length;
            const alerta = cantidad >= 3 ? ' <span style="color:#dc3545;font-weight:bold;">⚠️ REQUIERE ACCIÓN</span>' : '';
            htmlTardanzas += `<li><strong>${mes}</strong>: ${cantidad} tardanza(s)${alerta}</li>`;
        });
        htmlTardanzas += '</ul>';
        htmlTardanzas += `<p><strong>Total de tardanzas:</strong> ${tardEstudiante.length}</p>`;
    } else {
        htmlTardanzas = '<p style="color:#28a745;">✅ Sin tardanzas registradas</p>';
    }
    
    let htmlContacto = '';
    if (contactoEstudiante) {
        const nombrePadre = contactoEstudiante['Nombre Padre'] || contactoEstudiante.nombrePadre || 'No registrado';
        const telPadre = contactoEstudiante['Contacto Padre'] || contactoEstudiante.telPadre || 'Sin teléfono';
        const nombreMadre = contactoEstudiante['Nombre Madre'] || contactoEstudiante.nombreMadre || 'No registrado';
        const telMadre = contactoEstudiante['Contacto Madre'] || contactoEstudiante.telMadre || 'Sin teléfono';
        const telEmergencia = contactoEstudiante['Contacto Emergencia'] || contactoEstudiante.telEmergencia || 'No registrado';
        
        htmlContacto = `
            <h4>Información de Contacto:</h4>
            <ul style="line-height:2;">
                <li><strong>Padre:</strong> ${nombrePadre} - ${telPadre}</li>
                <li><strong>Madre:</strong> ${nombreMadre} - ${telMadre}</li>
                <li><strong>Contacto de Emergencia:</strong> ${telEmergencia}</li>
            </ul>
        `;
    } else {
        htmlContacto = '<p style="color:#ffc107;">⚠️ Sin contactos registrados</p>';
    }
    
    contenedor.innerHTML = `
        <div class="config-section">
            <h3>📋 Reporte Individual: ${estudiante}</h3>
            <p><strong>Curso:</strong> ${cursoEst}</p>
            
            <hr style="margin:20px 0;">
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Incidencias</h4>
                    <div class="number" style="color:${incEstudiante.length > 0 ? '#dc3545' : '#28a745'}">${incEstudiante.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Tardanzas</h4>
                    <div class="number" style="color:${tardEstudiante.length >= 3 ? '#dc3545' : '#28a745'}">${tardEstudiante.length}</div>
                </div>
                <div class="stat-card">
                    <h4>Faltas Leves</h4>
                    <div class="number">${incEstudiante.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Leve').length}</div>
                </div>
                <div class="stat-card">
                    <h4>Faltas Graves</h4>
                    <div class="number">${incEstudiante.filter(i => {
                        const tipo = i['Tipo de falta'] || i.tipoFalta || '';
                        return tipo === 'Grave' || tipo === 'Muy Grave';
                    }).length}</div>
                </div>
            </div>
            
            <hr style="margin:30px 0;">
            
            ${htmlIncidencias}
            
            <hr style="margin:30px 0;">
            
            ${htmlTardanzas}
            
            <hr style="margin:30px 0;">
            
            ${htmlContacto}
            
            <div style="margin-top:30px;">
                <button class="btn btn-success" onclick="exportarReporteEstudiante('${estudiante}')">📥 Exportar Reporte de ${estudiante}</button>
            </div>
        </div>
    `;
}

function exportarReporteEstudiante(estudiante) {
    // Filtrar datos del estudiante
    const incEstudiante = datosIncidencias.filter(i => i.estudiante.toLowerCase() === estudiante.toLowerCase());
    const tardEstudiante = datosTardanzas.filter(t => t.estudiante.toLowerCase() === estudiante.toLowerCase());
    const contactoEstudiante = datosContactos.filter(c => c.estudiante.toLowerCase() === estudiante.toLowerCase());
    
    const wb = XLSX.utils.book_new();
    
    if (incEstudiante.length > 0) {
        const ws = XLSX.utils.json_to_sheet(incEstudiante);
        XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
    }
    
    if (tardEstudiante.length > 0) {
        const ws = XLSX.utils.json_to_sheet(tardEstudiante);
        XLSX.utils.book_append_sheet(wb, ws, "Tardanzas");
    }
    
    if (contactoEstudiante.length > 0) {
        const ws = XLSX.utils.json_to_sheet(contactoEstudiante);
        XLSX.utils.book_append_sheet(wb, ws, "Contacto");
    }
    
    const nombreArchivo = estudiante.replace(/ /g, '_');
    XLSX.writeFile(wb, `Reporte_${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportarTodo() {
    const wb = XLSX.utils.book_new();
    if (datosIncidencias.length > 0) {
        const ws = XLSX.utils.json_to_sheet(datosIncidencias);
        XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
    }
    if (datosTardanzas.length > 0) {
        const ws = XLSX.utils.json_to_sheet(datosTardanzas);
        XLSX.utils.book_append_sheet(wb, ws, "Tardanzas");
    }
    if (datosContactos.length > 0) {
        const ws = XLSX.utils.json_to_sheet(datosContactos);
        XLSX.utils.book_append_sheet(wb, ws, "Contactos");
    }
    if (datosEstudiantes.length > 0) {
        const ws = XLSX.utils.json_to_sheet(datosEstudiantes);
        XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    }
    XLSX.writeFile(wb, `Reporte_Completo_CENSA_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ==================
// FUNCIONES AUXILIARES
// ==================
function mostrarAlerta(id, mensaje) {
    const alerta = document.getElementById(id);
    if (alerta) {
        alerta.textContent = mensaje;
        alerta.style.display = 'block';
        setTimeout(() => alerta.style.display = 'none', 4000);
    }
}

async function enviarGoogleSheets(url, datos) {
    if (!url) {
        console.log('URL no configurada');
        return;
    }
    
    try {
        // Crear FormData para enviar
        const formData = new FormData();
        Object.keys(datos).forEach(key => {
            formData.append(key, datos[key]);
        });
        
        // Enviar con fetch - Google Apps Script acepta FormData
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            redirect: 'follow'
        });
        
        console.log('Datos enviados a Google Sheets:', datos);
    } catch (error) {
        console.error('Error al enviar a Google Sheets:', error);
    }
}

// Función para enviar múltiples registros de una vez (MASIVO)
async function enviarGoogleSheetsMasivo(url, arrayDatos) {
    if (!url || !arrayDatos || arrayDatos.length === 0) return;
    
    try {
        const formData = new FormData();
        formData.append('bulk', 'true');
        formData.append('data', JSON.stringify(arrayDatos));
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            redirect: 'follow'
        });
        
        console.log(`${arrayDatos.length} registros enviados masivamente a Google Sheets`);
        return true;
    } catch (error) {
        console.error('Error al enviar datos masivos:', error);
        return false;
    }
}

function cargarDatosEjemplo() {
    datosEstudiantes = [
        {nombre: 'Ana María Pérez', curso: '3roA'},
        {nombre: 'Juan Carlos Rodríguez', curso: '3roA'},
        {nombre: 'María Fernández', curso: '4toB'}
    ];
}
