// ========================================
// SISTEMA DE GESTIÓN DE CONVIVENCIA CENSA
// ========================================

// Configuración global
let CONFIG = {
    urlIncidencias: '',
    urlTardanzas: '',
    urlContactos: '',
    urlEstudiantes: '',
    urlReuniones: ''
};

// Almacenamiento de datos local
let datosIncidencias = [];
let datosTardanzas = [];
let datosContactos = [];
let datosEstudiantes = [];
let datosReuniones = [];

// Cursos disponibles
const CURSOS = ['1roA','1roB','1roC','2doA','2doB','2doC','3roA','3roB','3roC',
                '4toA','4toB','4toC','5toA','5toB','5toC','6toA','6toB','6toC'];

// ==================
// FUNCIONES PARA CARGAR DATOS DESDE GOOGLE SHEETS
// ==================
async function cargarDatosDesdeGoogleSheets(url) {
    if (!url) {
        console.log('No hay URL configurada');
        return [];
    }
    
    console.log('Cargando datos desde:', url);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-cache', // Evitar cache en móviles
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Datos cargados desde Google Sheets:', data.length, 'registros');
            return data;
        } else {
            console.error('Error al cargar datos:', response.status, response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        // Reintentar una vez en caso de error de red (común en móviles)
        try {
            console.log('Reintentando carga de datos...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Datos cargados en segundo intento:', data.length, 'registros');
                return data;
            }
        } catch (retryError) {
            console.error('Error en segundo intento:', retryError);
        }
        return [];
    }
}

// Funciones de recarga manual
async function recargarIncidencias() {
    const tbody = document.getElementById('bodyIncidencias');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#666;">🔄 Recargando...</td></tr>';
    
    if (CONFIG.urlIncidencias) {
        const datos = await cargarDatosDesdeGoogleSheets(CONFIG.urlIncidencias);
        if (datos && datos.length > 0) {
            datosIncidencias = datos;
            cargarTablaIncidencias();
            mostrarAlerta('alertIncidencias', `✅ ${datos.length} incidencias recargadas`);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#dc3545;">⚠️ No se pudieron cargar los datos</td></tr>';
        }
    }
}

async function recargarTardanzas() {
    const tbody = document.getElementById('bodyTardanzas');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#666;">🔄 Recargando...</td></tr>';
    
    if (CONFIG.urlTardanzas) {
        const datos = await cargarDatosDesdeGoogleSheets(CONFIG.urlTardanzas);
        if (datos && datos.length > 0) {
            datosTardanzas = datos;
            cargarTablaTardanzas();
            mostrarAlerta('alertTardanzas', `✅ ${datos.length} tardanzas recargadas`);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#dc3545;">⚠️ No se pudieron cargar los datos</td></tr>';
        }
    }
}

async function recargarContactos() {
    const tbody = document.getElementById('bodyContactos');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">🔄 Recargando...</td></tr>';
    
    if (CONFIG.urlContactos) {
        const datos = await cargarDatosDesdeGoogleSheets(CONFIG.urlContactos);
        if (datos && datos.length > 0) {
            // Limpiar datos: eliminar campo Curso si existe
            datosContactos = datos.map(c => {
                const contactoLimpio = {...c};
                delete contactoLimpio['Curso'];
                delete contactoLimpio.curso;
                return contactoLimpio;
            });
            cargarTablaContactos();
            mostrarAlerta('alertContactos', `✅ ${datos.length} contactos recargados`);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#dc3545;">⚠️ No se pudieron cargar los datos</td></tr>';
        }
    }
}

async function recargarEstudiantes() {
    const tbody = document.getElementById('bodyEstudiantes');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#666;">🔄 Recargando...</td></tr>';
    
    if (CONFIG.urlEstudiantes) {
        const datos = await cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes);
        if (datos && datos.length > 0) {
            datosEstudiantes = datos;
            cargarTablaEstudiantes();
            actualizarDatalistsEstudiantes();
            mostrarAlerta('alertEstudiantes', `✅ ${datos.length} estudiantes recargados`);
        } else {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#dc3545;">⚠️ No se pudieron cargar los datos</td></tr>';
        }
    }
}

// ==================
// INICIALIZACIÓN
// ==================
function inicializarSistema() {
    console.log('Inicializando sistema CENSA...');
    const configGuardada = localStorage.getItem('censaConfig');
    if (configGuardada) {
        CONFIG = JSON.parse(configGuardada);
        console.log('Configuración cargada:', CONFIG);
    } else {
        console.log('No hay configuración guardada');
    }
    cargarDatosEjemplo();
}

// Ejecutar en múltiples eventos para compatibilidad con móviles
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistema);
} else {
    // DOM ya está listo
    inicializarSistema();
}

// Backup con window.onload
window.addEventListener('load', function() {
    console.log('Window load event');
    if (!CONFIG.urlIncidencias && !CONFIG.urlTardanzas) {
        inicializarSistema();
    }
});

// ==================
// NAVEGACIÓN
// ==================
function openModule(moduleName) {
    // Recargar configuración en cada apertura de módulo (importante para móviles)
    const configGuardada = localStorage.getItem('censaConfig');
    if (configGuardada) {
        CONFIG = JSON.parse(configGuardada);
        console.log('Config recargada para módulo:', moduleName, CONFIG);
    }
    
    const modals = {
        'incidencias': crearModalIncidencias,
        'tardanzas': crearModalTardanzas,
        'contactos': crearModalContactos,
        'estudiantes': crearModalEstudiantes,
        'reuniones': crearModalReuniones,
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
                    <div class="form-group" style="position:relative;">
                        <label>Estudiante *</label>
                        <input type="text" 
                               id="nombreEstudianteInc" 
                               required 
                               autocomplete="off"
                               oninput="filtrarEstudiantesIncidencia()"
                               onfocus="mostrarSugerenciasIncidencia()"
                               placeholder="Escribe el nombre del estudiante...">
                        <div id="sugerenciasIncidencia" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
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
                <button type="submit" class="btn btn-primary">💾 Registrar</button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('formIncidencia').reset()">🔄 Limpiar</button>
            </form>
            
            <hr style="margin: 40px 0;">
            <h3>Consultar Incidencias</h3>
            <div class="search-bar">
                <div style="position:relative;flex:1;min-width:200px;">
                    <input type="text" id="buscarInc" data-sugerencias="sugerenciasBuscarInc" placeholder="🔍 Buscar estudiante..." style="width:100%;">
                    <div id="sugerenciasBuscarInc" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
                </div>
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
                <button class="btn" onclick="recargarIncidencias()" style="background:#17a2b8;color:white;">🔄 Recargar</button>
                <button class="btn btn-success" onclick="exportarIncidenciasPDF()">📥 Exportar</button>
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
                            <th>Acciones</th>
                            <th>Seguimiento UGC</th>
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
    
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
        // SIEMPRE cargar estudiantes desde Google Sheets para tener datos actualizados
        if (CONFIG.urlEstudiantes) {
            console.log('Cargando estudiantes desde Google Sheets (Incidencias)...');
            cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes).then(datos => {
                if (datos && datos.length > 0) {
                    datosEstudiantes = datos;
                    console.log('Estudiantes cargados (Incidencias):', datosEstudiantes.length);
                    actualizarDatalistsEstudiantes();
                } else {
                    console.log('No se pudieron cargar estudiantes o la lista está vacía');
                    // Intentar usar datos locales si existen
                    if (datosEstudiantes.length > 0) {
                        actualizarDatalistsEstudiantes();
                    }
                }
            }).catch(error => {
                console.error('Error cargando estudiantes:', error);
                // Usar datos locales si hay error
                if (datosEstudiantes.length > 0) {
                    console.log('Usando estudiantes locales por error:', datosEstudiantes.length);
                    actualizarDatalistsEstudiantes();
                }
            });
        } else {
            console.log('No hay URL de estudiantes configurada. Usando datos locales:', datosEstudiantes.length);
            // Actualizar datalist con estudiantes locales
            if (datosEstudiantes.length > 0) {
                actualizarDatalistsEstudiantes();
            }
        }
    }, 100);
    
    // Mostrar mensaje de carga
    const tbody = document.getElementById('bodyIncidencias');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#666;">📥 Cargando incidencias...</td></tr>';
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlIncidencias) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlIncidencias).then(datos => {
            if (datos && datos.length > 0) {
                datosIncidencias = datos;
                cargarTablaIncidencias();
            } else {
                cargarTablaIncidencias();
            }
        }).catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#dc3545;">⚠️ Error al cargar datos. Por favor recarga la página.</td></tr>';
        });
    } else {
        cargarTablaIncidencias();
    }
    
    // Inicializar autocompletado de búsqueda
    setTimeout(() => {
        crearAutocompletadoBusqueda('buscarInc', 'sugerenciasBuscarInc');
    }, 200);
}

// Funciones para autocompletado dinámico en Incidencias
function filtrarEstudiantesIncidencia() {
    const input = document.getElementById('nombreEstudianteInc');
    const sugerencias = document.getElementById('sugerenciasIncidencia');
    const texto = input.value.toLowerCase().trim();
    
    if (texto.length === 0) {
        sugerencias.style.display = 'none';
        return;
    }
    
    // Filtrar estudiantes que coincidan
    const coincidencias = datosEstudiantes.filter(e => {
        const nombre = (e['Nombre Completo'] || e.nombre || '').toLowerCase();
        return nombre.includes(texto);
    }).slice(0, 20); // Limitar a 20 resultados
    
    if (coincidencias.length === 0) {
        sugerencias.style.display = 'none';
        return;
    }
    
    // Crear lista de sugerencias
    sugerencias.innerHTML = coincidencias.map(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        const curso = e['Curso'] || e.curso || '';
        // Escapar comillas para evitar problemas en onclick
        const nombreEscapado = nombre.replace(/'/g, "\\'");
        const cursoEscapado = curso.replace(/'/g, "\\'");
        return `<div onclick="seleccionarEstudianteIncidencia('${nombreEscapado}', '${cursoEscapado}')" 
                     style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;"
                     onmouseover="this.style.background='#f0f0f0'" 
                     onmouseout="this.style.background='white'">
                    <strong>${nombre}</strong><br>
                    <small style="color:#666;">${curso}</small>
                </div>`;
    }).join('');
    
    sugerencias.style.display = 'block';
}

function mostrarSugerenciasIncidencia() {
    const input = document.getElementById('nombreEstudianteInc');
    if (input.value.trim().length > 0) {
        filtrarEstudiantesIncidencia();
    }
}

function seleccionarEstudianteIncidencia(nombre, curso) {
    const input = document.getElementById('nombreEstudianteInc');
    const cursoSelect = document.getElementById('cursoIncidencia');
    const sugerencias = document.getElementById('sugerenciasIncidencia');
    
    // Establecer valores
    input.value = nombre;
    cursoSelect.value = curso;
    
    // Indicador visual
    cursoSelect.style.background = '#e8f5e9';
    setTimeout(() => {
        cursoSelect.style.background = '';
    }, 1000);
    
    // Ocultar sugerencias
    sugerencias.style.display = 'none';
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
        'Seguimiento UGC': document.getElementById('seguimientoUGC').value
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
        const acciones = inc['Acciones Docente'] || inc.acciones || '';
        const seguimiento = inc['Seguimiento UGC'] || inc.seguimiento || '';
        
        return `
        <tr>
            <td>${fecha ? new Date(fecha).toLocaleDateString('es-DO') : ''}</td>
            <td><strong>${estudiante}</strong></td>
            <td>${curso}</td>
            <td><span class="status-badge badge-${tipo.toLowerCase().replace(' ', '-')}">${tipo}</span></td>
            <td>${docente}</td>
            <td style="white-space:normal;max-width:250px;">${descripcion}</td>
            <td style="white-space:normal;max-width:200px;">${acciones || '-'}</td>
            <td style="white-space:normal;max-width:200px;">${seguimiento || '-'}</td>
        </tr>
    `;
    }).join('');
}

function buscarIncidencias() {
    const buscar = document.getElementById('buscarInc').value.toLowerCase().trim();
    const curso = document.getElementById('filtrarCursoInc').value;
    const tipo = document.getElementById('filtrarTipo').value;
    
    const filtrados = datosIncidencias.filter(inc => {
        const estudiante = (inc['Nombre Estudiante'] || inc.estudiante || '').toLowerCase();
        const cursoInc = inc['Curso'] || inc.curso || '';
        const tipoFalta = inc['Tipo de falta'] || inc.tipoFalta || '';
        
        const matchNombre = !buscar || estudiante.includes(buscar);
        const matchCurso = !curso || curso === 'Todos los cursos' || cursoInc === curso;
        const matchTipo = !tipo || tipo === 'Todos los tipos' || tipoFalta === tipo;
        return matchNombre && matchCurso && matchTipo;
    });
    
    const tbody = document.getElementById('bodyIncidencias');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    tbody.innerHTML = filtrados.map(inc => {
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
                    <div class="form-group" style="position:relative;">
                        <label>Estudiante *</label>
                        <input type="text" 
                               id="estudianteTard" 
                               required 
                               autocomplete="off"
                               oninput="filtrarEstudiantesTardanza()"
                               onfocus="mostrarSugerenciasTardanza()"
                               placeholder="Escribe el nombre del estudiante...">
                        <div id="sugerenciasTardanza" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
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
                <div style="position:relative;flex:1;min-width:200px;">
                    <input type="text" id="buscarTard" data-sugerencias="sugerenciasBuscarTard" placeholder="🔍 Buscar estudiante..." style="width:100%;">
                    <div id="sugerenciasBuscarTard" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
                </div>
                <select id="filtrarCursoTard">
                    <option value="">Todos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="buscarTardanzas()">🔍 Buscar</button>
                <button class="btn" onclick="recargarTardanzas()" style="background:#17a2b8;color:white;">🔄 Recargar</button>
                <button class="btn btn-success" onclick="exportarTardanzasPDF()">📥 Exportar</button>
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
    
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
        // SIEMPRE cargar estudiantes desde Google Sheets para tener datos actualizados
        if (CONFIG.urlEstudiantes) {
            console.log('Cargando estudiantes desde Google Sheets...');
            cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes).then(datos => {
                if (datos && datos.length > 0) {
                    datosEstudiantes = datos;
                    console.log('Estudiantes cargados:', datosEstudiantes.length);
                    actualizarDatalistsEstudiantes();
                } else {
                    console.log('No se pudieron cargar estudiantes o la lista está vacía');
                    // Intentar usar datos locales si existen
                    if (datosEstudiantes.length > 0) {
                        actualizarDatalistsEstudiantes();
                    }
                }
            }).catch(error => {
                console.error('Error cargando estudiantes:', error);
                // Usar datos locales si hay error
                if (datosEstudiantes.length > 0) {
                    console.log('Usando estudiantes locales por error:', datosEstudiantes.length);
                    actualizarDatalistsEstudiantes();
                }
            });
        } else {
            console.log('No hay URL de estudiantes configurada. Usando datos locales:', datosEstudiantes.length);
            // Actualizar datalist con estudiantes locales
            if (datosEstudiantes.length > 0) {
                actualizarDatalistsEstudiantes();
            }
        }
    }, 100);
    
    // Mostrar mensaje de carga
    const tbody = document.getElementById('bodyTardanzas');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#666;">📥 Cargando tardanzas...</td></tr>';
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlTardanzas) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlTardanzas).then(datos => {
            if (datos && datos.length > 0) {
                datosTardanzas = datos;
                cargarTablaTardanzas();
            } else {
                cargarTablaTardanzas();
            }
        }).catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#dc3545;">⚠️ Error al cargar datos. Por favor recarga la página.</td></tr>';
        });
    } else {
        cargarTablaTardanzas();
    }
    
    // Inicializar autocompletado de búsqueda
    setTimeout(() => {
        crearAutocompletadoBusqueda('buscarTard', 'sugerenciasBuscarTard');
    }, 200);
}

function autocompletarCursoTardanza() {
    const nombreEstudiante = document.getElementById('estudianteTard').value.trim();
    const cursoSelect = document.getElementById('cursoTard');
    
    // Si el campo está vacío, limpiar el select
    if (!nombreEstudiante) {
        cursoSelect.value = '';
        return;
    }
    
    // Buscar el estudiante en la lista (búsqueda exacta)
    // Probar con ambos formatos de nombre
    const estudiante = datosEstudiantes.find(e => {
        const nombreCompleto = e['Nombre Completo'] || e.nombre || '';
        return nombreCompleto === nombreEstudiante;
    });
    
    if (estudiante) {
        const curso = estudiante['Curso'] || estudiante.curso || '';
        if (curso) {
            // Auto-seleccionar el curso
            cursoSelect.value = curso;
            
            // Cambiar color del select para indicar que se autocompletó
            cursoSelect.style.background = '#e8f5e9';
            setTimeout(() => {
                cursoSelect.style.background = '';
            }, 1000);
        }
    } else {
        // Si no se encuentra exactamente, intentar búsqueda parcial
        const estudianteParcial = datosEstudiantes.find(e => {
            const nombreCompleto = (e['Nombre Completo'] || e.nombre || '').toLowerCase();
            return nombreCompleto.includes(nombreEstudiante.toLowerCase());
        });
        
        if (estudianteParcial) {
            const curso = estudianteParcial['Curso'] || estudianteParcial.curso || '';
            if (curso) {
                cursoSelect.value = curso;
                cursoSelect.style.background = '#fff3cd'; // Color amarillo para indicar coincidencia parcial
                setTimeout(() => {
                    cursoSelect.style.background = '';
                }, 1000);
            }
        } else {
            // Si no se encuentra, limpiar el select
            cursoSelect.value = '';
        }
    }
}

// Funciones para autocompletado dinámico en Tardanzas
function filtrarEstudiantesTardanza() {
    const input = document.getElementById('estudianteTard');
    const sugerencias = document.getElementById('sugerenciasTardanza');
    const texto = input.value.toLowerCase().trim();
    
    if (texto.length === 0) {
        sugerencias.style.display = 'none';
        return;
    }
    
    // Filtrar estudiantes que coincidan
    const coincidencias = datosEstudiantes.filter(e => {
        const nombre = (e['Nombre Completo'] || e.nombre || '').toLowerCase();
        return nombre.includes(texto);
    }).slice(0, 20); // Limitar a 20 resultados
    
    if (coincidencias.length === 0) {
        sugerencias.style.display = 'none';
        return;
    }
    
    // Crear lista de sugerencias
    sugerencias.innerHTML = coincidencias.map(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        const curso = e['Curso'] || e.curso || '';
        // Escapar comillas para evitar problemas en onclick
        const nombreEscapado = nombre.replace(/'/g, "\\'");
        const cursoEscapado = curso.replace(/'/g, "\\'");
        return `<div onclick="seleccionarEstudianteTardanza('${nombreEscapado}', '${cursoEscapado}')" 
                     style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;"
                     onmouseover="this.style.background='#f0f0f0'" 
                     onmouseout="this.style.background='white'">
                    <strong>${nombre}</strong><br>
                    <small style="color:#666;">${curso}</small>
                </div>`;
    }).join('');
    
    sugerencias.style.display = 'block';
}

function mostrarSugerenciasTardanza() {
    const input = document.getElementById('estudianteTard');
    if (input.value.trim().length > 0) {
        filtrarEstudiantesTardanza();
    }
}

function seleccionarEstudianteTardanza(nombre, curso) {
    const input = document.getElementById('estudianteTard');
    const cursoSelect = document.getElementById('cursoTard');
    const sugerencias = document.getElementById('sugerenciasTardanza');
    
    // Establecer valores
    input.value = nombre;
    cursoSelect.value = curso;
    
    // Indicador visual
    cursoSelect.style.background = '#e8f5e9';
    setTimeout(() => {
        cursoSelect.style.background = '';
    }, 1000);
    
    // Ocultar sugerencias
    sugerencias.style.display = 'none';
}

// ==================
// FUNCIONES GENÉRICAS DE AUTOCOMPLETADO PARA BÚSQUEDAS
// ==================

// Autocompletado genérico para campos de búsqueda de estudiantes
function crearAutocompletadoBusqueda(inputId, sugerenciasId, callbackSeleccion) {
    const input = document.getElementById(inputId);
    const contenedorSugerencias = document.getElementById(sugerenciasId);
    
    if (!input || !contenedorSugerencias) return;
    
    input.addEventListener('input', function() {
        const texto = this.value.toLowerCase().trim();
        
        if (texto.length === 0) {
            contenedorSugerencias.style.display = 'none';
            return;
        }
        
        const coincidencias = datosEstudiantes.filter(e => {
            const nombre = (e['Nombre Completo'] || e.nombre || '').toLowerCase();
            return nombre.includes(texto);
        }).slice(0, 15);
        
        if (coincidencias.length === 0) {
            contenedorSugerencias.style.display = 'none';
            return;
        }
        
        contenedorSugerencias.innerHTML = coincidencias.map(e => {
            const nombre = e['Nombre Completo'] || e.nombre || '';
            const curso = e['Curso'] || e.curso || '';
            const nombreEscapado = nombre.replace(/'/g, "\\'");
            return `<div onclick="seleccionarEstudianteBusqueda('${inputId}', '${sugerenciasId}', '${nombreEscapado}', ${callbackSeleccion ? 'function(){' + callbackSeleccion + '(\'' + nombreEscapado + '\')}' : 'null'})" 
                         style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;"
                         onmouseover="this.style.background='#f0f0f0'" 
                         onmouseout="this.style.background='white'">
                        <strong>${nombre}</strong><br>
                        <small style="color:#666;">${curso}</small>
                    </div>`;
        }).join('');
        
        contenedorSugerencias.style.display = 'block';
    });
    
    input.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            input.dispatchEvent(new Event('input'));
        }
    });
}

function seleccionarEstudianteBusqueda(inputId, sugerenciasId, nombre, callback) {
    const input = document.getElementById(inputId);
    const sugerencias = document.getElementById(sugerenciasId);
    
    if (input) input.value = nombre;
    if (sugerencias) sugerencias.style.display = 'none';
    if (callback) callback(nombre);
}

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', function(e) {
    // Cerrar sugerencias de Tardanzas
    const sugerenciasTardanza = document.getElementById('sugerenciasTardanza');
    const inputTardanza = document.getElementById('estudianteTard');
    if (sugerenciasTardanza && inputTardanza && e.target !== inputTardanza && !sugerenciasTardanza.contains(e.target)) {
        sugerenciasTardanza.style.display = 'none';
    }
    
    // Cerrar sugerencias de Incidencias
    const sugerenciasIncidencia = document.getElementById('sugerenciasIncidencia');
    const inputIncidencia = document.getElementById('nombreEstudianteInc');
    if (sugerenciasIncidencia && inputIncidencia && e.target !== inputIncidencia && !sugerenciasIncidencia.contains(e.target)) {
        sugerenciasIncidencia.style.display = 'none';
    }
    
    // Cerrar sugerencias de Reuniones
    const sugerenciasReunion = document.getElementById('sugerenciasReunion');
    const inputReunion = document.getElementById('estudianteReunion');
    if (sugerenciasReunion && inputReunion && e.target !== inputReunion && !sugerenciasReunion.contains(e.target)) {
        sugerenciasReunion.style.display = 'none';
    }
    
    // Cerrar todas las sugerencias de búsqueda genéricas
    ['sugerenciasBuscarTard', 'sugerenciasBuscarInc', 'sugerenciasBuscarCont', 'sugerenciasBuscarEst', 'sugerenciasBuscarReun', 'sugerenciasReporte'].forEach(id => {
        const sugerencias = document.getElementById(id);
        if (sugerencias && !sugerencias.contains(e.target)) {
            const inputs = document.querySelectorAll(`input[data-sugerencias="${id}"]`);
            let clickEnInput = false;
            inputs.forEach(input => {
                if (e.target === input) clickEnInput = true;
            });
            if (!clickEnInput) {
                sugerencias.style.display = 'none';
            }
        }
    });
});

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
    const buscar = document.getElementById('buscarTard').value.toLowerCase().trim();
    const curso = document.getElementById('filtrarCursoTard').value;
    
    const filtrados = datosTardanzas.filter(t => {
        const estudiante = (t['Nombre Estudiante'] || t.estudiante || '').toLowerCase();
        const cursoT = t['Curso'] || t.curso || '';
        
        const matchNombre = !buscar || estudiante.includes(buscar);
        const matchCurso = !curso || curso === 'Todos' || cursoT === curso;
        return matchNombre && matchCurso;
    });
    
    const tbody = document.getElementById('bodyTardanzas');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    
    // Agrupar por estudiante-mes-año
    const agrupado = {};
    filtrados.forEach(t => {
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
    
    tbody.innerHTML = Object.values(agrupado).map(g => {
        const fechaUltima = g.fechas[g.fechas.length-1] ? new Date(g.fechas[g.fechas.length-1]).toLocaleDateString('es-DO') : '-';
        const colorFondo = g.total >= 3 ? 'style="background-color:#fff3cd;"' : '';
        
        return `
        <tr ${colorFondo} onclick="mostrarResumenTardanzas('${g.estudiante}', '${g.curso}', '${g.mes}', '${g.año}', ${g.total})" style="cursor:pointer;">
            <td>${fechaUltima}</td>
            <td><strong>${g.estudiante}</strong></td>
            <td>${g.curso}</td>
            <td>${g.mes} ${g.año}</td>
            <td><strong>${g.total}</strong></td>
        </tr>
    `;
    }).join('');
}

// Nueva función para mostrar resumen al hacer clic
function mostrarResumenTardanzas(estudiante, curso, mes, año, total) {
    const resumen = document.getElementById('contadorTardanzas');
    if (!resumen) return;
    
    resumen.style.display = 'block';
    document.getElementById('estNombre').textContent = estudiante;
    document.getElementById('totalMes').textContent = total;
    
    if (total >= 3) {
        const accion = total === 3 ? 'Citar padres por escrito' : 'Llamar y citar padres';
        document.getElementById('accionReq').textContent = accion;
        
        const btnCircular = document.getElementById('btnCircular');
        btnCircular.style.display = 'inline-block';
        btnCircular.dataset.estudiante = estudiante;
        btnCircular.dataset.curso = curso;
        btnCircular.dataset.mes = mes;
        btnCircular.dataset.año = año;
        btnCircular.dataset.total = total;
    } else {
        document.getElementById('accionReq').textContent = 'Sin acción requerida';
        document.getElementById('btnCircular').style.display = 'none';
    }
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
    const total = btn.dataset.total || '3';
    
    // Filtrar tardanzas del estudiante en ese mes
    const tardanzasMes = datosTardanzas.filter(t => {
        const est = t['Nombre Estudiante'] || t.estudiante || '';
        const mesT = t['Mes'] || t.mes || '';
        const añoT = t['Año'] || t.año || '';
        return est === estudiante && mesT === mes && añoT == año;
    });
    
    if (tardanzasMes.length === 0) {
        alert('No se encontraron tardanzas para este estudiante en ese mes');
        return;
    }
    
    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Agregar encabezado profesional
    let yPos = agregarEncabezadoCENSA(doc, 'Comunicación - Citación a Padres');
    
    // Información del estudiante
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha: `, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('es-DO'), 40, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Estudiante: `, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(estudiante, 47, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Curso: `, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(curso, 37, yPos);
    
    // Saludo
    yPos += 12;
    doc.setFont('helvetica', 'normal');
    doc.text('Saludos cordiales estimado Padre/Madre/Tutor,', 20, yPos);
    
    // Cuerpo del mensaje
    yPos += 10;
    const mensaje = `Le estamos enviando esta comunicación porque su hijo/a ha llegado tarde al centro en ${tardanzasMes.length} ocasiones durante el mes de ${mes} ${año}. Según el reglamento del centro, cuando un estudiante acumula 3 o más tardanzas en un mes, los padres o tutores deben ser citados para firmar acuerdos y compromisos.`;
    
    const lineasMensaje = doc.splitTextToSize(mensaje, 170);
    doc.text(lineasMensaje, 20, yPos);
    yPos += lineasMensaje.length * 6 + 10;
    
    // Texto del Manual de Convivencia
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Lo que establece el Manual de Convivencia de las Hijas de María Auxiliadora FMA', 20, yPos);
    doc.text('sobre las tardanzas en el artículo 38:', 20, yPos + 5);
    yPos += 12;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const textoManual = `1. Los estudiantes que acumulen tres tardanzas en un mes: Cuando el estudiante llegue después de las 7:45 deberá permanecer en la recepción hasta que culmine el acto cívico, luego se dirigen a un espacio donde se registre la tardanza y se realiza el acto cívico, se canta el himno nacional, se realiza la oración y reciben las orientaciones del día, después se dirigen al aula en la segunda hora de clases, quedando ausente en la primera hora.

Cuando acumule tres tardanzas en un mes, se citará a los padres, haciendo acuerdos y compromisos, puntualizando que la reincidencia de la tardanza se evaluará al final del año escolar para tomar las medidas necesarias y considerar la reinscripción del estudiante en el siguiente año.

Nota: Todo este proceso deberá ser escrito y firmado por ambas partes para tener todas las evidencias registradas.`;
    
    const lineasManual = doc.splitTextToSize(textoManual, 170);
    doc.text(lineasManual, 20, yPos);
    yPos += lineasManual.length * 4 + 10;
    
    // Solicitud de cita
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const textoCita = 'Por tal razón, le solicitamos cordialmente que se presente al centro este __________ a las __________ para tener un diálogo al respecto.';
    const lineasCita = doc.splitTextToSize(textoCita, 170);
    doc.text(lineasCita, 20, yPos);
    yPos += lineasCita.length * 5 + 10;
    
    // Título de tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Registro de Tardanzas del Mes:', 20, yPos);
    yPos += 5;
    
    // Tabla de tardanzas
    const tablaTardanzas = tardanzasMes.map(t => {
        const fecha = t['Fecha'] || t.fecha || '';
        return [fecha ? new Date(fecha).toLocaleDateString('es-DO') : '-'];
    });
    
    doc.autoTable({
        startY: yPos,
        head: [['Fecha de Tardanza']],
        body: tablaTardanzas,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 58, 138], // Azul institucional
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 9,
            halign: 'center'
        },
        margin: { left: 20, right: 20 }
    });
    
    // Nota importante
    yPos = doc.lastAutoTable.finalY + 10;
    doc.setTextColor(220, 53, 69); // Rojo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const nota = 'NOTA: Favor devolver esta comunicación firmada';
    doc.text(nota, 105, yPos, { align: 'center' });
    
    // Espacios para firmas
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    yPos += 25;
    
    // Firma izquierda - Encargada UGC
    doc.line(20, yPos, 90, yPos);
    doc.text('Encargada de Gestión de la Convivencia', 55, yPos + 5, { align: 'center' });
    
    // Firma derecha - Padre/Madre/Tutor
    doc.line(120, yPos, 190, yPos);
    doc.text('Padre/Madre/Tutor del Estudiante', 155, yPos + 5, { align: 'center' });
    
    // Pie de página con fecha de generación
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el ${new Date().toLocaleString('es-DO')}`, 105, 285, { align: 'center' });
    
    // Guardar PDF
    doc.save(`Circular_${estudiante.replace(/ /g, '_')}_${mes}_${año}.pdf`);
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
                <div class="form-group">
                    <label>Estudiante *</label>
                    <input type="text" id="estContacto" required>
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
                <div style="position:relative;flex:1;min-width:200px;">
                    <input type="text" id="buscarContacto" data-sugerencias="sugerenciasBuscarCont" placeholder="🔍 Buscar estudiante..." style="width:100%;">
                    <div id="sugerenciasBuscarCont" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
                </div>
                <button class="btn btn-primary" onclick="buscarContactos()">🔍 Buscar</button>
                <button class="btn" onclick="recargarContactos()" style="background:#17a2b8;color:white;">🔄 Recargar</button>
                <button class="btn btn-success" onclick="exportarContactosPDF()">📥 Exportar</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Estudiante</th>
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
    
    // Mostrar mensaje de carga
    const tbody = document.getElementById('bodyContactos');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">📥 Cargando contactos...</td></tr>';
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlContactos) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlContactos).then(datos => {
            if (datos && datos.length > 0) {
                // Limpiar datos: eliminar campo Curso si existe
                datosContactos = datos.map(c => {
                    const contactoLimpio = {...c};
                    delete contactoLimpio['Curso'];
                    delete contactoLimpio.curso;
                    return contactoLimpio;
                });
                cargarTablaContactos();
            } else {
                cargarTablaContactos();
            }
        }).catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#dc3545;">⚠️ Error al cargar datos. Por favor recarga la página.</td></tr>';
        });
    } else {
        cargarTablaContactos();
    }
    
    // Inicializar autocompletado de búsqueda
    setTimeout(() => {
        crearAutocompletadoBusqueda('buscarContacto', 'sugerenciasBuscarCont');
    }, 200);
}

function registrarContacto(e) {
    e.preventDefault();
    const contacto = {
        'Nombre Estudiante': document.getElementById('estContacto').value,
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
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        let importados = 0;
        const nuevosContactos = [];
        
        jsonData.forEach(row => {
            const contacto = {
                'Nombre Estudiante': row['Nombre del Estudiante'] || row['Estudiante'] || row['Nombre Estudiante'] || row['Nombre Estudia'] || '',
                'Curso': row['Curso'] || '',
                'Nombre Padre': row['Nombre del Padre'] || row['Padre'] || row['Nombre Padre'] || '',
                'Contacto Padre': row['Contacto del Padre'] || row['Tel. Padre'] || row['Contacto Padre'] || row['Telefono Padre'] || '',
                'Nombre Madre': row['Nombre de la Madre'] || row['Madre'] || row['Nombre Madre'] || '',
                'Contacto Madre': row['Contacto de la Madre'] || row['Tel. Madre'] || row['Contacto Madre'] || row['Telefono Madre'] || '',
                'Contacto Emergencia': row['Contacto de Emergencia'] || row['Emergencia'] || row['Contacto Emergencia'] || row['Tel. Emergencia'] || ''
            };
            if (contacto['Nombre Estudiante'] && contacto['Curso']) {
                datosContactos.push(contacto);
                nuevosContactos.push(contacto);
                importados++;
            }
        });
        
        // Mostrar mensaje inmediatamente
        mostrarAlerta('alertContactos', `📤 Guardando ${importados} contactos en Google Sheets...`);
        cargarTablaContactos();
        
        // Enviar a Google Sheets de forma masiva
        if (CONFIG.urlContactos && nuevosContactos.length > 0) {
            const exitoso = await enviarGoogleSheetsMasivo(CONFIG.urlContactos, nuevosContactos);
            if (exitoso) {
                mostrarAlerta('alertContactos', `✅ ${importados} contactos importados y guardados correctamente`);
            } else {
                mostrarAlerta('alertContactos', `⚠️ ${importados} contactos importados (algunos pueden no haberse guardado en Google Sheets)`);
            }
        } else {
            mostrarAlerta('alertContactos', `✅ ${importados} contactos importados`);
        }
    };
    reader.readAsArrayBuffer(file);
}

function cargarTablaContactos() {
    const tbody = document.getElementById('bodyContactos');
    if (datosContactos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">No hay contactos</td></tr>';
        return;
    }
    tbody.innerHTML = datosContactos.map(c => {
        const estudiante = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '-';
        const nombrePadre = c['Nombre Padre'] || c.nombrePadre || '-';
        const telPadre = c['Contacto Padre'] || c.telPadre || '-';
        const nombreMadre = c['Nombre Madre'] || c.nombreMadre || '-';
        const telMadre = c['Contacto Madre'] || c.telMadre || '-';
        const telEmergencia = c['Contacto Emergencia'] || c.telEmergencia || '-';
        
        return `
        <tr>
            <td><strong>${estudiante}</strong></td>
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
    const buscar = document.getElementById('buscarContacto').value.toLowerCase().trim();
    
    const filtrados = datosContactos.filter(c => {
        const estudiante = (c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '').toLowerCase();
        const nombrePadre = (c['Nombre Padre'] || c.nombrePadre || '').toLowerCase();
        const nombreMadre = (c['Nombre Madre'] || c.nombreMadre || '').toLowerCase();
        
        return !buscar || estudiante.includes(buscar) || nombrePadre.includes(buscar) || nombreMadre.includes(buscar);
    });
    
    const tbody = document.getElementById('bodyContactos');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    tbody.innerHTML = filtrados.map(c => {
        const estudiante = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '-';
        const nombrePadre = c['Nombre Padre'] || c.nombrePadre || '-';
        const telPadre = c['Contacto Padre'] || c.telPadre || '-';
        const nombreMadre = c['Nombre Madre'] || c.nombreMadre || '-';
        const telMadre = c['Contacto Madre'] || c.telMadre || '-';
        const telEmergencia = c['Contacto Emergencia'] || c.telEmergencia || '-';
        
        return `
        <tr>
            <td><strong>${estudiante}</strong></td>
            <td>${nombrePadre}</td>
            <td>${telPadre}</td>
            <td>${nombreMadre}</td>
            <td>${telMadre}</td>
            <td>${telEmergencia}</td>
        </tr>
    `;
    }).join('');
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
                <div style="position:relative;flex:1;min-width:200px;">
                    <input type="text" id="buscarEst" data-sugerencias="sugerenciasBuscarEst" placeholder="🔍 Buscar estudiante..." style="width:100%;">
                    <div id="sugerenciasBuscarEst" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
                </div>
                <select id="filtrarCursoEst">
                    <option value="">Todos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="buscarEstudiantes()">🔍 Buscar</button>
                <button class="btn" onclick="recargarEstudiantes()" style="background:#17a2b8;color:white;">🔄 Recargar</button>
                <button class="btn btn-success" onclick="exportarEstudiantesPDF()">📥 Exportar</button>
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
    
    // Mostrar mensaje de carga
    const tbody = document.getElementById('bodyEstudiantes');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#666;">📥 Cargando estudiantes...</td></tr>';
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlEstudiantes) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes).then(datos => {
            if (datos && datos.length > 0) {
                datosEstudiantes = datos;
                cargarTablaEstudiantes();
                actualizarDatalistsEstudiantes(); // Actualizar listas desplegables
            } else {
                cargarTablaEstudiantes();
            }
        }).catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#dc3545;">⚠️ Error al cargar datos. Por favor recarga la página.</td></tr>';
        });
    } else {
        cargarTablaEstudiantes();
    }
    
    // Inicializar autocompletado de búsqueda
    setTimeout(() => {
        crearAutocompletadoBusqueda('buscarEst', 'sugerenciasBuscarEst');
    }, 200);
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
    console.log('Actualizando datalists. Total estudiantes:', datosEstudiantes.length);
    
    // Actualizar datalist en Incidencias
    const listaEst1 = document.getElementById('listaEst1');
    if (listaEst1) {
        listaEst1.innerHTML = datosEstudiantes.map(e => {
            const nombre = e['Nombre Completo'] || e.nombre || '';
            return `<option value="${nombre}">`;
        }).join('');
        console.log('Datalist Incidencias actualizado con', datosEstudiantes.length, 'estudiantes');
    }
    
    // Actualizar datalist en Tardanzas - CON DATA-CURSO
    const listaEst2 = document.getElementById('listaEst2');
    if (listaEst2) {
        listaEst2.innerHTML = datosEstudiantes.map(e => {
            const nombre = e['Nombre Completo'] || e.nombre || '';
            const curso = e['Curso'] || e.curso || '';
            return `<option value="${nombre}" data-curso="${curso}">`;
        }).join('');
        console.log('Datalist Tardanzas actualizado con', datosEstudiantes.length, 'estudiantes');
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
    const buscar = document.getElementById('buscarEst').value.toLowerCase().trim();
    const curso = document.getElementById('filtrarCursoEst').value;
    
    const filtrados = datosEstudiantes.filter(e => {
        const nombre = (e['Nombre Completo'] || e.nombre || '').toLowerCase();
        const cursoE = e['Curso'] || e.curso || '';
        
        const matchNombre = !buscar || nombre.includes(buscar);
        const matchCurso = !curso || curso === 'Todos' || cursoE === curso;
        return matchNombre && matchCurso;
    });
    
    const tbody = document.getElementById('bodyEstudiantes');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    tbody.innerHTML = filtrados.map(e => {
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

function exportarEstudiantes() {
    if (datosEstudiantes.length === 0) return alert('No hay datos');
    const ws = XLSX.utils.json_to_sheet(datosEstudiantes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(wb, `Estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ==================
// MODAL REUNIONES Y ACUERDOS
// ==================
function crearModalReuniones() {
    const html = `
<div id="modalReuniones" class="modal" style="display:block;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>🤝 Reuniones y Acuerdos con Padres</h2>
            <span class="close" onclick="closeModal('modalReuniones')">&times;</span>
        </div>
        <div class="modal-body">
            <div class="alert alert-success" id="alertReuniones" style="display:none;"></div>
            
            <!-- Estadísticas -->
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total de Reuniones</h4>
                    <div class="number" id="totalReuniones">0</div>
                </div>
                <div class="stat-card">
                    <h4>Este Mes</h4>
                    <div class="number" id="reunionesMes">0</div>
                </div>
                <div class="stat-card">
                    <h4>Acuerdos Activos</h4>
                    <div class="number" id="acuerdosActivos">0</div>
                </div>
                <div class="stat-card">
                    <h4>Seguimientos Pendientes</h4>
                    <div class="number" id="seguimientosPendientes">0</div>
                </div>
            </div>
            
            <h3>📝 Registrar Nueva Reunión</h3>
            <form id="formReunion" onsubmit="registrarReunion(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha y Hora *</label>
                        <input type="datetime-local" id="fechaReunion" required>
                    </div>
                    <div class="form-group" style="position:relative;">
                        <label>Estudiante *</label>
                        <input type="text" 
                               id="estudianteReunion" 
                               required 
                               autocomplete="off"
                               oninput="filtrarEstudiantesReunion()"
                               onfocus="mostrarSugerenciasReunion()"
                               placeholder="Escribe el nombre del estudiante...">
                        <div id="sugerenciasReunion" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
                    </div>
                    <div class="form-group">
                        <label>Curso *</label>
                        <select id="cursoReunion" required>
                            <option value="">Seleccione</option>
                            ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Padre/Madre Presente *</label>
                        <select id="padrePresente" required>
                            <option value="">Seleccione</option>
                            <option value="Madre">Madre</option>
                            <option value="Padre">Padre</option>
                            <option value="Ambos padres">Ambos padres</option>
                            <option value="Tutor/a">Tutor/a</option>
                            <option value="Otro familiar">Otro familiar</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Nombre del Padre/Madre</label>
                        <input type="text" id="nombrePadreReunion" placeholder="Nombre completo">
                    </div>
                    <div class="form-group">
                        <label>Personal UGC/Docente *</label>
                        <input type="text" id="docenteReunion" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Motivo de la Reunión *</label>
                    <select id="motivoReunion" required>
                        <option value="">Seleccione</option>
                        <option value="Comportamiento en clase">Comportamiento en clase</option>
                        <option value="Agresividad física o verbal">Agresividad física o verbal</option>
                        <option value="Tardanzas frecuentes">Tardanzas frecuentes</option>
                        <option value="Inasistencias">Inasistencias</option>
                        <option value="Bajo rendimiento académico">Bajo rendimiento académico</option>
                        <option value="Seguimiento de acuerdos previos">Seguimiento de acuerdos previos</option>
                        <option value="Problemas de convivencia">Problemas de convivencia</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Situación Tratada *</label>
                    <textarea id="situacionTratada" required placeholder="Describa detalladamente la situación discutida en la reunión..."></textarea>
                </div>
                <div class="form-group">
                    <label>Acuerdos Establecidos *</label>
                    <textarea id="acuerdosEstablecidos" required placeholder="Liste los acuerdos y compromisos establecidos con los padres..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Seguimiento</label>
                        <input type="date" id="fechaSeguimiento">
                    </div>
                    <div class="form-group">
                        <label>Estado del Acuerdo *</label>
                        <select id="estadoAcuerdo" required>
                            <option value="En seguimiento">En seguimiento</option>
                            <option value="Cumplido">Cumplido</option>
                            <option value="No cumplido">No cumplido</option>
                            <option value="Parcialmente cumplido">Parcialmente cumplido</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Observaciones Adicionales</label>
                    <textarea id="observacionesReunion" placeholder="Notas, observaciones o compromisos adicionales..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">💾 Registrar Reunión</button>
            </form>
            
            <hr style="margin:40px 0;">
            <h3>🔍 Buscar Reuniones</h3>
            <div class="search-bar">
                <div style="position:relative;flex:1;min-width:200px;">
                    <input type="text" id="buscarReunion" data-sugerencias="sugerenciasBuscarReun" placeholder="🔍 Buscar por estudiante..." style="width:100%;">
                    <div id="sugerenciasBuscarReun" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
                </div>
                <select id="filtrarCursoReunion">
                    <option value="">Todos los cursos</option>
                    ${CURSOS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="filtrarEstadoReunion">
                    <option value="">Todos los estados</option>
                    <option value="En seguimiento">En seguimiento</option>
                    <option value="Cumplido">Cumplido</option>
                    <option value="No cumplido">No cumplido</option>
                    <option value="Parcialmente cumplido">Parcialmente cumplido</option>
                </select>
                <button class="btn btn-primary" onclick="buscarReuniones()">🔍 Buscar</button>
                <button class="btn" onclick="recargarReuniones()" style="background:#17a2b8;color:white;">🔄 Recargar</button>
                <button class="btn btn-success" onclick="exportarReunionesPDF()">📥 Exportar</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Estudiante</th>
                            <th>Padre/Madre</th>
                            <th>Reuniones</th>
                            <th>Motivo</th>
                            <th>Estado</th>
                            <th>Seguimiento</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="bodyReuniones"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
    document.getElementById('fechaReunion').value = new Date().toISOString().slice(0,16);
    
    // Cargar estudiantes
    setTimeout(() => {
        if (CONFIG.urlEstudiantes) {
            console.log('Cargando estudiantes desde Google Sheets (Reuniones)...');
            cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes).then(datos => {
                if (datos && datos.length > 0) {
                    datosEstudiantes = datos;
                    console.log('Estudiantes cargados (Reuniones):', datosEstudiantes.length);
                    actualizarDatalistsEstudiantes();
                }
            }).catch(error => {
                console.error('Error cargando estudiantes:', error);
                if (datosEstudiantes.length > 0) {
                    actualizarDatalistsEstudiantes();
                }
            });
        } else if (datosEstudiantes.length > 0) {
            actualizarDatalistsEstudiantes();
        }
    }, 100);
    
    // Mostrar mensaje de carga
    const tbody = document.getElementById('bodyReuniones');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#666;">📥 Cargando reuniones...</td></tr>';
    
    // Cargar datos desde Google Sheets
    if (CONFIG.urlReuniones) {
        cargarDatosDesdeGoogleSheets(CONFIG.urlReuniones).then(datos => {
            if (datos && datos.length > 0) {
                datosReuniones = datos;
                cargarTablaReuniones();
                actualizarEstadisticasReuniones();
            } else {
                cargarTablaReuniones();
                actualizarEstadisticasReuniones();
            }
        }).catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#dc3545;">⚠️ Error al cargar datos. Por favor recarga la página.</td></tr>';
        });
    } else {
        cargarTablaReuniones();
        actualizarEstadisticasReuniones();
    }
    
    // Inicializar autocompletado de búsqueda
    setTimeout(() => {
        crearAutocompletadoBusqueda('buscarReunion', 'sugerenciasBuscarReun');
    }, 200);
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
                    <div class="form-group">
                        <label>URL Reuniones</label>
                        <input type="url" id="urlReun" value="${CONFIG.urlReuniones}">
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
    CONFIG.urlReuniones = document.getElementById('urlReun').value;
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
                    <div class="number" id="statIncidencias">0</div>
                </div>
                <div class="stat-card">
                    <h4>Tardanzas</h4>
                    <div class="number" id="statTardanzas">0</div>
                </div>
                <div class="stat-card">
                    <h4>Estudiantes</h4>
                    <div class="number" id="statEstudiantes">0</div>
                </div>
                <div class="stat-card">
                    <h4>Contactos</h4>
                    <div class="number" id="statContactos">0</div>
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
            <div class="form-group" style="position:relative;">
                <label>Buscar Estudiante</label>
                <input type="text" id="estudianteReporte" data-sugerencias="sugerenciasReporte" placeholder="Escriba el nombre del estudiante..." style="width:100%;">
                <div id="sugerenciasReporte" style="display:none;position:absolute;z-index:1000;background:white;border:1px solid #ccc;max-height:200px;overflow-y:auto;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
            </div>
            <button class="btn btn-primary" onclick="generarReporteEstudiante()">📊 Generar Reporte Individual</button>
            
            <hr style="margin:40px 0;">
            <button class="btn btn-success" onclick="exportarTodo()">📥 Exportar Todo el Sistema</button>
            
            <div id="contenidoReporte" style="margin-top:30px;"></div>
        </div>
    </div>
</div>`;
    document.getElementById('modalContainer').innerHTML = html;
    
    // Cargar datos desde Google Sheets y actualizar estadísticas
    cargarDatosYActualizarEstadisticas();
    
    // Inicializar autocompletado de búsqueda
    setTimeout(() => {
        crearAutocompletadoBusqueda('estudianteReporte', 'sugerenciasReporte');
    }, 200);
}

// Nueva función para cargar datos y actualizar estadísticas
async function cargarDatosYActualizarEstadisticas() {
    // Cargar datos desde Google Sheets si están configuradas las URLs
    const promesas = [];
    
    if (CONFIG.urlIncidencias) {
        promesas.push(
            cargarDatosDesdeGoogleSheets(CONFIG.urlIncidencias).then(datos => {
                if (datos && datos.length > 0) {
                    datosIncidencias = datos;
                }
            })
        );
    }
    
    if (CONFIG.urlTardanzas) {
        promesas.push(
            cargarDatosDesdeGoogleSheets(CONFIG.urlTardanzas).then(datos => {
                if (datos && datos.length > 0) {
                    datosTardanzas = datos;
                }
            })
        );
    }
    
    if (CONFIG.urlEstudiantes) {
        promesas.push(
            cargarDatosDesdeGoogleSheets(CONFIG.urlEstudiantes).then(datos => {
                if (datos && datos.length > 0) {
                    datosEstudiantes = datos;
                }
            })
        );
    }
    
    if (CONFIG.urlContactos) {
        promesas.push(
            cargarDatosDesdeGoogleSheets(CONFIG.urlContactos).then(datos => {
                if (datos && datos.length > 0) {
                    datosContactos = datos;
                }
            })
        );
    }
    
    // Esperar a que se carguen todos los datos
    await Promise.all(promesas);
    
    // Actualizar estadísticas en la interfaz
    const statIncidencias = document.getElementById('statIncidencias');
    const statTardanzas = document.getElementById('statTardanzas');
    const statEstudiantes = document.getElementById('statEstudiantes');
    const statContactos = document.getElementById('statContactos');
    
    if (statIncidencias) statIncidencias.textContent = datosIncidencias.length;
    if (statTardanzas) statTardanzas.textContent = datosTardanzas.length;
    if (statEstudiantes) statEstudiantes.textContent = datosEstudiantes.length;
    if (statContactos) statContactos.textContent = datosContactos.length;
    
    // Actualizar datalist de estudiantes
    actualizarDatalistsEstudiantes();
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
            <button class="btn btn-success" onclick="exportarReporteCursoPDF()" style="margin-top:20px;">
                📄 Exportar Reporte a PDF
            </button>
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
                <button class="btn btn-success" onclick="exportarReporteIndividualPDF()">📄 Exportar Reporte a PDF</button>
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
// =====================================================
// FUNCIONES PARA EXPORTAR A PDF CON ENCABEZADO CENSA
// Agregar estas funciones al archivo app.js
// =====================================================

// Función helper para agregar encabezado CENSA a los PDFs
function agregarEncabezadoCENSA(doc, tipoReporte) {
    // Logo del Politécnico Nuestra Señora de la Altagracia en base64
    const logoBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAFlAVMDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9UKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiilzIAoppbDYqBrwJKUI6DJPYfWhNPYV0PaTDY7+1Y/iDxdp3hfTJ9Q1a5isLKAEyzzuFAHt61478dP2vPBvwct5LMXC694lc7YNKsT5jF+wbHQV4H4c+DPxQ/a61aLX/iXeS+HPBzt5tvoMDFXkHYEen1rojRT1loZNu+hb8dftRePPj94on8KfA2wf+z7Uk3WuygqjYPRSa6T4Fftf3+l+ID8PPi9btoniiBvKtdRkXZFejOByeM19M+BPhj4e+HPhu20TQNOi020hAH7lQGbHcnvXK/HD9nHwp8evD5sNdt/KvoATa6lAAs8Df3ga39pR/huOncVj1G3vI5YVdGVwwBDKchvoauBs4r4A0X4kfEn9ijWxonjm0ufFXw9kYLZ6tHl5IBnq5+lfZnw++LXhz4n6DFq3hzUYNRtXUFljcb1J7EVyzouLvHVGqZ2lFV1ui2CFBB9DUwasroodRRRTAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACimsSOlG40riuOopu4+lRSXBVgAuT1IprULk9QtMVbGMj2rzb4oftD+CfhJZS3Gv63bQyIu4WsMgeZvYKK+YtX/ao+Kn7Qt3Lo3wo8KTaVpsvyNrV6pXA7kE1aw85u+yDmR9R/FH46eEPhFp0994k1q2tBGMrahwZnOOAFr5N1r46/F79q7VJtG+GWkTeF/CxbbJrN0hVpI+hIrs/hf+wvYxasviT4n6vN408Qbw/kzPm3j9sHqa+qdJ0i10u1WzsbaOytIlCpFbqFwPStv3dH4NWZ7s8H+Av7F/hL4XMmu6ux8TeLpfnm1O7+cB++wGvoNlhhgKswVVGCy8AD+leZfFr9pDwb8E9OkbWtRiN6oIh06Bg00jehA6V8B/HL9tLxn8WJrix0x28K+HJAVFvbsfOk/wB9u34V14fBYnHysloZzcaavc+v/jh+3J4O+Ec0uk6YP+En1+NtjW1o37uE9w7V03wN/a38HfG6xSK2uF0vWQBvsLxgGJ77favyNVTh97M0jnc7scsx9Se5qeyurnTb1L2yuZLO9T7txC21x+NfUPh2HsbX945/rC7H7iat4d0/XtPmsNRtIb6ymU+ZBcKHDAj3r44+In7H/in4V69deLfgbrc2mSBjLcaBOf3ZA5xGK8z+BP8AwUA8QeCvs2j+O4m8QacoCfblGLiJf9o9G4r7w+G/xa8KfFTSUvvDOr299ERnYHHmr7ba+Vq4XE5fO0ldHVGSlsz5/wDhD+3NZ3GpxeGvihpUvg7xKmENxOhS2lbOM89zX1dp+uWurWkV1ZXMF5ayEbZYGDqfxFcB8UvgX4N+MWltZeJtJjvWKkJdKoWVPcNXy/ffAX4x/s03z6l8LtdfxN4dj/ef2LfNudEHJHNYOFKs7x92XYpXR95DFLXyL8M/+CgGhahqC6J8QdKuPBGtKQjteIUiZvYmvp3QvF2meKLOK60bUbXU7eTnzLeQMMVzzhKG6NE0zdoqBbjdgAhj3x2qbdWadwuhaKTdQGyaYXFooooGFFFFABRRRQAUUUUAFFFFABRRRQAUU3d70m/HJ6UgH0UzzM9BRuNJyS3AfRTPMHYgH3pPNBztYEincCSkyKrz3Bij3MVA9zj+dc5rXxJ8NeHYi+peINOstpwfOnX/ABqlGUtEhXOs47UnUda+fvF37cvwh8G7kn8Uw3kwbb5Vmpc5/CvMNU/4KEXHiSZrXwB8PNY8Qz5+SaSFljI7GtlRm9GhcyPsyV2jX5RuP92sLxF440PwnH5usaxZ6bHgk/aJgpGPQV8dTXn7VnxlVQsFl4E0qU8gkCZVPvWpoH/BPiLXL5L34k+ONY8VSZDfZUmKRg9xn0q3RjD45EOXY6n4h/8ABQjwF4bu30/wxDdeM9WHyi201CRu9C1ecza9+0z+0h+7tLCP4ceG5uPM+7cbT3z16V9ReA/gJ4B+GcIi8P8AhmysnXBMzRhpDjuWPWu7mkgtVaSRxGqjPmSHaige/ak6lOOlNXYtep8vfCz9gvwZ4dvBqvi+4uvG+ubtzSX8hMIbrnaevNfSmm6PYaXbrZ2NrFa2cQwsMCBFX8q8g+KX7YXw3+GCzJLqya1qScCx09hI2ffFfG3xg/b+8c+Md9joEcfhXS5eFeDDXTZ6jJ6fhXVTwWKxTs1ZA2kfePxQ+PHgr4P2Mr67rFvayINyWcRDzOfp2r4h+NH7f3ifxosun+CrdvC+lupU3j4NzIPb+6PevlfWptUvtTe51iW6u72T96WuyxkKnkN83NVkbzo1ZmZywyS3WvsMuyKjTSnN8xyzrN6IW9v7vV76S81C9ub+7kbc890+92Prk0uN2Gyc9OtRso3E0u8+lfVUqcaStHQ5n724N1pKKb5nzglGKHIG3nn0+tXUfIuaWxNh33RgfLnqR3+taPh3xNq/g/Ul1HQ9SudHu058y0kKfpX0T4P/AGDvGPiz4W2/iL7Wtjr8w8yLR7hdu9Oo59xXz34o8Kax4L1+50bWrM2Gp2rbJrfOSrHp+BHOa8iFfDYxyotpm3K4q6Prf4Rf8FGtT02G2svHel/2ogARdUslCyY/vMvc19m/Dn44eCvirZxSeH9dtruV1yYXYJMp91NfjIsYyzEnd1znmp7C8utKvEudNuptNvFbcLi1kMb5+oryMVkFOTbpuxqqzjufsv8AEf4H+CfinZyW/iXw/a37Ou0TsgEo9ww718z6z+xD4t+H19Pqfwk8eX2lxx/PHpd1ISgP93Jrwn4Y/t2fEf4fvHbapJF4r0tAF8m6OJlHqH7n619XfDf9vr4d+OBDa65O/hW9fCmO/X90T/vCvmquDxmB6cyN4OMtWcHZftWfGL4NzLa/E74fzapaR/L/AGnpUfBX+8cda9i+H/7b3wt8fbIV10aNfnh7XUR5bA+leuaX4i8P+NNPV9L1Cy1m1ccCNlkBH0rzn4kfsk/C/wCJCSHU/DEUFyx3faNP/cyZ+orzZSpy/iR5TZRT2PWNL8QWOtQRz6fe299C4yHt5Aw/Sr8MpZjnj2PWvivWP2Edc8Kyfafh18S9Y0Rwf3dpdSkxgemaqR6h+1j8J5RB9ksfG+mwj/WEjzGH1qFQhL+HMXw7n3PnNFfFVj+374h8Lv5Hjr4XazpTr8rTW8RZN1d34e/4KDfCTWmVLrW30eY/8sr2Ipg+maHQmug+eJ9NZzRXm2hftCfD3xMgbTvGGkyZAO1rhVP612Vj4msdSUG2vbSdexjnVs/kaycJxdmh8yNeiq32h92Mbs9MKackzfxdah6Dvcnopgfd0IpdxqeZbDHUU3dRu96aaYrjqKbk0Uxnh37TH7RX/DPPhvTNU/sptZm1G7+zQ26vg5xXiq/t0fES4YNB8HdSMZ5XO7kEcdquf8FI2+z+DfAsyfK0euRsGHUcjmvq/QY0k0HTW2rzaxsTgf3RXdT9lRpRnKN7nI78x8in9sz4xXWVtPgze5PRpMgCk/4aY/aO1IYsvhDEmejSvxX01qnxg8DaBrMmk6j4o0ux1SHAa2uJ1Q89OtWIfi14NkkUL4p0Vm9tQj4/DNNyUtY0y+Xuz5ak8eftd+ICBZ+FdJ0ffwPMIIWmSfD39rjxXtW/8ZaZoiNyRAq5X24FfV03xU8Iwr5j+KtHAX+L7bH/AI1nX3xt8B2kZmn8X6Osa9WN4jfy5qVOqn7lP8A5F0kfMQ/Yt+J/ilv+Kq+MOo/Ny8dm7CtrS/8Agm/4Ikkjk8Ra3rfiFwct5lyVDH35r2HVP2qvhPpMZkuPHGmNtP3YXLGuI1v9vz4SaWG8jUrzUpFbAW2tjg/iatSxtTSMLByrudp4R/ZG+Evg+UNYeDLEyquPMuV81v1r1Gw8O6VoUUcWnafbWKgYUQQqn8hXxj4k/wCCneh2sjponhC+vJPurJcyBE+teQ+Lv+Ci3xM15mi0qDS9DhPO5RvkA/GuqOWY2tbm09QTR+md3cRwxhp2jiX/AJ6SEBR7815n44/aW+HPw9iP9reKbEzR5/c27B5Mjtx0r8utW+J3xL+LmsR28uua1r93NnbZ2jMB+AHSuW8beAfEfgHUIYfFGiXek3MyebE98mRJntu74rro5NDn5Ks9SZVGtj7W+I3/AAUqjjaW18F+HftK4I+26i21PYgV8wePv2iviT8XLowaj4guJkuWEaafYsYoyT0UY616z+yv+zn8NPinYwX2r+ILvU9eWJriXw9CQoWMH+teCfEi6sfDvxY1abwzaz6VZ6bf4tbGYfPCyHGP0r1cLRw1OpKlTheS7kqbludLD+yf8UW8M3uv/wDCNrbW1rH50nmP/pLqOScdSMVX/Zr1DRNM+NnhlvEOnwXul3U5hZbxdwikJwMg981+hng/4gaF4u8FeEviDPc3QbULIaRcrGd0Kuw25kXpwa/O/wDaB+GeofA/4tajpbMJ1WcalZzngTgncrDHp6UsLi54iU8PPR9AajFpn2V+1t8EbL4raJqeoeH7NLbxd4YVQ8MEQUXNsRlQMdeK/PHnc6sGVlYqysMFSDyK+6vE/wC3Rp2g+FfBl1orR6lrz2qpqlm0RAYBcEM/cV8deJdQn+I3jm+vtL0MWc+oTeaun2KtKgJ9CPWuvJZYjDJquvd7mVazehyzfeNJV3VNFv8ARb640/ULV7TUreQiW1lG2ReOmD+dV9gXHHb8a+tjONVXi7mDuQhiu4nChRyWr6z/AGIv2Y38eatD488UW+3w7YvusrSZfkuZByHYd8Gvk7cltcK08QnjWRWMPO1wOcH0B6V95/Dz9t2z1zTfB3g/wvoVroWqNPHbXsV4QLW2txwxU9yR0r5jOqtdUuSktDSnyvc+jNC+LMV/4V8TeL7iIweG9JaaOxZ12mRYgQz/AIsMAV+e3wT+Ht9+1X8fL+/1BJJtEed77U5HJBCE/LCD+VfSv7fXxMh8I/DnSvBejlY7nxHcqDHZ4IaIH0HZia6j4M+FdL/ZF/ZyvNf15Y11SWH7deM3BeZh+7hH6V8jh26FFy+3LY7W+Z26Hx1+018EdE+FfxStPDHhC+m1e51A5GnkbntmP3UHr+NeP69oGp+FNQk0/XNPuNLvUPMdzGUB9ge9dz4P8c+KvFn7QGl+JNOSO+8X6lqAMCzLvRdzcrj+6q96/R349S/DCx8L6VB8WIrHzdQ22yXPlc+djkqeo5719K8yrYT2dGXvdzn5OZ3R+TflxyReXtBTOdvvSmJSuGUOOgV/mA/OvX/C/wAB7341eNvF1t8M4Q+iaXMyxS3r/wCsx0VTXC+Ovh34l+G161h4m0ifTbjdtjdhhH+h717sMZRqtQvr2M3Sa1M3w34u17wbci50LWb7S51O5Wt52AH/AAHOK978D/t+fFDwqkUWpXNp4msl4P25AkgH+8K+bV+ZeQaDGrcbQfrUV8Dh8Q7yiEak47H6H+Cf+CkvhfVkih8TaDdabJjmS2/eJmvcfCP7VPwx8ZNHFZ+LLW2kdd32e7PlMPbJr8f5EJUZ429MUvlowBK8/wB7vXh1+H6Ek3TbTLVeS1aP3It7rRvFVv8AK1hqcDDgqUlB9643xR+zv8OvFh2ar4N0q43HO9bdVP5ivyA0jxdrvh+TzNO13UdPYDA+z3Lr/WvR/Dv7X3xd8LxrHF4uuLmIHAW8QSHFeY8ixMP4bL9rGW6PuPxB/wAE8/g5rc/mW2k3OjzZJDWNyy4rj77/AIJ12unyb/DvxE8RaU3ZWnZ1HpXjmh/8FHPiNpuxdQ03R9T4A3MpiY/0r0LSP+CnW1Nur+CpAf71lNuHvnNc88BmFNWtc0ThY1ZP2Rfjd4ekV9C+Ml3MFGVS5dqkX4f/ALXHh9SLPxrpupqOdsyqSf0rS03/AIKW/D64yuoaPq9gxPH7nePrxXV6V/wUA+EN4u99aubVum2S0INcboYyGsqVxJxvozgv+Em/bC0M4k0fRtTUcllC80p+P37UOl/Jc/DGzvHXq0J4P617BY/tsfB7UkDr4vggAOCs0RBruPAfxx8EfE68e08L+I7PVruJd728ZwwX1xWU5St79Kxpbsz5nj/a1+Pmntt1H4MSuRyXiY4rpvhD+2d4h8cfFzT/AAL4j8FSeHL28iaQeYx3Livq1EDKSwJxxzXxKyf2l/wUoVDylnpm9V7KdvWopclZS921kTK+h9wRsrIDkt7minRlTGCqnFFedym58c/8FJYx/wAKv8LS8bo9ajwfxFfU3hHFx4T0SQHlrKEk/wDABXzX/wAFIrUS/Ay0mA+aHU4mz3r6F+F9x9q+HvhuRW3FrCA8n/YFd0tcPBmCXvH5uf8ABQbwymnftBS3oiVUv7CNxgdSDgmvmZoUDAhcH1HWvt3/AIKZaKY/EngrWFAUNbyQP6nnivij619/lKpVMLGTjc453cmN8kTKR6/3mJFa1n4B1y/tbXUbfQr19PvJhDb3Ww+U8hOAgboTms1eGFfod+xbpen/ABJ/ZnOk6nJstbXVA0bN/wAs2Vty7fTmnmldYKl7WnFGlFXep8CeKPCupeDdSn0zXbAabqNuu+SCVBkZ6V7P4R/Y98ZeKYPC039p6dptl4hXdbS/eIGM7ceuK3v+ChmhJpfx8E5wRf6ZEG47qMZ+pr3z4C+IH1T9mv4d6vD+8m8P61FHMx67WJT/ANmFedjMxqQwcK9JJN7m0YLmZ8F+PvBMnw38fat4a1CRr5tMuVimkT5cruxkfhX1D8cPgT4K+H/wRsLzwz4Q1PWNQ1m2S7Grxt5gswqhmz6CuC/b30VNE/aG1too/l1S0iuVVR1YDr+le++Cdan+LX7GujaRaeNrDwdqS/6NNcXkg2vGvVDn1FZYmvVnTpVo7dSab5ZNM+bf2PfixoHwv+KE03iJ3h07U7M2y3kcZYwORwQBzn6V7P8Ata/DjxX43+G1n4gsfFlr4r8LaEWmMbQhbmHPOWbqRjHBr5J0XVJfhr8Qra9s5oNUOi32fuho7kK3LAehr6G+JH7a2keIPCOv6T4V8ItpmqeIUEd/cTN+44HJVemTW2KwVapiYVqUb9zLmWx5L+zF8QH+HXxs8M6vkiC5nW0uVU7V2OcAn2zXX/tteE7Hw78d9R1HTp7eW31dFuwtu4YRsODnHQnrXgasWjjZflxjHPIINdP4F8F6v8WPGllodhdRyapfMVRryU8n1z3r154eNKusVsktSL9Du/hr+0xqnwy+FGueCYtMg1C21GXfby3DEmBzzlR7EZrhPHnxM8T/ABc1S11HxHdyahcWcXlRNHH8sAAwQSB/OvcfGn7C+seE/AOt67a+JrPX9X0ICW90i3j+6F5Zfrivbr/wbY/FH9k/SLn4bWOh+HbO+gD6xPdRqHj2j58sed24Yryf7QwdGblQjdye/YtRlKJ8qfs9fs9TfHy81u3tNbjsLrT7ZpYLcj5pjj09M1237EviRPh/8eZvDmswRq2oeZYrLMozDcISMLnpmvLfgv8AEm6+C/xY0rxAJf3dlcm3vPLf5JIS20n3Hevpr9qr4GNp3iRfjP4U1rTtPsFjg1WOzlYI88wIJEY7kiqxc3CpLDzfuSV16lU1zavobX7W3wIf4oaHqXjzw/YvD4q0OU2mp2pjwl2i9HHqcV8HKdrYBbg4IbqD3FfXHxU/bxvdS1LTZvA3mwRyWPlahHeoPJkkK/MQp9DXzNoXhfxH8Ttfkg0bSLjVtTuZi8rWUX7lSTk5PRarKJ1sJB/WHZDqRUn7pgbirHacUxYzuBJPXqDg/nX3D8Gv+Cckj+TqPxF1FsNhl0qybp/ss9c78ev2BdW8K/atf8AvJq+mR5L6PISZh7Ke9dss5wtSfs2zJ0mtj558I/Eq50f4geHPEXiCOTxPDo5UJbXcm7ag5UDPpX1h+0J+0J8Nf2gfgJcyNqN5p+qWUizW+lg4Z5ugBH8QFfDd3DNZ3UttdWjWlzCds1tPlWjI/hwRnNRrtLA7Bx0FTWy+li5Rq0uhpdxWp9pf8E7fgyL3UtS+IWqQKLa3H2XTjIvQ9XceleSftZ/FC7+O3xrfS9IVrq0sphpmn26jd5k2drMo/rWJ8O/2ofG/wz8D3vg/TrmCXRJ43iiZl2yWu8fNt7t1613/AOwjpfg2H4kXWv8AirW7S11ayJTTYL1sK8jnJfnv715NfDVqFWeIqK9tioSXLY+wPgx4Osf2e/AnhfwfGkc3iTViHmCqA7HGXb6L0r5d/wCCifi7+3fiponhS3lMrWcCrjqGmc4H86+xPh74u8IfGDxRqHi3TrW5a58PTy6Ql/L/AKpwOXZPb3r4r+HWkD9oj9tvUdSmC3Ok2F890cjI8uE4X8zXiYOo41p15XukbSatyo7Xw/8AsF+D9H8E6ZP418T3dnrupbY0aFsIsrDIUDua+cP2gvgPqv7Pvi5NJvp0vtMul8yyvFX5mA6hq+/vjPpfinxx8SNHXwU+l3t54PYX8ul37kRzSSDCg+mB0r5C/aU8beIPjz8cvDHhbUdF/sjULK4jsLq1hmEibmbLOp9MV6OAx2JlXlKUrq1zHlPn++8N6vpNrDc6hpd5aW8y+ak0kLCJl7YbHNZ4ZWVPlGW5Dhsg/Sv2A8XNp3h//hCPBn/COx67bah/okvmRBo4oo1+ZjkcV8G/tw/DXw58Pfi5bWnha1jt3vLRJJLGIgKrlsLtX3r2MHnixFVwmiZU7K5840H1r7T0r/gnE/iDwbpGpQ+KJNP1e4t1nuLaWPKAkZ2ivkHxH4Xn8P8AivUNAG+/u7W6azV4VyZXzwAPWvYw+ZUMQ5KL2OeUZGUx4AxxR5YwMDn8q9MuP2ZfipDoJ1WTwZeJalfM2qMvge3avOPLeSZ45IXjmU7Xg2HerDsAOc11wxdKq+WMiYwfcFQ7TimNFuOSuT7ilmWW2YJJHNEWHCTIUI/MVXa6VWwXAPfmr5qduZtNFyhZXJWhDcsik+6ivr7/AIJq6X5nxL8V3gUK0NgkYYDoSa+Qlkyu7ORX3L/wTFsh9q8b3xGdwhQH6V4OeQhDCuaSNKW6PvVnwvl5yRjp+VfFPw4mGrf8FE/Gs74drWx2KfTCgV9rH/WL/vA18SfsyKNU/bS+LF8w3Mm6MN3GDivz3C35Kj7L8zsqbn3NbgNChHAxRUCLtUDd0orh5jY+av8AgoFZ/bv2aNbmI5iuInHtzivTf2dr3+0Pgn4LlzljpkWT34GK5z9sbSxq37N3ja3AzttPMHGejZqn+xNqn9t/s3eDrjd8ywNEefQ12Rv9WS8zK1pHlv8AwUs0MXHwr0HUxjdaagIie+Gr86GPWv1R/bx0P+2v2ddcYgg2ckNxnHoetflXu3FT04FfccPz5qHs+xyVtGPU8Ak4717Z8H/2jofhb8JfEXhdLS6m1G7u47q1uITtWMqwODXigUSNjcF/3uh9q+lfgH+zP4V8ZfCuXx54z1W+t9OkuxZi103rBlsByfQd69LMvYRp2xPwmcJanD/tHfHuD4/a3ompvpjadNZ2Zt5m3ZMpB+8KT4EfF74k+D3k8L+BDBqCai4ddPmiEqlxyXGfu49a9D+F37PPgjWP2lr/AMA3epReJ/DS2jTWV1ZzDcSOSrEdSK6Twp4U8H+F/wBsLw7oGmeDrzQdGmjmsiupMwF5IBw8Z9MA149TGYf2P1eEdLXR0qLvdHhPxr8P/EdtUTxR8Q1ddR1BjEpMqPsC9ANp4WsLR/hT448UeH2vNJ8N6pqGhQgytPAreScDJKqetfbv7QfwDh8I/s4/Eiws4fOtre8OqWMj/O0SFssgY84ruvhv4qaPwL8ENWsSsWj3kYsLuJcBcmPjI6dQa4f7WaopRjsHs9bnwx8F/wBmTXvjH4dudetdZsdG0qxmMVzcXWd8TA8qV7VuX37OP/Ct/jv4N8I+LJodZ0HXJVkgurbKrMGHY+1fSXwItYvCP7S3xe+G17bxy6Zq5Oo28D8Bw3LAenWud/ao08a54T8A/Eyxt59PbwzrI0yXTtxZYYxIFLA/hWf9pYn2nKno0X7ONrmJ+2D+zZ4Z8M+AYNc8C2CWS6HL9n1FEbcSjEfM30r5F8I+K5/BPirStbsmPn6bcpPGVOCUyMj8q/TP4jfFT4Y+H7y90jX72GCDxVpAlvLnzRJGpVcKu0Z+avy/1O1sbPVL+Cyma4skmkFtO3G+PJ2n8q9jKqlSvSnRrp+rOWcbO6P1i8OsfEHizRPFGm2/2nQPGOj+TqG0ApFMq5Vj9ckV8r/CX4i+FPgjrvxX+F3jW6V/BwuZTatExYPuOXUH1ya8E0L44fEy68J2Xgbw9qWqf2dCNsdlpsZaUg+rjoK7/wCHv7DfxN+IE0d1qdougWkzbpJtSk3ytnq2PWvIjgaVCUvrEly9O5vzN6JHlHxU1TwVq/i7zPAulXGleHvJEYgu2y0jD+MZ7Gr3hTwF8Q/jdcWNhp9tquu2cICQNOzC1gUccZ9K++vhZ+wD8PPBJhvNbWbxPqCHIa8O2JWH91BX0ppOk6f4e09YLG1trC1iGNsEYjUD3q6uc0oQ9lQjzW6sqMeXU+IfhH/wTftraWHUfiDq4vD1GnWJ2xj/AGWPevsXwV8P/Dvw30qPT/Dmk2ek2yjH7mMAt9T1z715j8Yf2wPhz8JFmtrnU49a1hTiPTNP+dy3pxXgMnjD4+/tZSiHQ7KX4deD5PlkuJx+9lQ9/WvEnOtinerKxfurY9++Mn7YHgT4Lwy2tzqH9ua0WITTbEh5N3ocdKX4M/teeBvjMqWlpdf2JrmMHTL47HP09ax/gr+xf4J+FjJqN5bt4l8RHl9T1AbyG7lQe2ai+Nn7FHhT4oStq+jM3hTxSmTHf2fygn1wOlZJYb+HrfuJSfU6z42/st+B/jdZtNqliLLVWHy6lZKFkzjgsB1r4F+MX7Ffj34VtJPZ2zeKNEGT9qthiVQPVfpXslh8W/jh+yfMuneOdNl8ceDkOBqsIJdVzgZf6V9M/Cf9qL4e/Gi3ig0nWIYtQx8+m6gQk449+DXpYbGYnAO9N3gFoT3PyG4WYq4EbqdmJQQy+2DTWUeYhJxg/eBwfwNfrh8WP2Ufh58WPMutR0ZLHUHHyahYAI+fUjpXxz8UP+CenjTwn51z4WuF8TWIJZLeQhJsen1r6zC55h8QuWpp6nJKlJP3Txr4ffHbxp8LLG4sNA1uS10q6Vke3dNyncME4PQ89a7z9jb42aR8GfijqVz4gOzTdYj8o3wXPksGyc/XNeI+IvDOteFbx7TX9GvtIuI22tHeRsoz7Hoay/lkyAQ6/wCycivQqYfC4mE/ZW94UajT1P1I+H/xC+HGix/EPxboXim31y+nL391ukwwVVO1FB7Z7V8v/sT6PP8AFj9pjVvGOoL5kdikl6S/IDyH5B+Ar5aty0GRE5jWT5WEZI3A9jjrXofwh+OXiz4H389z4Xu4Ibe62tc29zEJFl28DnqOK8L+xalClP2WrZqqi6n6j+G/HN14m+KXi/RYIohpWgW8caXeMlbtwSwz6AYr8/PA/hnUvj1+2EkWr6gNYistQkllnXlUhhbhfzxW98Nf22z4O8I+JtL1LQnm1bWZJ7k6hDJ8oeQEDI645rT/AGC/HngL4d3XiPV/FeuR6Z4i1KcxRx3OSqxjk7W968Wng6+FhOUo6lympWsfbuieMF1b4meINEhyLfQLKNZR2EjjP8q/P/8AZh8Pw+Mf2ytSuJ4vtFtYX15dOrDIBBIBr7M+DvxwsPi34a8Va5Ha6fpxhnubeJ4pFEl1GikK5zya+Xf+Cd62918cPG93NIiStFKEDcFsynOPwrlwqnTp1XazKqNSasfU1x8SHh/abvPDl3rVvZaHZ6Cj+TcShBJM78Yz1OK+R9V03SdU/wCCg8Fvpy28tiNQSdvJAMRbZyMDivbdW/Zj0r49fFj4i6342tr2xt7G5jg06WOQoGjRM5yO1fO37KGg2SftgC10+WW40/S5brymm+Y/KMZJ71pglGNOc4vWxLjaR2//AAU0hs9G1/wha2NpBbv9mmnkaGNVLZbAzivo39n34P8Ag3T/AIN+C4dZ0HT7u9urRXM1xApdiwzySMmvmL/goSp8SfH7wnpQyS1pbwhev35M19p6r4R1hb34cLprRLpuksP7QVu6eVgY/GliK0oYWnFS1NOVTR+ZH7VPhe28G/tAeLNLsbZLWyWZJYoYxhQrL2FfXP8AwTJ09Yfh94svMZM2ohAf90dK8J/4KGaGun/tALchSsV/pkMoY9SQSDmvpf8A4Jx2JtvgTdXK/wDLzqczqcdhxXqYyr7XLotsxjHkmfVhZFRmJ+Ze/wBBXxX+w2g1T4wfGHWev/EyeAOev3zX2B4nulsvD+qXTHAhtZXBzjopr5O/4Jy2puPDvjvVyObvW5TnHXk96+bw6tQqSZvJ+8j7OVSqgZFFKv3RRXm3RscJ8atDOufCfxfp5GRNpcwH4KT/AErwv/gnPqn9o/s/29qTzp99LCRn3r6k16zGoaLqFuf+W1vJH+akV8bf8E67n7BD8RfDecfYNZk4zyPmODXdT1oyiQ9Wj6J/aA0g698F/GVkYhL5mmzYUjPzAZH8q/GT5WGPy9scYr90tfs/7R0HUbUr5gntpI9o6nKkYr8etS/Zw+JdrqV9GngnVpIvPkEbLGCGXccGvpMhxVOheNR2OapHmZ5pGmyRWYfKDmvsj9iNvFVv4F8R3mjX0Os2FvdbbjwrJEGMitgbgx6cV88/8M7/ABOUEnwFrI7f6v8A+vXR+FvgD8cdCuGm8P8Ah7XtHuHADvBceT5g7ZxXvZlUw+Mo8kKiTMY02nc+htW8O+G/hL+3F4Hn0aG10i01W0Z721jkAS3kZcsG54z71h/tRXOteGfj14Q8fX/ivTNV0Wz1qOOysrSZDJaQHhi209OteXp+x38cPFGqSajf6LI19NxJeaheFm+nBzXTaZ/wTs+KF8yvcXmk6fu+87M0jfTmvnY0cNSalOqnpY6Pe6I9u+If7WXgbUoviH4X1PXY7rSby1xYXNsNykunKfnXz98Dv2ttM+HPwvtPB3ibQJ9Yg0q7+1afPbtggAkqW/OvTtB/4JkXrso1nxssa4yy2luOvpzXpfhv/gnB8OdLmB1a61LWiuCFkfYmfwrn9pl9JON7j5Zvc+K/E37T/ibUvjnc/EfS/s2naqyeRaRsN2IiOjAdagjvvi78aEvLSC21zUrHUbg3Utpbwsls0h6nkV+nfhP9mn4a+CZP+JZ4S00SYAEk8Ykbj/er0yz0+GxiWKCGKBF6JCgVR+ApSzOhBp0aeqK5JXPy68Hf8E//AIneMZY59XW28PWhwGW5lMkoHsK+ifh9/wAE4fBWgTRz+IdRvNelQgmJvli+nvX1X4i8R6P4dhNxquqWenQoNxkubhUA/Ovn/wAeft8fCvwWz29lqh8Q34GFhsFZkLdAM9655ZljcSrLRE8qT1PaPBvwv8L+AbYQaDodjpSf34YwXb6k1seIvE+leE7GS81jUrbTraMFme6kC8e2TXxdc/tKfHv43ym0+HvgZvD9iwwL+/jKnB7gmrXhz9g/xJ4/vk1T4seOtQ1ku29tNgmPkr7VzSoKWtaRopJbHU/EL/goN4N0e8m03wZb3HjHWvuRpaISm78B6968/bwr+0X+09Ikut3b/DvwtMcm1jcrIU9OOSTX1b8O/gH4H+FdtFF4e8O2cFxHn/SpIg0x+rGvR42yoBPPoRWTr06KtTiZrmk9T52+EP7E/gD4ZSR6lcWf/CRa5wTeaku7DdyoNfQ9vbxwxLHEixxqMBVAAH4VBNdQWe+WeUIg6ljgV438UP2pvCPw+jliiuxqupqdq29swYKfRiOlefWrJe9OVj0sLl9fFyUKEG2z25pIY1LySqijqzMABSxtGyhldWQ9GB4r80PiV+0p4r+Jc80bXb6PpwYgWlq5ViPc1rfCP9qjxH8N5FttUlm1vR/SY7pIx6V5Ucyp+05D72XAmZxwrxDXy6n6G6hpdtqFhPa3UMVzbuu0xSKGVh9DXzR8Vf2C/BfjqR9T8PtJ4R1sfMJ7AlFyOR0969d+G3xu8K/EyyWXTNQj8/A328p2yKT2Ir0SNh7Y+te3RryTvCR+eYjC1cPP2daDTPgdb79o39mOXbcwN8Q/Da85XMjhR+vSvUPh3/wUE8BeJpo9P8SrceDtYJAaG8jOzPp04r6o4K7SB05FeX/Eb9m34f8AxVhl/tzw9atctnF1bxiOYH1yK7frFGt/Ejr3OfWOiZuX2m+C/i9ooSeLSfE1jMMg5SXg+h6ivCPiJ/wT58AeLBLLok1x4XuyPlFsuYwfcdxXIeIP2BNf8G3RvvhX8QtS0Bwd/wBklclXPoazh8Tv2oPgcPL8QeGIPGukwnLXEILSMo+nOa6KTqRd8PUIcY/aR5p45/4J2fEXw7K0uhXNnr1qoyNp8qQ/h614V4w+CvjvwSWGr+EtSsypwXiQyoffgV92eGf+CinhVZoLXxloGq+Er5jh/MQlB+Yr2zwn+0d8MfiCoGneLtNmeQcQXTqhP4NXs082zDDaTV0ZSpxlsfjg0n2VhHNmF+yTDYw/A1OFEqhsAjs1fstrXwg+HHxCh8298O6Hqok5+0RImT+K15f4o/4J/fCjXsy2+nXmkzMc+ZZ3BwPbBr0KfENNr97DUj2D6M/L+O7u9PUNa3U9semYZCo9xxV7wr4w1fwXrdvq+h30ljf27bkmiJGf98dxX3Rr3/BMvQzn+xvGN/asTwlwgdcVwWqf8E0/F8TH+z/FOnXS9hOhQ/pXVHNsBUi0+pCozvqeXeJv2z/ip4m8OSaNeazFHDKpWWa0i2PKDxgmuU+Bvxfufgf48Pie2sYtYumt3gaGWTaG3ck5r1HV/wDgnr8V9N2eTBpd+uePs8pU/jmuZ1L9if4yWpU/8Imtxjp9mnXj65p062V+zcE1qbe92KHjr4+f8LG+OWk+P9S0Z4YtP8phZW8m4fJ25r17xf8At+XHiXxl4S1ey0W+03TNEneS7s45QBeqRgA/SvGLv9k/4uWjDzvAl65xkeW6nH61nTfs2fFGEhG8BaoG7bVDfyNRPD5ZWivetYLyirI6f9qj4/aX8f8AXdI1rTNMuNMmsLV4ZUuCPnBbI/Kvuv8AYG0xdO/Zp8PkDi4eWbOeuWr86W/Z1+KEYwPAmrsMN8vljBJHGa/Ur9l/w3feD/gT4S0nU7NrDULe1Ant3GCrZ6V4eaTw1LDxpUXoOF73Ze/aC1keH/g54z1AkL5OnOOTjrXkv/BPLRm0n9nizuyhDaldy3XI5OWNaP7ffiEaD+zj4gVeHv2jtB75PQV6D+zH4dPhf4E+DdPIKlbBHORjlhmvBT5cM4rqzVr3kepxfNGp6cUUoYAYorz/AGaNOYVsMpB6EYr4Z/ZRU+EP2uvjD4cI2x3D/aVVuCfmr7levzd+N/hfxZB+2pdWHgrWT4e1nXLRZEuX4D8ZIB/CvQw8ebmiKb5VdH6Nr909ceuKVSM4Dc18MSfCH9rS14i8d2kwP/PSQA/yqI/Cv9rtgR/wmNko9RKM/wAqFhqbv+8RN7H3Zj5sEsT9DRj1LfiDXwn/AMKP/auv4zHcfEKGIN12y/4U4fss/tFX4xffFkwofvBZnIq44aC/5eIOZLc+5pZooBuknSMdMuwH86ydR8Y+H9LUvea3p9uq9fMuUH9a+LR+wT8QNckX+3Pi9qkwblkhlcg/gTWzY/8ABNDw1NMr614v1vUnx8370qD+tRKjh09alwjPsmfQHiL9p74XeGdxvPG+kbx1jimDsPwFeT+I/wDgoz8KtJby7Ce91mfdgLawMAfxq5oP/BPn4QaHKpl0a41KQDG64kJz7mvVfDP7P/w/8Jsq2HhHToeMCRoRIfxzRbCR0jqac0nsj5ruv28PG3jKQweAfhXqd7J2uJo2YYPQ9KqSaf8AtZfFllEs1r4PsZejRuFdQfXvmvtmz0u201fLtreO3UcBbeMIMfhVvztuA21OwBNJ1qcdKcLELmufF2if8E738Q3X234jePNV8QzZy1tHMwjPqDzXuvgH9lf4afDlVOk+F7NpUOVmu4xK+fbNerzXMUfzPLGi98nFcr4i+KXhbwxGZNS12ztgv96YZ/KueeKlb35WOmnhalZ/u43+R1VnDHDGIURIQv3Y4xgAfSpsqvGR+dfOHjD9trwfo8jw6WLjV5VX5ZIo8IT9TXhvjL9s/wAY695sWmWkGk27D/WJ80mPXNeRWxlCD+LU+nwPCWZ45rkp2R92ax4m0vQrd5r3UrezVPvNO4UY/GvAPiN+2h4Z8NXE9roqvq94nyq0YxGT67q+KNa8ReIvFk73Oq3eoagc8iTey/kOKyI7WaMN/o8wVRuy0bAAevIrzauY1ZK0I6H6VlPAmDjJPGV032PUPiN+0h43+JU/2We7On2kzbY7Oz6sT0XNdj4N/ZJn1fSYdS8T66miG5USJBIQHGf7xPU15F8PBBceOvDUd2EFu18gLN0HPFep/tdR+IG+Iam4S6GhJbRi1MbMsecc8iuOlN14OrUV0j2Myw8MDi6eX5a1STXxMwfiz+zrrPwxtF1SC7j1vROpuEHKL6kivLbeP7dfW0CfIZpljz/vECvW/hp8ZLDR/h54h8L+I57i+tLmNlso3Jkw2OhPYZryjQfm8QaSV6fbI8D0G8VzVPYSqRdLc9/LcVjqeFr08XrKG0ujO0+IXgDV/gjrViF1WQXVxH9phltyUaIZ4z/er0n4a/tneINB8q08SQHVrNcA3CDEn5VF+2d+88XeGN2B/wAS8mvn1WCqM963rVp4araDOHA5bhs/y5V8clzO932P0t+Hv7Rngjx8qJZavbwXbED7PcOFf8jXq0ciSoHRg6nowORX5J6l4Z1rwvb291qOmTadBcYa3nePYSevy4rrfB37QXjrwXhLbV3vLVORFdsSPzr0qeZqFoVVufBYzgFTg6+XVlJH6ghh0zRJtcFQ2fbrXxf4N/buEIjg8SaLIz95bT5gB617V4X/AGrPh/4k8tU1dLGVjjyrpSh/PpXpU8RQmviPz/FcP5jhJWq0mzuPFfwv8K+MraSLWvDdhqJfgtJEu8/jivFfGH7APwo8TMzwabcaNcNyHsZCpU+1fQGmeMtF12NTY6nbXHGf3coNaSzRnDbwa9WniZxXuTPBnRlB2nFr5HxdefsA+JvDsnmeB/itrGmIv3Le4YsAPTrULfDT9rDwKNuleL7HXrVOAtwg3MPxr7djkTdwwJpJJAwxkVqsVN/EkzCSUXsfEA+OP7UPg2TGpfDWDXQvyma2A59+KsD9u/xvoLBfEfwZ1iCU9WhjbH8q+1WjZlGTgexIqKa0Ey5kG/03KD/OqVWlL4oJhfyPjy3/AOCk3h2P5dW8Ha9pzf3RCW+vUVr2P/BSj4XOGFxFrFmf+mlsea+l7zwrpN0P9L0ywnB6ebbIf6Vk3fwl8H6lgzeFtJuMd2tE/wAKfPh1vAWsloeKWX/BRD4O3m7fq95Dz/y0tWP8q0bf9vP4NSjcPEzKenzWrA16PP8As6/DnUGDT+CtJyvHywKo/SqF1+yz8KrplMvgfS3KjAPl1PtKG1mTyPqcjH+3J8G5I93/AAl0a/70LA05v25vgumA3jCPP/XJjXQyfsi/CSVgx8D6cpxjATFQn9kb4Rxs5PgjTwwHHyUv9mmrNMdmj5c/ao+N3h39pLxD8O/BfgzU31Gwm1RJbtljIUhT6V+gGhacml6LY2UY2x28KRAD2AFfAvg7wD4eX9vZNM8N6XFY6NoViJZIIB8iybec++a/Qa3k3Qqw4B5xW2J5IRhCC6Dj72rJdntRR5ntRXnl8qEb7pr4c/a6z4L/AGofhJ4njHlpdXK2jzHpy3Ir7jbpXx1/wUb0WWP4a6B4ogizNoWpRy7/AO6Cwrpw38Sz6imro+t9wYhh8ysQR+NSVz3w/wBdj1/wboOoo29Lqxhm3epKD+tdFXHL3JNIOW4gHPWmyABTuGRT1pJV3xkE0czvZsylE8Z+Nf7Q9n8ErzTLe/0q61D+0AxV4CMJjtXmf/DeujdE8PaiPwB/rTv26/D7XHh3SNVCbktbgoXHbcOK+MF4PfkdQcH2xXgYzHVaFX2cHofuXCvC+X5tg3Xrbo+x3/b40cAlNBvJCOcEgZ+nvWVdft8GTC23hi4iLH5TcSbQa8n+D+raFpnhvUEuJbfS/EEkmLbUNQg8yDHoCRgGuum03xHrWl6gmrReG/HVk0BMcellYrlP9sD2p+0ryXNc5MRluVYbFOl7K6vYtal+3d4quRss9ItbQcje8m/Nc5J+038VPGV19k0qSNpyjMY7aHLYHfJ6V4fcQvbzSK8TRDcV8nH3OwX619KeAvBfiP4d/CqPVNF0qO78WatIjyJLKqm3gBzjn1FcVOtiKs2nOyPq82y7J8lw0KtOinOXQ8Q134oeNtUnYal4g1DcOGhEhXHPPFZOh6Lf+MPEFtYWwa5vrokRiaUncR15NevftHfD2XTG07xpb2f2a31KNV1G1Vg32ab1yOxrjfgK3l/GDwziP5FnYgHvlf8AGuOpGoqyhO7ue5gq2FnlUsZhqKUo9PM43VtLn0LVrvT7vZ9qtn8uVU6A+lU7jIjdgcYjOfceldL8VG3fE3xOQyA/bnBGe9c0ymS3Zl5+U8GuCp+7q6LqfW4LESrYKM1vKPQ+ldW8fX/wx+DfgS80fTba8e+ixK0tv5jA++BXnXij4/eKPEem3WnX2l2EMUiFGljtCm3PvivTNU+KupfDX4I+ADpsFlcNcx4YXUYbAHfmvK/GHx+13xhpdxpdxa6UkM/y5hiAKg9819BXa5UlK2h+T5RQqVsQ5ygnaT1b1Wp5rC0lmsTpKyShgAy8lGHIZa+nPA/7Wel32iWmjeOdHF4kYEP2nZ5gdQMbmHY14p8INQ0ux+JGiJqUUEli8nkv5gyNx4Fdb8fPhPqng/x1dX1lpMkui3rGS2e1UsPmH3SBXLho1Y0XUp6rsfTZ88BisXDB42PK7aSuelfEL4N+B/iR4Yu/E/w9mhivrdTJJbxfcIAyV29jivmfQm/4n2lnG0m8jG33DjIr6E/Zd0LU/Dum+LNc1S3m0/RFtCi/aQVDvg87TXgGnyrc+LrORduH1JGGOnzSAitalGN4VHCzZ5mUyqU6eLwcJ89OC0Z7f+2YufF3hhuw005rzP4K+DJfiB8Q9I0oxI9ori6uWPQRrztNep/tpx+T4u8NDt/Z4yB9c1a/Z3sNJ8C+ANd8b6/I1la3bGCKbHzbDx8o60VKHPjHJ7GGHxbwfDsYxfvVG7fedX8QL61+OPhLxvo9nbxpd+GLkC0Ef3pEVecV8fK7GMvgErn5W9u1fUXwh1z4R+D/ABo02k61qb3Opf6O8d1u2SM3c5+teO/HbwMPh78RNYs4U/0W6Bubb0Kkcge2a0xlJVaaqLdFcI4uWBrTwNW/vK8b9zX1b4BarZ/C+z8a2b/aorhVmnt1H+rQjkj1Fcx8O/h+3xI1C/hS4+yiwtmuXXbncB2x26V7Zr/xMuvh/wDDj4Xzpm40iaBor+1IyJIz1yPatfwB8Ll8O+K/EHiLRGa58MaxpUksUy8hHIJ2Y7Yo+qxsnE5nxBi6VKrDEdZNRfo9j5YtdYv9LZmsr27tNrkLJBKykYOOgru/BnxW+KMl2LPQNW1DUJkGfKb94QPfNefMpEwjVWZmkZVVOu4tx+tfT/h3wT4k+EHwvt5dAsY7zxdq0iyXUssiKYU67efUcVwYZV6k5O9kj286r4PC4WnGdKM6klfY461/az+Jnh+4e21CSGS5hO14biPYQa6HTP26vFVq4F5pFnOmP4X20z4+fCu+17wtY+PYLJLO/EQTVLGMh2U/38ivDvh7caQvivT5datJL3ShJ++SJNxA/vEDtXa6uIpNLn0PKwmX5PmGBniXSXNHdI+k7X9v28jz5/hxiAuf3bEj88Vpwft9Wyvi48OXPIyNkgYVx99q2papqLP4X8U+EW0dXxFp11bKkgjH8JJ715J8Y9Jl0zxNFJLoA0Fpo9xSJw0Ux/vrjtW1XEVaMeZM8TLcpyjMsQqMqPLc+kJf2+NMleMf8I3eZzgcrXuHwN+M8Hxm8PXGr22nTaeIZTEyy45I9K/MNWO7I5GDkV+g37E+jnTvg3azsu1ryZ58H3Nb4HGVa83GWxz8ZcN5fk2FUsPH3rn0IJKcJF9aiaivfPxZuzsTbh61WvLiO3WWV2CokbOSe2BnNSjmuF+N3iWPwb8K/E+rSS+UYLKQKxHRipApxjzSSC58tfsW/wDFa/Hn4weMSvnKl6bKGXsVJ7fhX3DarthxnODxXyp/wTs8LtpnwROvTxbLvXr6W6kOeSASAa+rof8AVrWmIler6Fx2H0UUVz8zLEblT9K8Q/a68Knxl8AfFtkI/NeG2Nyi9zsGc17gehrG8QaTHrOh6jYzIHW5t5ISMdQykYrWMuWaaJlseJ/sS+Lh4w/Zx8JzySGSe2RrWU46MhwBXvVfGX/BPXUjod18RvAUjMBpWqvNCjdVUsa+zauvH9433COwUv3hjr9aSisOVDseM/taaGmr/B3WmyE+zqJwT6ivzeiu4WjTdOiHb1J5r9e9a0m01nS5rO+t0uraYbZI3GQRXlt58KvhxBdMr+H7MyJwQIQeK+TzueHw7jVrz5UfpXDHFSyWlKjOPMmfBHhj4nWuj6B/YesaXZeI9JD+ZHFcNh429jW3p/xk8PeF2nuPC/ha20rU5IjGLyScvtz1GK+2I/hh8NpOf+Ees8e8FP8A+FV/Db/oXLPn/p3rwpZ9lysliUj1avEOAxFR1p4d3bufnNpPiKC38QRatfrFe7ZvPktt2FkkznOa2PHvxQv/AB74ik1KW8awj8tYktobghVUdOlfoEPhX8Nx08OWf/gOKP8AhVvw3/6Fyz/8BxWH9sZXZr60tTvqcW4SrVjVnh23FaHwb4T+LzaDoOqaHqUa63pWoL88csxLIwHBBNYvgLxpb+B/FGnaxF5d0li7yRwyOQeeik+1foYfhf8ADYD/AJFyzH/buKb/AMKw+G//AELln/4Diqln+WqzeJWhEeKsHFVFHDO09z4w1T44eE9Yvrm9uvA2lveXD+bJMZjuLnvXmWt6zZ3+pXU9qLezgnYkQRtlYwR0r9G5Phn8NVIz4bsyf+vcUz/hWvw0/wChbtPwtxU1M/yqs+aWIjcnB8VYTA39nQk/Vnx3oX7RGn2PhHStC1Pwvp2sQaZF5cMk0mS3vjHFQav8dfDmpafPbReBdLspZFK+dG4+Xjg9K+zl+GPw1Kkjw7aD/thTv+FY/Df/AKF2z/78CqfEmXPT6zE4YZ9gKc+eNCV733Z+aa3VttBaeKPkthDyGzwQfavd/Av7YWreFdJh03VLe116CFQkUkjYfA6ZJr60/wCFYfDb/oXLP/vwKP8AhV/w2/6F2y/78CsqPEGW0X7mLR3Y7inBZjFRxGGba69T4t+KH7TWqfErTzpiCDRdMY5eK3k5k9jXl1hfW8N7BOsq5hlRwrHrtII5/Cv0v034K/DzVgzReG7PCnHzQAUa58HfA+j2L3CeEILvyx/qbeEF29gK+roxeYQWIpVLoyw/GmX5dRlh6dGylufA3xY+MH/C1tRsLu7t0s3toPKwHzmmeLPi1/wk/g/SPDUKLp2naeQwUSbvNIHf619I6n8Uvgbot9JZ6j4GnsrtOGjuLEK361W/4W98BMf8imwPf/RAMVvLCVZKzmeCvEbIcK4QqwsobJnx+s6RyRyLdKJYyGV92DuByD+Fd38Tvi1/wtDS9JS8ght9QsYvIN2r5Mi4HH5ivob/AIW58AB/zK7/APgGKX/hbn7P/fwww/7dBUxwEoxtzl1vFPh6vUjVmk5R2Pm3xd8UD4q8MaBoxjito9KTYJd2d/4VtfDX9oLVPhzoWo6MirfaddIyoksxxESMZHtXvH/C3f2fmOP+EXbn1tBT/wDhbH7Pa4P/AAjSj/t0prAzvfnOefiZw3UpOhKKcb3+Z8q+EfFlj4Z8RW+r3FvHqDQ5ZYWfChs5GfXFTeMPiNqXjPX7jV7jUmtpZPlWGOZgsYHTA6dK+pP+Fufs+Z/5F0f+AlH/AAtr9nvp/wAI4v8A4CVSwEknFT3Ol+KXD0qiqSim0rI+cvhz8ZNR8B3F758y6zY3kZSa3uZiRyMd6x9F8aJ4Z8WSa1pMcFpHuPl2UjbkMZ5KV9Ur8WP2e15/4R5V9/sopf8AhbP7PZ/5gMZHva1Ly+UrXnsZf8RM4djKcoRtzb2Pnm6+JXgnULp7y68CWRu3O5ylyVV269vesP4gfEy5+ImpQXN39nsrW1j8m2s4jlY0HTnvX1H/AMLY/Z6H/MAi/C1o/wCFrfs+H7vh+P8A8BK1ngpzjyuehhhfEjh3C1lXpx95eZ8ZvdQeS6rNHvPQZ5r9O/2a9NXTvg/4dgTGRbKTj35ry3wZ4k+BvxA8RWui6V4dhlv5w2z/AEbaFwM5NfS2g6fBpNhFaWsKwW0SBUjUY2itsDg/q7bvcniDjbD8VUo+wVkmXDG3pQI29Kmor2T8/dmyHaR9a+W/+CinixvD3wDn063kIvdbu47WNB1YZGa+pJpBGeQT06V8SftezH4k/tNfC/4fRAyxWsgvrqP+H72efwrehG8/QVj6g+A3hBfBHwl8K6QIhEYbGMuoPRioJ/nXoa1XsYVt7OKFRhY1CAegHFWBXNO8ptmqVhaKKKdkMKiZe9S0wjKt60upEj4X8N/8Wd/4KFapYyHytN8W2bSQ44UydcH3zX3Bj5QentXxX/wUC0mXwrrnw6+Jdqm2fSNQjilkTg4Ljj8s19haBrMXiDR7DUYjmK6gjlRgcj5gDiuyt70ITHG9jSopzRlRkmm1yX1ZQkrN5RCjLdq8+8TWpi1R9ysu8btw4r0NV3NXKeMrP91HNk5VsfnX5T4iYD65ljcd4nfg58tTU5RY16At+dO8s9ifzoXiQj0p9fxd7SpF2bPr1BNXGbG/vfrSfP8A36kprD8qjnm9Wx8sUtRFDHq1Lz/e/SnIu5wBnJ6Vow6Dd3HzMBGvvXpYLLMdjdaUW0cs6tOHUynyv8ePwo2uRxJ+lbbeGvW6VT9M0n/CNyhf3U6P+GK9uXDOY7xS+8wWIhcxlQ92zS7PerU2n3Nt9+E/71VtwK5IwK+cxmBxeCdq8bdvM6oyjLYTYfWjy/cU6lHUVwQlKTs2V5nS+CmOJx6NUnjLx3o/gGxju9Zuhb20kwhEjDgMf6VD4Nyizk92rxr9txd3wrjDfOPtsfWv7n4FXLklNvsfnWfYt4SlKvbY734gfCfwp8YdHLzRQyvIu6C/twN4z0IbvXwt8Xfg1q/wj1iaG/U3enu37m+QEKV9G966f4D/ALQmqfC/WrfTdTmNz4dnmWNldixhz3X2r7h8V+E9C+KXg8wXUUd5p9xFuRxzjI4INff/ALuvD3dz8xqUcPxHhpVKWk0fl2i+Ym4N+GTmk+pJ/Gul+IPgi7+GvjK/0O+ZpUiz9nuGGPNXPH5CuaPQ15Uo2lyn41iqNXDVZU57oMr3yR6Zpd6L0GP1qOinynNzPuS+aKTzAf8A9VR0Uxcz7ji3oFPsVpN27gqq+6ikopF+0l3FP1zQMMQGOBikqSPCqWPUEEUmtNDSFScna59EfsVeF11H4iX2rsuVsLXYrnoGc9PrgV95Wqsu7J44r5w/Yr8HrpHw1OpuhWXU5mnff1wOBX0lECGbnjPA9K9ijHlgmz+j+GcPLD4CPPuyWmlsdadUb1s3bU+tK1zMFkJPCBTye2OTXxF+z35vxc/bK+IHjSQedY6Ofslsz84xwMdq+nP2hvHUPw5+EPinXJnKNHZPHHg4JdgQMV5R/wAE/PAU3hv4Gw61eKP7U1+d76SRh821j8oNd1NqNKU+40fUNvlo1J6nk1NTI1KKoJzin1wI0CiiiqAKQj5TjilooFY8a/as+Gg+JnwM8TaUoD3Mdubq2+XP7xBkVyn7C3xA/wCE6+AelRXTs2o6RK1lOrHLBlOK+ibyFJrSWOX/AFbqVb6EYr4b/ZfuG+DP7VnxA+HNy/kWeqO2oWEbcBiTk4rrp+/ScOw2z7kaTcCKjoMm5vQdveiuNdWAqtt7ZqhrVqt5ZSKRnuKvfjTJV3xla8fNcLHGYWpQa1aNIy5GmeYM3+kSDbt28U6ruuWbWupyZHynkH1qlmv4CzjA1MFjqtGStZn2tCfPTTEdtop1tG1zMsaDLN+lMbDYGMk10Ph2xMdvLcYViR8ma7uHco/tXFrmTcV9xGIqqnB9xscdtoMf70iadufpWbf65c3T4SUxpjGBUN5HdveSSzRNnt6VWd1LKAMdjX0edZni8PL6tg4uEFpojiowg3zVNxGklbkysx+tOiuJocbJXB9c0jDBNCruPGT9K+FjmON5+ZTdzv8AZ02tUa9nrjhSlxmSMdWp97pccoN1akGIjJT3rI2kthCxb/ZHBrX8Nw3S3DZQmFxyG6Zr9EyitXzhPCY2F7rRnl1EqT5oMx92CQR83pThnv1q34gs/sV+QBtVuc/0qqqk4r88zTL55bi50JaWPRpy54JnTeCxujnz0zXjP7cEZX4VxnP/AC/RV7P4K+5cfWvHP24/+SUxf9fsVf2vwRrkcF5f5H5nxYl9Sqs+Eo44huUhs54YHmvub9i3x1ceIvA1xo945lk02UxxsxyTGeg/CvhYttY/WvqX9hM3J8QeJUX/AI9/LQ/8CNfXYP3ZWPwzhOvOnmPKnozqf23fAkN74bsvEUcQFzYy7GZV5ZT3zXxkehr9Ff2p40f4N66ZhgLGNv1BGK/On+EfSrxSSndF8Y0I08bzRVrjaKKK5z88CiiimIKVRmkpV4o6XGOWPd3xVjTdPl1XUrbToPmnu5FhT8T1/CoY2HzE9K9o/ZM8B/8ACX/E4Xs8Ia10mPzXZuQHP3R9aKcZSeh7WUYSWNxcYJaH3b8OfD8fhjwbpmmxKFWC3ROBjJAGT+ddPEpBNQQL5ahAMhV+971ZTpXt9Ej+o8PSVGjGC6IdUUjbWAI4xnNStxzVG7uCrJ02jrn06k/hVdkdOnU+Of8AgoV4ll8QHwL8NbAs13r2oJJMiHkRBucj0r608A+G4vCfhHSNHgASGxt0hAAx0Ar4x+GCv8ff24vEfiqbbc6H4UQ2lr3RGHAx+Oa+6rPPk8kFs8kV11lyRjTHEnooorkLCiiigAooooAZMA0TZ5GK+IP24tHn+HPxE8A/FvTUKS2V5HbXcijqhPQ+2K+4WG5SK8y/aA+GUHxU+E3iHw/JkyzW7SW7YBKSKMgj8q2oz5KmuzIkdb4d1mDxFo+n6paOHs7yJJo2HP3hmtavlT/gn/8AEy68SfDSbwfrDga/4ZuZLaWNidxjBwpr6sxjipnDkm0ikJQFO7g4opay5VIZzfi7Ty9uJ1PzJ1+lchuO7jp2r027gF1CyHoRgivO76xNhdSRYO1T8pPWv5P8TMleFrfXqcdHufR5dWb/AHbK+7ayY6k4ro9UvJdKsLf7OQAeoPeubfdlSo5HNbmsxvdaPbyj7y4JUdK+M4Vrzw+DxE8O/etc0xS5pakcPiR1b9/CJFPXHWrGNO1RAxHlMe3eufmIZh8uabGW65IHpXHT4rqyajiYKXqayoQ3gzol8LxXRzFdZHoO1MGh2lq5Wa6ye46Yo8KyOLyX5iRt6VkaoztfzZO7L96+xrVsqw2XU8esOuaTMIqpUm6blobbalY6fiKJBJ/tVTuPEk6g+Qqxp6VleWgbIFBXc23Hytx718tDibE1a6hRShZ6WRp9VSumdB4ixcafBO4+bArBVjit3XyI9LgTvxWEO1cXFz9pjYzlu0rm+F/hW7HT+Cs7J/8AexXjv7cXzfCmP/r9iNex+Cfuz/72a8Z/bhfb8KUYkAG+jHJr+reBf+RHT9H+h+ccU3lhKkVqfCaBXLMx2hckg8HjtX3H+xL4Ln0LwPda1dRtDLqku9I2GMIOlfOXwP8AgXqfxZ163nlge28N2soea4dcGfBztX1FfoBdT6d4H8O5fy7LTrOH2Cxqor7XC0mvfZ+YcLZW8NKWOrqyR4X+2p41j0/wGmhblN3qEg+XPKoOc18PxoHVgTggcV6D8aPiW3xW8fXmqAmPT4h5NqpP8I/iPpmvPg21uK58TPnndHxvE+YLH4uXLshvknrmlWP5hg8+9WYbWbUJkgs4mubiQ4WOMZP0r0/wd+zf4l17yrm7UafDnnzDtbFZQjOR4OGwNXFfBE8oaPrkEKO5qJsDvmvcfiF+z8nhfSVhiEst4yNLbXG8kOy8vCR0yR0NeIrEPLJLc43AegzjB961lCUXqGKy+phPjQyiilTG7npip3PNQSMsMZY5bsAO57V9/fsj/DdvCfw4hvLrI1DVD9omLLzj+EfgK+Ovgv4El+I/xF0rSvKJtY5BPcMB0Qc1+nGj6fHYWsVvGNqRoqKo6AAV3Yam4q5+v8E5dzSliZrToXIbYR5wc5OTU68DFG3biiu4/Z9LDZDxivH/ANqT4mQ/Cf4N+IdZeQLcSW7W1uucEyOMDFeuzMB9QM4r4f8A2qtSk+On7Qngv4U6ezS2GnzLeap5fIyDnB9sV00I88k+xmz039g/4Vv4D+C0Gp36MNY8QSnULlnHzYblRn0r6XgjESbQc81n6Hp0Wk6bBYwARw2qLEiAcAAYrTXpWVWo51HJlx2FoooqCwooooAKKKKADsarXCnymwMnpzVhvumopM+U2OtTfUiR8JeJYf8AhmH9tO21zLW/hXxkoSQ4+RZDx+BzX3LbyCeNWDKynncvcHkGvAv2yvg7L8Vvg/qJsTjW9Ib7dYyKMtleWWpv2Mvi+3xa+DmmTXMgGraZ/oN5Eww4ZOMn8q7Jv2kFPqRezPeyuD1pKXOeaSuON9zVCbd3U4xXOeLtN3Q/aEzuXr9K6MjNRXUIuIWRhkEYr5XiTK4ZvgKmHkru2h00KvJNWPMslsg/hW/o10l1ZvaSEbsYFZOo2L2Ny6EERknGagtpGjukdThk71/GmDqTyHHzoVlaL0Pp5Q9tDmiS3Fq1nMY5OFB+UnvUQ9K6BnttetlViEnXseMVlXWm3Fq2NhdfVRWma5BUqTWIwUuaL10M6VblXLIv+Ff+PyX/AHax78n+0Ju43GtvwvC63Uh2MMr3GKxr61n/ALQmARixYngV9BmWExFTIKFNQd7sinUj7dshTKjA/M1p6LYm6nWWUfu4/mzjg0thos82HmxHFnv1qxq2ppaw/ZLYgcYLdhXlZXlKyx/X8fstl1ua1ajqS5IFHXNR+3XjKv8AqYxgEdzVNeFFRxx4xyT3PvUoXtXxua415liXXb7ndTpqnFRR03gpiqS/WoviT8MdF+KGlQafrcbTWsUyzhFbALD1qx4JjDLNz3IrnPjj8Vz8I/CLat9kN85cRpCpwcnpX9qcBr/hDpSfZ/ofA5zWpUlJ1PhNy6udC+G/h8EyW+mabarxnChcV8TftBftHXnxOvH0fSd1noMbkEc77ph3OP4fauE+Ivxb8SfFHUGu9XvWjteqWEXyxqPRvU13XwT8AaXrHg/VPEVsq32uafIN1pJ83lRA5d1XuducH2r7mVX2v7uGh+L4zOJ5nN4LBO0TzfQ/hvr/AIkm2WWkzbmH33XYDnoTnt9a9C0f9k3xVqUam7v7HTSf4WYu36cV9R6TY6Zb6XbS6QFnsrpBNFODlmXHJLf4/lWzbyb1xtXbjhSOV98dalUFF6o6MPwzQppTqu9zg/h78HND8AWCCGyjm1ODKy3Mg3Etjgiu4TZI4TKiZACQ4wD6gehq9b3sUkP2maTKL+7mC/3ScBvwNQ31iLOZvOAjODtYfxD1HtXSko7H11DBU8PH90rGR4s8N2vivRZtPd2juGAkgmU42TLyp/pXw/8AErw2+j3xvxB5FvdzOk0GMfZ7lTh0P+994exr7sV02qkykhhw2en+1Xj/AMdPA0GqWj3X3Le+2w3bBciGcf6qf6N90n6VzYiLlFeR8znmW/WqDlDdHx3uBY4pTtVSzBmUc7V6n2qxNYT2V3cW1zGYrq3cxTIRwGHce1d/8AfhnJ8VPH9ralGXTbJvPu37FQeFB9Sa44xcnY/KMHgJ4nEqgkfU/wCx38Jm8J+GZddvo8alqnzruH+rj7AV9IwR+XnvVLRtPi061S3hAWKNQiKvYCtFVxXsxvypM/pvK8HHA4aNFLYWkZsdOlLUNwxXaF4PPH9aG7Hrs5v4keMrXwD4M1fxDeyJHb6fbPN8/wDEQOB+dfKf7CPg298U6h4p+L+tBkv9fuGSyWQfdhz1GaZ+3R42vvH3iDwv8F/DjmXUtWuEuNS8rkpCG5UkdMivrPwD4UtPBfhPS9Cs0WK3sIEiVV9gM5/Guxfu6NurMHvY6K1X5CT1JzU9MjjEa8En60+uU1iFFFFBQUUUUAFFFFABSbRS0UBoVru3R7eRCo2MMOD3Hevg3S7iT9kT9rS4tLkmLwV40m3xkf6uKQ9B7c1973AzCwPSvn/9r74Hx/GD4V3S2KY1zSVN3YSr94MvJA+uK3w8l7TknszOa7HusL+aqMsgeNhkEdCOoNS7eOtfO37FfxyPxb+GtvZam7J4l0QfY76KXh/l4BxX0W1Zypum3F9C1JbDKUcUlFS37pVkncw/EmkreW5kRcyryBmuJ8vaxX+JTzXqDqrcE4NcX4o0j7CyzRJtV2y7D+dfzj4jcL+2h9fw8dVvY9vAYpxlyPYxVyjAg4Yd60YPEE9vjzCHQcYrLGQSDT2UHgiv50wubYrL5NUptW6M9qdGFTc2ovFwjJxbZ9waY3ihdxYW4Vj3zmsbyUDZAwaPKXOcV78uMcwqUVSclp5GX1SmtS7c6tcXikNJtQ/wrxVHyhtx0Gc08YHSivmcXmWIxq/ezbOmEIx+FBQKKNr/AHiPlzXLRoTlrGF0VdfCzqfBP+rn+teL/tyqP+FWxMMgi+iwRXtHgnBSbH96vGP25f8AklSA/wDP9F7etf3HwPdZHCL7H5XxYv8AYqp8JiRgxHqea7v4P/Eab4a+OINWj3CxcCK8hJyrR5wW+o61w8EDzyNGkUkzIMkwqW49fp705JjtHy4YnheOfbPpX01OpKm+Y/mXCyqYOpHELY+9PD9xaaFrUOm2rq2g6ur3mkOOkZPzPGPqTkCuiGWDsOH9sgZ9K+c/2ffG0fjHw9eeANQm8vUrZjcaNdSHDI45Cg+x4+le/wDhfWW8QaMbvUJYrS7scwalE5wIpV4J+h6ivZjetHmR+35fjY4yjGSfr5GlDIEEbKgK/wB3b1Hce9bHz31j5cZ3ywphB6qff2rgtU+INvbwmWwitLXTwMf2prEvlRnHUpGOT+PWuB1745eHFhMdx48xwQbfR7TYHB6qG7Z9aXNy7nXVzDD4dPnkj07VPEWmaXdPaxLJrOq4w9nYMNsY9Hc8KPauF8afF3R49Ov9P1rUdL06G4jMbWln/pE+PTPQEV82+NfjJqWvRS6dokbaBoKtxBCcST/7Uj9WNee7QuZWzyfmbqfc1zTr9EfB5hxIreyorc6rxpfw+JvFhbQY7i4juNlvAJlHmSYGMkCvvH9nP4R2/wAMvCEMEqBtUuFE93Ieu4j7v0FeJfsf/BM6ldJ4z1e3/cISunwyjqB/Hivs5YVjzhcNjn3roo018TPpuF8naTxtdWb2EiUQsxT+LrU8bFic1Fmnw9Sa6T9LQ9m298VzPxC8XWXgbwfqevahKqWtjA0x3HG4gZA/OuiuWKKG6AV8PftieNtR+NHxG0H4I+FpZJjNIsusXEJ+VEz0J7cVtSp+0lZ7Ihtl39ivwlffEzxl4m+NXiKKT7bqU7RabDKuAsYP3h+FfalpCkakLk896534eeDbLwH4P03w/YKq2thAsACjHIGCfxrqI0CdKK01ObcdgsPopB3paxLiFFFFBYUUUUAFFFFABRRRQAjKGGCM1XuIVZT/AC9farNMdA3UZ71Er30E9j4G+LGl3X7Iv7Sll8QtIikXwf4jkEeqQxD91GzHljX3DoGsWuvafaX1lcC6tLmMTRyA5BUjIIrmvjR8K9M+Lvw71TwzqMamO7Q+W+3JSTHykfjXzR+xh8UtW8DeItU+Cnjlmh1fR3K6Tczt/wAfMAPCgnvivQk1WhfqjGK1PswgBjRSbtxUgEA54NLXEjcMDjPaoL63S7gZJBuUjFT0Vx4qhHEUnRlsx3cXdHnOqaW+l3GGz5bfdNViwbp2r0PUtPjvoSrKC3avP76xfT7pkb+LkV/GvHPClbKa7xFDWDZ9Pg8Qpq0mV5GKsAPSm729aRzzzSV+RXZ7MdiaPJXJp1Nj+7TuasYRblbd9/ac7T0I711f9m22paWvkAKSMriuUx6Vt+GNS+z3H2dyNjciv0vgzF4b28sFilpM8nFwnf2kS34P3QtcwsrIyvtOa8a/bi/5JVGp5Jvohk19EQ26RSPMo+aTAxXC/Fr4cW/xOsNO0+5ZfssF6lxNG4zvVe341/X2SYD6hg1h4PT9D4LN6TxlGcH1PD/2VvgzDoHhW88S+IbVftOoglUnX/VRD0HoRXzj8ZL7w/qHxB1H/hGbNLPTonMZaPASWQdSor6m/aq+LMXw/wDCMfhvSP3eo30fkhYzgwxAYyK+HeJOE7HJPqe5r06zjFch+H8RSw2GpQwdHVrdlzSNavfD+p2mpWcpju7WQSxMPUdvoa998aftAaTJpdrq2l2zXHiK/t1N9bjiBJFGBIy92Havnrjpikj3F3Zh8xH3vWuaGIlTVkfKYTNq2Dpypx2Zc1rxFqPia+mvdRvpbudjlvMY4+gXtiqMXGAQMZz0603YBzjmpVUcZ4GeTUSquWlzy62JqVnq2OZW65JT+7XpX7P/AMG5fi54qTzI3Gj2bhrqTBCv6IPXNc54A+H+qfE3xJBomlhlWQhppsf6qMdz9a/R/wCF/wAO9L+G/hmy0nT4lRI1+Z8fNI3ck110aLfvH33DGQyx1T21f4Ubvh/S7bQ9MtrG1hWCCBAkcajAUCtZV3Nk80vkjP3eadt2+1eitz98pU1SiodEG1fSk246DihicVS1K4WG1eSSbyEjBd5PRQMsa09DU87/AGhvi9YfBX4c6n4lvJA9zFEyWdtnBllIwuPUivGP2FfhDfw6Xq3xQ8UxGXxP4mczqZuXhjP8P415rrkt5+29+0VFpsBY/DfwrMJJJCcpPIp/XOK+99FtbaxsYrW1iWC2iQRxxqMBVAwOK6m/Zw5V1IS1LUMIjXgY4qUDFCqFGBwKWuRKxTEHelpB3paYohRRRQWFFFFABRRRQAUUUUAFFFFAEV1/qTXyZ+2p8EdU8QaXZfErwYnk+L/DZE4WMbXnjH3uR1NfW7VUvkVrdgyq6nghxx+Iq4ScZXQrI8j/AGaPjpZ/HPwHaagjiDVrWJYdQsm+/HKBgnFevYwK+B/i14T1f9jX4xRfE3wnGW8E6zOE1fTsnETMcscdvWvtzwL4y0zx94bsNb0m4W6sLyISxspBA9q1qwUfehsyG7M26KkkA4xTKwVjQSsnXNFi1SInG2QDg1rUvrXhZpllHM6MqFWN0zSFSUJXR5jcWstrM0Uo5B4qPaPSu31vRU1BGZflkAzkVxktvJbSMkowRX8YcW8I4jJsS5UovkPqcLiVWiovcZwOgxRij2o21+dbHqLRWI2J3GmmRl/1Z2v1De9TYFIF54+uK2w9SpTxCnS+ITs1qd54d1D7dYpvOXAwTWR8QPGOn+BvDd7rGoSrHBBGSS3UkdFHuas+ELNo7d2bgMcivOP2rPA9945+FV5a2GWubeRbkIP49nOK/vfhSrXrZXTqYj4rH5lnkpU6U3RPg3xl4xv/AIgeLdS1u8kkZ55CUVzny4+yj04rn1wGbAxSxSPDv3jbJkhh6N3FC/ezivTk9T+U8ZWqVa85TEyfWgEsQCxo5ox+dTY4PUl8vHPNavhXwzqPjLxBaaNpkDTXty21QoyEU9Wak8K+HNV8X61b6RpVuZr+ZgF28hFPVm9q+/8A4A/AfT/hPpKMVW51idd090w591B9K2oUHN3ex9rw/kE8xqqU17qND4H/AAZ0/wCFHhuG0gjV7xwGuJ25dm9M+lepqo4IHK9DSqgLDgflUsg4yBxXtcqjHlif0Lg8HRwdJQpxItx9TUkJLMc9KZTWYIuSQvvWZ29Bbr7o+91/hr5J/bT+NuoW7WXws8Fs1z4u1xgkzQn/AFEJ45I6HFev/tDfHTS/gb4ButdvDvvvmisYM/NLMRxx6V4r+xp8EdUuLy/+LPjlPN8Va6xmtY5wT9mjY5GM9OK76FNxi5z+Rkz279mz4J6f8EPh7baLCqSX0oE15NgbmkPJBP1r1wKq8gYNVbePaz4OR61aFc0pNyuNPQXNLRRQAg70tIO9LQVEKKKKCwooooAKKKKACiiigAooooAKRlBHIyPSlooId7nLfELwnpXjjwrf6HrMCzafexmJ9y5xkda+IPhx4s1v9h/4rDwN4okef4caxLnTtTOStuWPAJ7Cv0CmjDL8wyPSvMfj18E9D+OHgW60DVoVEpB+yXAHMMmOGralVV+SexPL1PRNOvYL2JZYXEkciB0cHKup5BFXNw9K+Hf2cfjZrHwT8XN8HvijdMtxA/l6Rqs3CSpnCqWPtX2xZYXdh9yt8w5z1/pWdalKk/IFLWxPN24qP8Ke7ZI70z8DU7I1CsnWNHS+jyFG+tfafSjaa8HNcsoZpQdKqjSnUlTd4nmt7ZyWchVl2jsag6d816DqWmxX0bRsPnYfjXDahp7WFwV5ZOzV/InFnBFfJ6jxFBXhc+mwmMjU0kV+4qxpdjJfXQULxnmqwzwQCWzwvrXYaLarptj5snDsNxz2ryeEcmWOxjr4hWhA1xNfkjaO5uWUaW8CKowAOlMvmhZRHKyDzOFVyOT6VleHtSbUZp5GOUJwB9K8f/a78T3vhHwXpusac5S4stThlHONw7g1/ZeUV6FfCReH+FaHw+Pqxw1OU62x82/tQfCP/hXfjY6jbpjSNWZmUKOI5eteMw8df1r9B9YsdJ/aQ+EMUiMp+0QiSOTjdFMBz9Oa+AdY0W78O67e6VeQMtxauVdW4JwccV216PK+eJ/PnEmWqnU+sUPhkV/LLZOMfhWz4J8H6t8QvEEGj6NbvPcStjfjiBO7sf6Vs/DH4U+IPifq62OmxGKyVh51+wysSn+Eepr77+EPwZ0f4V6HHaabCrTNzcXTD5pGqaNF1Ny8g4cqY6XtKvwmP8EfgNpXwr01GWJJ9VkX9/dY5Y98V7DDGEwMUqR4Xp+lKvWvVinFKMT93wWCpYGmoUo2JPwooprn5T+lXY9F7Ct9K5rx74q0vwT4V1DXNYnWHTrNDJKxIGcdBWtqt5b2Omz3N1MILWFC0sxYARqOSSa+CvGPiPxB+3J8Uv8AhEfDkj2fw10a4ze3HIW7KnBBPvW1CPNe+yMpXtoT/DHwrqn7aHxcPj3xRC0PgLR5Sum2LAhbnB+Ukdx3zX3pYwx28McMaKkcahFjUYCAcYFYngnwhp3gXw/Z6HpNsttp9lEIolUYzjvXRJSrVuZqK2GtiRQOeAKdSLS1mAUUUUAIO9LSDvS0FRCiiigsKKKKACiiigAooooAKKKKACiiigAqvcK7qoC5HOasUUAeG/tNfs46X8ePCP2cqtl4hs18zTtQRQGjcc4z9a8g/Zd/aO1Lw74in+E3xUlaz8VWMnlWeoXHyC6iHAJJ/T1r7MmQsVx1rwH9p79mPTfjho8NzabrDxZZDdZalH8r5HIDHvz0ropTjL93UM7a3PebeSPDAEBe1TKyt93mvjP9m79pzUdF14/C34pRnS/E9i/kWmoXOQl0OwJPc19iWsifN8wz161zVqUqZasWaRpAq5JApjTpzhxwM9a8R/an/aE0/wCBPgmW8+S41y6HlWFrnqxH3yPQetOlTlVnyRJk9DzT9tP9q2X4UxxeGfCV5F/wlVwVeSZiCtqmRw3ua3P2XP2nLb9obSptE1Kyay8VafHm7UJ+5lXoHDdjXwHfaFqF14L1r4o+MZ3nvdXnNvpKXGf9InJy7+6IvT3r7k/YH+F6+AfhLN4i1JBbX+uv9qLygBkiX7oY+45r18xyrBVsB7OrHmbMqVWcZXPddQ0ebSZllhbzIs8Fhkg1Dfa099CLYjY/crXmXiD9uD4baT8SIfCkly9xEW8qbVY+beF+mN3pXr95pllqtjHeadcRXEcq7kmhbKsD3BFfzRxNwXmGXwlXy33Yy6HuUcVCTXP0J/BDfupMDHNeL/txf8ksA/6fYuK9r8G28lrDIkgKuH7+nrXj/wC2bpNzrXw2t7awgkvbqW/j2RQqWZuewr9A4Mw9Sjk8Y1V7x8pxKniMNONLc+X/AIO/HrUPg9b6pbCBr6xnXdbxM2NrfSux8D/B/wAT/tGeJ5PFHiWP+ydIkIIKptd1z0rvPgf+yGmmywa14wBu7770dmR+7TuMj1r3H4v+Mj8HfhbrXiHTtO+3NpluClqvyqO2foK+3oUZStGR8JlGS4jEQX153jE6Pwj4F0rwLpNtYaTbRW9ugAVVGPxJ7mumXqMdK/M/4d/8FBvFWi+KvtHi23Gp6FeyZktoVw9t7oe4Fff/AMO/iZ4b+KWgxav4b1SO/tHALIrYkiP9116g16VfC1MLvE/RcPCFGPLSjaJ2/mAUvmbvSq25W6HIpRgcnpXBFuT0Oy5OzBVyTgVXvrhIbd3eRYkQbmZiAFA7mm3EqrbyEyLGAuSzdFHqa+Jf2hfj7rfxk8WN8IfhW0l3JLIItW1aEEiNO+GHauunB1JGZn/Hb4xeIP2mvHEnwh+GbSDSlfZrWqwn5QgPzAOOK+tPgv8ACHQ/gv4NstA0SBVWNAJp9vzzOByzGuf/AGevgDo/wM8Kw6ZYW6vqEgzfXjr80r4z19M17D5e1R2NVWmvhp7F20ClWm4PpSrXIt9SB3FLmiitADNGaKKAEHeloooKiFFFFBYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVHMDjpkd/WpKKiS6oDwT9pj9mXRvjxpEUqj+zvFFkDJY6lH8rBhyASOteOfAj9pzXfhr4qi+FnxihbTdUiPl2GtSAiKdAcAMx9fWvte4h8zBxkCvKfj1+z34d+O3hifTNZh8q92/6NqEYxLA3bB64zW1Oo5e5UM2rao7fXtUXS9Du9Vt7eTUobWBriOC35aYgZCr65r80vDfg/wAVftqftAahqGuRXWn6FYz4u45QVFrCDxCB/eOOcV6z8Pfjj4z/AGTfE1v4E+K0Ut74VMnk6br2CxRDwu8+lfV91Daav4B1e58DyWK3WrW7yQXdsoCySsOGJHf6130+bCttLfqRJ30Pzu/aG8S6J8SPjfo3g2C6g0bwB4VZLIyE4VUXmU/U4x+NdH8Qv2hPF/7QGowfDv4Y2c2i+EbWHZLPjaXt0GC8knSNcD6muP8Ah5+x78QfiN8Rr7S9bs5NGtLa5J1G/nHE5JySnrmun/aD8V6D8M9Li+DPwrhaJppBHq17a8zXcn/PLf1wfyr3rU3yQpata+RNrHiVj8Nn8ZfEK08H+CpZNXupD5LXWMxtk4eUf7I5xnrX6z/Bn4XwfCL4daR4YhuLi/8AscYElxO+5nkP3vwryj9jv9mWL4LeDxqupQRyeJ9UjWSTAz9mUjhFP0r6VhXYiqMkAY5614uaYr6xLkWyCEeVjYbYgBioVu9QTWKy8yRB2ByCQDt+nvWhnAFJ+FeFShGkuWCsazjGW6IY1I6A4rlfip4cHiz4d+JNHKFxeafNGox0baSP1Fdj+FRPh+GHB4IrojJxlcPsn5Vfsf8Aw38PfFq68X/DvxRCsk0kHn2t1H/r4pEYq2z6HqKwPFmn+Nf2M/ids0LxBBcuv7xPIlykqZ+7MnY4qp4tg8TfCL9pLxdZeEp5bPWpr6W1hEZwSs5yAp7da+lPgj+wTPdXf/CT/FK9l1rUpv3o0l3O0N1zK/c19hWrqnadZ3jKOxFNKx6x+zr+2B4a+MkMOnajJHoHifChreY4juD32E19EXF9DHbSSmZEjUEmR+FAHUn2r4V+JH/BPnSLXxgmuaJ4o/4RTwpExnvYpWO+A9SYnrM8QfErxb+0lrFv8I/hddX6eEtMRbTVPFVxnzJ1HXDehxXz9WhRqTTpOyG2dL8cPj74h+Ofi9/hR8I5Wk3SCPVdaTOwL3AbtX0L+zn+zzofwF8NxWNlF9p1eVd19qMgy8rnkgH0q18Cf2fvD/wH8OwaZotsr3DjddX0gzLK/c5r1hVCn3rmrVEl7OC0HEeV9OaX60UVzmoUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUx13Z9CKfRTA4j4mfC3RPirodxoviLTo9QsJk2hiB5kTf3ga+Kryz+I37BfiLzYRceMPhddS82y5eW3BPb6V+hTDJrO1jR7fWrWa0vbaK7tJkKtFMoIOa2pVnT91q6Iauec+DfiN4e+O3gGa78Ka35Ut7atEDGR59m5GOV68GvCf2cf2Kpvh38RNU8V+MruPXL2GVl06X728Mcl2B71mfFb9lHxL8IfEV147+Cl7JYXQImu9EV8pMBywUHqTzXoX7P/7YWhfFIrofiIf8I14zt28qewvBsDsP7ue59K6P3lOLnQe4tEfStvxGudvTHy9Kk61DHKPLUHg9cD+dWI2DKO4rz3LWxC3HCijdRu9qLo3D8ahf5QRUpOBkioJJlZQc5z29fpRzIG1ax+dn7WHwq8TS/tcaLqHhTRbjUZtQjhvdyKRFvjYZ3N0Xivt7xd8TNG+HHg99b8VXcOlwxQgyq7/ffaCVX1OeK4L4+ftNeFvgnpubll1HxG6MltptuN0jNngMR90V4D4F+A3jz9rDX4vGfxcmk0zwsHD2Hh1SRuXPDMO1epUvVhF1Nkc8Sheap8Qf28PEyWdilz4R+FltNtkmHyy3QB7eua+y/hX8I9D+EHhu10Lw7ZR2dnEP3spH72ZvVjXQeG/Clh4P0mz0zSLOOz062UIlvGAMe9bm09a4K1bmXLBaGkYjcAfWnL1ox2pQMGudDW46iiitCwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKQjNLRQTYqTW7vNk4K9q8A+P37IPhz40TNqlsn/CP+KoP3kGqWXyMzgcbsV9FU0rk/wBaOecHeIcp8GeGv2gfiP8Asva5beEfi1Zy6/4b3+TB4lgU7ol7Fj3r7L8E/ELw/wCPdDg1Tw9qUWq2LoHEkLAkD3FTeMPAuleO9JudL12yt9SsLhdpimQHH0NfHPjL9lbx5+z9rE/in4LavLJp6OZZvDszEqV/uoO9dFoVlfZk8p9xrcRugcHKnoaGmVVzg/hXy18D/wBtrQvHV5F4d8a2sngrxfGfKe2vBtjmYcfLmvRvjP8AtJeDPglo7Xur6gt3eOmYtPtGDTSntj2qfYSTtYm7PVLrWbSxs3u7mYW9qgLPNKQqrj1Jr47+LX7ZWqeMNefwT8FtPk1zWZGMU2tiPdFbHodvY1ytrpfxf/bYvPM1N5fAvw4blIUJjluVz/MivrX4R/Afwv8ABfQY9L8NadFaqAN92y5mc9yTV8tOlrLctK6PFvgH+xvD4X1RvGHxBuv+Eq8Z3GJX+0tvjibOeAa+pobNlKdFVeirwB7VN9nJ9MdwKmxjpWFSpOpLXYcYqOw79aKKKkoKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqq8ZMhBb5fSiisnuB4v8cv2ZfBXxo02aXU7FbLVIAXi1K0ULMreufWvKvgJ+xj4U0y8l8TeINQvPF+pWrlIP7T+ZEUdOCTRRXfGrP2LVxWPrW3sY7e3jWELFGABHGqgLGMdAK0V4Ud6KK827ctRi0UUV0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf//Z';
    
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


// Exportar Incidencias a PDF
function exportarIncidenciasPDF() {
    if (datosIncidencias.length === 0) {
        alert('No hay incidencias para exportar');
        return;
    }
    
    // Obtener valores de búsqueda/filtros
    const buscar = document.getElementById('buscarInc').value.toLowerCase().trim();
    const cursoFiltro = document.getElementById('filtrarCursoInc').value;
    const tipoFiltro = document.getElementById('filtrarTipo').value;
    
    // Si hay filtros activos, usar solo las incidencias filtradas
    let incidenciasAExportar = datosIncidencias;
    
    if (buscar || (cursoFiltro && cursoFiltro !== 'Todos los cursos') || (tipoFiltro && tipoFiltro !== 'Todos los tipos')) {
        incidenciasAExportar = datosIncidencias.filter(inc => {
            const estudiante = (inc['Nombre Estudiante'] || inc.estudiante || '').toLowerCase();
            const cursoInc = inc['Curso'] || inc.curso || '';
            const tipoFalta = inc['Tipo de falta'] || inc.tipoFalta || '';
            
            const matchNombre = !buscar || estudiante.includes(buscar);
            const matchCurso = !cursoFiltro || cursoFiltro === 'Todos los cursos' || cursoInc === cursoFiltro;
            const matchTipo = !tipoFiltro || tipoFiltro === 'Todos los tipos' || tipoFalta === tipoFiltro;
            return matchNombre && matchCurso && matchTipo;
        });
    }
    
    if (incidenciasAExportar.length === 0) {
        alert('No hay incidencias que coincidan con la búsqueda');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); // Horizontal para más columnas
    
    // Agregar encabezado
    let titulo = 'Reporte de Incidencias';
    if (buscar) {
        titulo += ` - ${buscar.charAt(0).toUpperCase() + buscar.slice(1)}`;
    }
    const startY = agregarEncabezadoCENSA(doc, titulo);
    
    // Preparar datos para la tabla con textos completos
    const tableData = incidenciasAExportar.map(inc => [
        inc['Fecha y Hora'] ? new Date(inc['Fecha y Hora']).toLocaleDateString('es-DO') : '-',
        inc['Nombre Estudiante'] || inc.estudiante || '-',
        inc['Curso'] || inc.curso || '-',
        inc['Tipo de falta'] || inc.tipoFalta || '-',
        inc['Docente'] || inc.docente || '-',
        inc['Descripción'] || inc.descripcion || '-',
        inc['Acciones Docente'] || inc.acciones || '-',
        inc['Seguimiento UGC'] || inc.seguimiento || '-'
    ]);
    
    // Agregar tabla
    doc.autoTable({
        startY: startY,
        head: [['Fecha', 'Estudiante', 'Curso', 'Tipo', 'Docente', 'Descripción', 'Acciones', 'Seguimiento']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 58, 138], 
            fontSize: 8,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 7, 
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'wrap'
        },
        columnStyles: {
            0: { cellWidth: 22 },   // Fecha
            1: { cellWidth: 35 },   // Estudiante
            2: { cellWidth: 18 },   // Curso
            3: { cellWidth: 20 },   // Tipo
            4: { cellWidth: 32 },   // Docente
            5: { cellWidth: 55 },   // Descripción
            6: { cellWidth: 45 },   // Acciones
            7: { cellWidth: 45 }    // Seguimiento
        }
    });
    
    // Pie de página con info
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Total de incidencias: ${incidenciasAExportar.length}`, 14, finalY);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, finalY + 5);
    
    // Nombre del archivo
    let nombreArchivo = 'Incidencias_CENSA';
    if (buscar) {
        nombreArchivo += `_${buscar.replace(/ /g, '_')}`;
    }
    nombreArchivo += `_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(nombreArchivo);
}

// Exportar Tardanzas a PDF
function exportarTardanzasPDF() {
    if (datosTardanzas.length === 0) {
        alert('No hay tardanzas para exportar');
        return;
    }
    
    // Obtener valor de búsqueda
    const buscar = document.getElementById('buscarTard').value.toLowerCase().trim();
    const cursoFiltro = document.getElementById('filtrarCursoTard').value;
    
    // Filtrar tardanzas si hay búsqueda
    let tardanzasAExportar = datosTardanzas;
    
    if (buscar || (cursoFiltro && cursoFiltro !== 'Todos')) {
        tardanzasAExportar = datosTardanzas.filter(t => {
            const estudiante = (t['Nombre Estudiante'] || t.estudiante || '').toLowerCase();
            const cursoT = t['Curso'] || t.curso || '';
            
            const matchNombre = !buscar || estudiante.includes(buscar);
            const matchCurso = !cursoFiltro || cursoFiltro === 'Todos' || cursoT === cursoFiltro;
            return matchNombre && matchCurso;
        });
    }
    
    if (tardanzasAExportar.length === 0) {
        alert('No hay tardanzas que coincidan con la búsqueda');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título personalizado
    let titulo = 'Reporte de Tardanzas';
    if (buscar) {
        titulo += ` - ${buscar.charAt(0).toUpperCase() + buscar.slice(1)}`;
    }
    const startY = agregarEncabezadoCENSA(doc, titulo);
    
    // Agrupar por estudiante y mes
    const agrupadoPorEstudiante = {};
    tardanzasAExportar.forEach(t => {
        const estudiante = t['Nombre Estudiante'] || t.estudiante || '';
        const mes = t['Mes'] || t.mes || '';
        const año = t['Año'] || t.año || '';
        const fecha = t['Fecha'] || t.fecha || '';
        
        if (!agrupadoPorEstudiante[estudiante]) {
            agrupadoPorEstudiante[estudiante] = {};
        }
        
        const keyMes = `${mes} ${año}`;
        if (!agrupadoPorEstudiante[estudiante][keyMes]) {
            agrupadoPorEstudiante[estudiante][keyMes] = {
                curso: t['Curso'] || t.curso || '',
                fechas: [],
                total: 0
            };
        }
        
        agrupadoPorEstudiante[estudiante][keyMes].fechas.push(fecha);
        agrupadoPorEstudiante[estudiante][keyMes].total++;
    });
    
    // Preparar datos para tabla
    const tableData = [];
    Object.keys(agrupadoPorEstudiante).forEach(estudiante => {
        const meses = agrupadoPorEstudiante[estudiante];
        Object.keys(meses).forEach(mes => {
            const info = meses[mes];
            tableData.push([
                estudiante,
                info.curso,
                mes,
                info.total,
                info.fechas.map(f => new Date(f).toLocaleDateString('es-DO')).join(', ')
            ]);
        });
    });
    
    doc.autoTable({
        startY: startY,
        head: [['Estudiante', 'Curso', 'Mes', 'Total', 'Fechas']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [44, 90, 160] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 15 },
            4: { cellWidth: 70 }
        }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Total de tardanzas: ${tardanzasAExportar.length}`, 14, finalY);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, finalY + 5);
    
    // Nombre de archivo
    let nombreArchivo = 'Tardanzas_CENSA';
    if (buscar) {
        nombreArchivo += `_${buscar.replace(/ /g, '_')}`;
    }
    nombreArchivo += `_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(nombreArchivo);
}

// Exportar Contactos a PDF
function exportarContactosPDF() {
    if (datosContactos.length === 0) {
        alert('No hay contactos para exportar');
        return;
    }
    
    // Obtener valor de búsqueda
    const buscar = document.getElementById('buscarContacto').value.toLowerCase().trim();
    
    // Filtrar contactos si hay búsqueda
    let contactosAExportar = datosContactos;
    
    if (buscar) {
        contactosAExportar = datosContactos.filter(c => {
            const estudiante = (c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '').toLowerCase();
            const nombrePadre = (c['Nombre Padre'] || c.nombrePadre || '').toLowerCase();
            const nombreMadre = (c['Nombre Madre'] || c.nombreMadre || '').toLowerCase();
            
            return estudiante.includes(buscar) || nombrePadre.includes(buscar) || nombreMadre.includes(buscar);
        });
    }
    
    if (contactosAExportar.length === 0) {
        alert('No hay contactos que coincidan con la búsqueda');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); // Horizontal para más espacio
    
    // Título personalizado
    let titulo = 'Reporte de Contactos de Padres';
    if (buscar) {
        titulo += ` - ${buscar.charAt(0).toUpperCase() + buscar.slice(1)}`;
    }
    const startY = agregarEncabezadoCENSA(doc, titulo);
    
    const tableData = contactosAExportar.map(c => [
        c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '-',
        c['Nombre Padre'] || c.nombrePadre || '-',
        c['Contacto Padre'] || c.telPadre || '-',
        c['Nombre Madre'] || c.nombreMadre || '-',
        c['Contacto Madre'] || c.telMadre || '-',
        c['Contacto Emergencia'] || c.telEmergencia || '-'
    ]);
    
    doc.autoTable({
        startY: startY,
        head: [['Estudiante', 'Padre', 'Tel. Padre', 'Madre', 'Tel. Madre', 'Emergencia']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 58, 138], 
            fontSize: 9,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 8,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 50 },  // Estudiante
            1: { cellWidth: 45 },  // Padre
            2: { cellWidth: 32 },  // Tel. Padre
            3: { cellWidth: 45 },  // Madre
            4: { cellWidth: 32 },  // Tel. Madre
            5: { cellWidth: 32 }   // Emergencia
        }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Total de contactos: ${contactosAExportar.length}`, 14, finalY);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, finalY + 5);
    
    // Nombre de archivo
    let nombreArchivo = 'Contactos_CENSA';
    if (buscar) {
        nombreArchivo += `_${buscar.replace(/ /g, '_')}`;
    }
    nombreArchivo += `_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(nombreArchivo);
}

// Exportar Estudiantes a PDF
function exportarEstudiantesPDF() {
    if (datosEstudiantes.length === 0) {
        alert('No hay estudiantes para exportar');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const startY = agregarEncabezadoCENSA(doc, 'Listado de Estudiantes');
    
    const tableData = datosEstudiantes.map(e => [
        e['Nombre Completo'] || '-',
        e['Curso'] || '-'
    ]);
    
    doc.autoTable({
        startY: startY,
        head: [['Nombre Completo', 'Curso']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [44, 90, 160] },
        styles: { fontSize: 10 }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Total de estudiantes: ${datosEstudiantes.length}`, 14, finalY);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, finalY + 5);
    
    doc.save(`Estudiantes_CENSA_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Exportar Reporte por Curso a PDF
function exportarReporteCursoPDF() {
    const curso = document.getElementById('cursoReporte').value;
    if (!curso) {
        alert('Seleccione un curso');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const startY = agregarEncabezadoCENSA(doc, `Reporte del Curso: ${curso}`);
    
    const incCurso = datosIncidencias.filter(i => (i['Curso'] || i.curso) === curso);
    const tardCurso = datosTardanzas.filter(t => (t['Curso'] || t.curso) === curso);
    const estCurso = datosEstudiantes.filter(e => (e['Curso'] || e.curso) === curso);
    
    // Resumen
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen:', 14, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Estudiantes: ${estCurso.length}`, 20, startY + 8);
    doc.text(`• Incidencias: ${incCurso.length}`, 20, startY + 14);
    doc.text(`• Tardanzas: ${tardCurso.length}`, 20, startY + 20);
    
    // Desglose de incidencias
    const leves = incCurso.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Leve').length;
    const graves = incCurso.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Grave').length;
    const muyGraves = incCurso.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Muy Grave').length;
    
    doc.text(`• Faltas Leves: ${leves}`, 20, startY + 26);
    doc.text(`• Faltas Graves: ${graves}`, 20, startY + 32);
    doc.text(`• Faltas Muy Graves: ${muyGraves}`, 20, startY + 38);
    
    doc.setFontSize(8);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, 280);
    
    doc.save(`Reporte_Curso_${curso}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Exportar Reporte Individual a PDF
function exportarReporteIndividualPDF() {
    const estudiante = document.getElementById('estudianteReporte').value;
    if (!estudiante) {
        alert('Escriba el nombre de un estudiante');
        return;
    }
    
    const infoEstudiante = datosEstudiantes.find(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    
    if (!infoEstudiante) {
        alert('Estudiante no encontrado');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const startY = agregarEncabezadoCENSA(doc, `Reporte Individual: ${estudiante}`);
    
    const curso = infoEstudiante['Curso'] || infoEstudiante.curso || '';
    const incEstudiante = datosIncidencias.filter(i => {
        const nombre = i['Nombre Estudiante'] || i.estudiante || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    const tardEstudiante = datosTardanzas.filter(t => {
        const nombre = t['Nombre Estudiante'] || t.estudiante || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    const contactoEstudiante = datosContactos.find(c => {
        const nombre = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '';
        return nombre.toLowerCase() === estudiante.toLowerCase();
    });
    
    let yPos = startY + 5;
    
    // Curso
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Curso: ${curso}`, 14, yPos);
    yPos += 10;
    
    // Estadísticas en formato de tarjetas
    const leves = incEstudiante.filter(i => (i['Tipo de falta'] || i.tipoFalta) === 'Leve').length;
    const graves = incEstudiante.filter(i => {
        const tipo = i['Tipo de falta'] || i.tipoFalta || '';
        return tipo === 'Grave' || tipo === 'Muy Grave';
    }).length;
    
    // Fondo de color para las estadísticas
    doc.setFillColor(220, 53, 69); // Rojo para incidencias
    doc.rect(14, yPos, 40, 20, 'F');
    doc.setFillColor(40, 167, 69); // Verde para tardanzas
    doc.rect(58, yPos, 40, 20, 'F');
    doc.setFillColor(0, 123, 255); // Azul para leves
    doc.rect(102, yPos, 40, 20, 'F');
    doc.setFillColor(108, 117, 125); // Gris para graves
    doc.rect(146, yPos, 40, 20, 'F');
    
    // Texto de las tarjetas
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Incidencias', 34, yPos + 6, { align: 'center' });
    doc.text('Tardanzas', 78, yPos + 6, { align: 'center' });
    doc.text('Faltas Leves', 122, yPos + 6, { align: 'center' });
    doc.text('Faltas Graves', 166, yPos + 6, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(incEstudiante.length), 34, yPos + 15, { align: 'center' });
    doc.text(String(tardEstudiante.length), 78, yPos + 15, { align: 'center' });
    doc.text(String(leves), 122, yPos + 15, { align: 'center' });
    doc.text(String(graves), 166, yPos + 15, { align: 'center' });
    
    // Restablecer color de texto
    doc.setTextColor(0, 0, 0);
    yPos += 28;
    
    // Incidencias Registradas
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Incidencias Registradas:', 14, yPos);
    yPos += 5;
    
    if (incEstudiante.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        incEstudiante.forEach(inc => {
            const fechaInc = inc['Fecha y Hora'] || inc.fecha || '';
            const tipoFalta = inc['Tipo de falta'] || inc.tipoFalta || '';
            const descripcion = inc['Descripción'] || inc.descripcion || '';
            const fecha = fechaInc ? new Date(fechaInc).toLocaleDateString('es-DO') : '';
            
            // Verificar si hay espacio
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${fecha}`, 14, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`- ${tipoFalta}:`, 45, yPos);
            
            // Descripción con word wrap
            const descripcionLineas = doc.splitTextToSize(descripcion, 150);
            doc.text(descripcionLineas, 14, yPos + 4);
            yPos += 4 + (descripcionLineas.length * 4) + 3;
        });
    } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 167, 69);
        doc.text('✓ Sin incidencias registradas', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
    }
    
    yPos += 5;
    
    // Tardanzas
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Tardanzas:', 14, yPos);
    yPos += 5;
    
    if (tardEstudiante.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 167, 69);
        doc.text(`Total de tardanzas: ${tardEstudiante.length}`, 14, yPos);
        doc.setTextColor(0, 0, 0);
    } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 167, 69);
        doc.text('✓ Sin tardanzas registradas', 14, yPos);
        doc.setTextColor(0, 0, 0);
    }
    
    yPos += 8;
    
    // Información de Contacto
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Información de Contacto:', 14, yPos);
    yPos += 5;
    
    if (contactoEstudiante) {
        const nombrePadre = contactoEstudiante['Nombre Padre'] || contactoEstudiante.nombrePadre || 'No registrado';
        const telPadre = contactoEstudiante['Contacto Padre'] || contactoEstudiante.telPadre || 'Sin teléfono';
        const nombreMadre = contactoEstudiante['Nombre Madre'] || contactoEstudiante.nombreMadre || 'No registrado';
        const telMadre = contactoEstudiante['Contacto Madre'] || contactoEstudiante.telMadre || 'Sin teléfono';
        const telEmergencia = contactoEstudiante['Contacto Emergencia'] || contactoEstudiante.telEmergencia || 'No registrado';
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`• Padre: ${nombrePadre} - ${telPadre}`, 14, yPos);
        yPos += 5;
        doc.text(`• Madre: ${nombreMadre} - ${telMadre}`, 14, yPos);
        yPos += 5;
        doc.text(`• Contacto de Emergencia: ${telEmergencia}`, 14, yPos);
    } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 193, 7);
        doc.text('⚠ Sin contactos registrados', 14, yPos);
        doc.setTextColor(0, 0, 0);
    }
    
    // Reuniones y Acuerdos con Padres
    yPos += 10;
    if (yPos > 230) {
        doc.addPage();
        yPos = 20;
    }
    
    const reunionesEstudiante = datosReuniones
        .filter(r => {
            const nombre = r['Nombre Estudiante'] || r.estudiante || '';
            return nombre.toLowerCase() === estudiante.toLowerCase();
        })
        .sort((a, b) => {
            const fechaA = new Date(a['Fecha y Hora'] || a.fecha || '');
            const fechaB = new Date(b['Fecha y Hora'] || b.fecha || '');
            return fechaB - fechaA; // Más recientes primero
        })
        .slice(0, 5); // Últimas 5 reuniones
    
    doc.setFillColor(76, 175, 80); // Verde para reuniones
    doc.rect(14, yPos, 40, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Reuniones', 34, yPos + 6, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reunionesEstudiante.length.toString(), 34, yPos + 15, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 25;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Reuniones con Padre/Madre/Tutor', 14, yPos);
    yPos += 6;
    
    if (reunionesEstudiante.length > 0) {
        reunionesEstudiante.forEach((reunion, index) => {
            if (yPos > 245) {
                doc.addPage();
                yPos = 20;
            }
            
            const fecha = reunion['Fecha y Hora'] || reunion.fecha || '';
            const padrePresente = reunion['Padre/Madre Presente'] || reunion.padrePresente || '';
            const nombrePadre = reunion['Nombre Padre/Madre'] || reunion.nombrePadre || '';
            const motivo = reunion['Motivo'] || reunion.motivo || '';
            const acuerdos = reunion['Acuerdos Establecidos'] || reunion.acuerdos || '';
            const estado = reunion['Estado'] || reunion.estado || '';
            
            // Número de reunión
            const numeroReunion = reunionesEstudiante.length - index;
            
            // Título de la reunión
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Reunión No. ${numeroReunion} el ${fecha ? new Date(fecha).toLocaleDateString('es-DO') : 'Sin fecha'}`, 14, yPos);
            yPos += 5;
            
            // Información básica
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Presente:', 14, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(nombrePadre || padrePresente, 35, yPos);
            yPos += 4;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Motivo:', 14, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(motivo, 30, yPos);
            yPos += 4;
            
            // Acuerdos
            if (acuerdos) {
                doc.setFont('helvetica', 'bold');
                doc.text('Acuerdos:', 14, yPos);
                yPos += 4;
                
                // Separar acuerdos por líneas o por números
                const acuerdosArray = acuerdos.split(/\n|(?=\d+[\.\)])/g).filter(a => a.trim());
                
                acuerdosArray.forEach((acuerdo, i) => {
                    if (yPos > 275) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    // Limpiar el acuerdo y numerarlo
                    let textoAcuerdo = acuerdo.trim().replace(/^\d+[\.\)]\s*/, '');
                    
                    doc.setFont('helvetica', 'normal');
                    const acuerdoFormateado = doc.splitTextToSize(`${i + 1}.${textoAcuerdo}`, 175);
                    
                    acuerdoFormateado.forEach(linea => {
                        if (yPos > 275) {
                            doc.addPage();
                            yPos = 20;
                        }
                        doc.text(linea, 14, yPos);
                        yPos += 4;
                    });
                });
            }
            
            // Estado con color
            doc.setFont('helvetica', 'bold');
            doc.text('Estado:', 14, yPos);
            
            if (estado === 'Cumplido') {
                doc.setTextColor(21, 87, 36); // Verde
            } else if (estado === 'En seguimiento') {
                doc.setTextColor(12, 84, 96); // Azul
            } else {
                doc.setTextColor(114, 28, 36); // Rojo
            }
            doc.text(estado, 30, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 8;
        });
    } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(76, 175, 80);
        doc.text('✓ Sin reuniones registradas', 14, yPos);
        doc.setTextColor(0, 0, 0);
    }
    
    // Pie de página
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, 285);
    
    doc.save(`Reporte_${estudiante.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==================
// FUNCIONES MÓDULO REUNIONES
// ==================

// Autocompletado para Reuniones
function filtrarEstudiantesReunion() {
    const input = document.getElementById('estudianteReunion');
    const sugerencias = document.getElementById('sugerenciasReunion');
    const texto = input.value.toLowerCase().trim();
    
    if (texto.length === 0) {
        sugerencias.style.display = 'none';
        return;
    }
    
    const coincidencias = datosEstudiantes.filter(e => {
        const nombre = (e['Nombre Completo'] || e.nombre || '').toLowerCase();
        return nombre.includes(texto);
    }).slice(0, 20);
    
    if (coincidencias.length === 0) {
        sugerencias.style.display = 'none';
        return;
    }
    
    sugerencias.innerHTML = coincidencias.map(e => {
        const nombre = e['Nombre Completo'] || e.nombre || '';
        const curso = e['Curso'] || e.curso || '';
        const nombreEscapado = nombre.replace(/'/g, "\\'");
        const cursoEscapado = curso.replace(/'/g, "\\'");
        return `<div onclick="seleccionarEstudianteReunion('${nombreEscapado}', '${cursoEscapado}')" 
                     style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;"
                     onmouseover="this.style.background='#f0f0f0'" 
                     onmouseout="this.style.background='white'">
                    <strong>${nombre}</strong><br>
                    <small style="color:#666;">${curso}</small>
                </div>`;
    }).join('');
    
    sugerencias.style.display = 'block';
}

function mostrarSugerenciasReunion() {
    const input = document.getElementById('estudianteReunion');
    if (input.value.trim().length > 0) {
        filtrarEstudiantesReunion();
    }
}

function seleccionarEstudianteReunion(nombre, curso) {
    const input = document.getElementById('estudianteReunion');
    const cursoSelect = document.getElementById('cursoReunion');
    const sugerencias = document.getElementById('sugerenciasReunion');
    
    input.value = nombre;
    cursoSelect.value = curso;
    
    cursoSelect.style.background = '#e8f5e9';
    setTimeout(() => {
        cursoSelect.style.background = '';
    }, 1000);
    
    sugerencias.style.display = 'none';
    
    // Auto-llenar nombre del padre si existe en contactos
    autocompletarNombrePadre(nombre);
}

function autocompletarNombrePadre(nombreEstudiante) {
    const contacto = datosContactos.find(c => {
        const nombre = c['Nombre Estudiante'] || c['Mombre Estudiante'] || c.estudiante || '';
        return nombre.toLowerCase() === nombreEstudiante.toLowerCase();
    });
    
    if (contacto) {
        const nombrePadre = contacto['Nombre Padre'] || contacto.nombrePadre || '';
        const nombreMadre = contacto['Nombre Madre'] || contacto.nombreMadre || '';
        
        const campoNombre = document.getElementById('nombrePadreReunion');
        if (campoNombre) {
            if (nombreMadre) {
                campoNombre.value = nombreMadre;
                campoNombre.placeholder = `Padre: ${nombrePadre || 'No registrado'}`;
            } else if (nombrePadre) {
                campoNombre.value = nombrePadre;
            }
        }
    }
}

function registrarReunion(e) {
    e.preventDefault();
    const reunion = {
        'Fecha y Hora': document.getElementById('fechaReunion').value,
        'Nombre Estudiante': document.getElementById('estudianteReunion').value,
        'Curso': document.getElementById('cursoReunion').value,
        'Padre/Madre Presente': document.getElementById('padrePresente').value,
        'Nombre Padre/Madre': document.getElementById('nombrePadreReunion').value,
        'Personal UGC': document.getElementById('docenteReunion').value,
        'Motivo': document.getElementById('motivoReunion').value,
        'Situación Tratada': document.getElementById('situacionTratada').value,
        'Acuerdos Establecidos': document.getElementById('acuerdosEstablecidos').value,
        'Fecha Seguimiento': document.getElementById('fechaSeguimiento').value,
        'Estado': document.getElementById('estadoAcuerdo').value,
        'Observaciones': document.getElementById('observacionesReunion').value
    };
    
    datosReuniones.push(reunion);
    if (CONFIG.urlReuniones) enviarGoogleSheets(CONFIG.urlReuniones, reunion);
    mostrarAlerta('alertReuniones', '✅ Reunión registrada correctamente');
    document.getElementById('formReunion').reset();
    document.getElementById('fechaReunion').value = new Date().toISOString().slice(0,16);
    cargarTablaReuniones();
    actualizarEstadisticasReuniones();
}

function cargarTablaReuniones() {
    const tbody = document.getElementById('bodyReuniones');
    if (datosReuniones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No hay reuniones registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = datosReuniones.map((r, index) => {
        const fecha = r['Fecha y Hora'] || r.fecha || '';
        const estudiante = r['Nombre Estudiante'] || r.estudiante || '';
        const curso = r['Curso'] || r.curso || '';
        const padrePresente = r['Padre/Madre Presente'] || r.padrePresente || '';
        const nombrePadre = r['Nombre Padre/Madre'] || r.nombrePadre || '';
        const motivo = r['Motivo'] || r.motivo || '';
        const estado = r['Estado'] || r.estado || '';
        const fechaSeguimiento = r['Fecha Seguimiento'] || r.fechaSeguimiento || '';
        
        // Calcular número de reunión en orden cronológico
        const reunionesEstudiante = datosReuniones
            .filter(reunion => {
                const est = reunion['Nombre Estudiante'] || reunion.estudiante || '';
                return est.toLowerCase() === estudiante.toLowerCase();
            })
            .sort((a, b) => {
                const fechaA = new Date(a['Fecha y Hora'] || a.fecha || '');
                const fechaB = new Date(b['Fecha y Hora'] || b.fecha || '');
                return fechaA - fechaB;
            });
        
        const numeroReunion = reunionesEstudiante.findIndex(reunion => reunion === r) + 1;
        
        // Colores según número de reunión
        const badgeReuniones = numeroReunion >= 5 ? 'badge-warning' : 
                              numeroReunion >= 3 ? 'badge-info' : 'badge-success';
        
        // Colores según estado
        let badgeEstado = 'badge-info';
        let colorEstado = '#0c5460';
        if (estado === 'Cumplido') {
            badgeEstado = 'badge-success';
            colorEstado = '#155724';
        } else if (estado === 'No cumplido') {
            badgeEstado = 'badge-muy-grave';
            colorEstado = '#721c24';
        } else if (estado === 'Parcialmente cumplido') {
            badgeEstado = 'badge-warning';
            colorEstado = '#856404';
        }
        
        return `
        <tr onclick="verDetalleReunion(${index})" style="cursor:pointer;">
            <td>${fecha ? new Date(fecha).toLocaleDateString('es-DO', {day:'2-digit',month:'2-digit',year:'numeric'}) : ''}<br><small>${fecha ? new Date(fecha).toLocaleTimeString('es-DO', {hour:'2-digit',minute:'2-digit'}) : ''}</small></td>
            <td><strong>${estudiante}</strong><br><small>${curso}</small></td>
            <td>${nombrePadre || padrePresente}<br><small>${padrePresente}</small></td>
            <td style="text-align:center;"><span class="status-badge ${badgeReuniones}">${numeroReunion}ª vez</span></td>
            <td>${motivo}</td>
            <td><span class="status-badge ${badgeEstado}" style="color:${colorEstado}">${estado}</span></td>
            <td>${fechaSeguimiento ? new Date(fechaSeguimiento).toLocaleDateString('es-DO') : '-'}</td>
            <td>
                <button class="btn btn-primary" onclick="event.stopPropagation(); verDetalleReunion(${index})" style="padding:5px 10px;font-size:0.85em;">👁️ Ver</button>
                <button class="btn btn-success" onclick="event.stopPropagation(); generarActaReunion(${index})" style="padding:5px 10px;font-size:0.85em;">📄 Acta</button>
            </td>
        </tr>
        `;
    }).join('');
}

function actualizarEstadisticasReuniones() {
    const totalReuniones = datosReuniones.length;
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();
    
    const reunionesMes = datosReuniones.filter(r => {
        const fecha = r['Fecha y Hora'] || r.fecha || '';
        if (!fecha) return false;
        const fechaReunion = new Date(fecha);
        return fechaReunion.getMonth() === mesActual && fechaReunion.getFullYear() === añoActual;
    }).length;
    
    const acuerdosActivos = datosReuniones.filter(r => {
        const estado = r['Estado'] || r.estado || '';
        return estado === 'En seguimiento' || estado === 'Parcialmente cumplido';
    }).length;
    
    // Contar TODAS las reuniones con estado "En seguimiento" (sin importar fecha)
    const seguimientosPendientes = datosReuniones.filter(r => {
        const estado = r['Estado'] || r.estado || '';
        return estado === 'En seguimiento';
    }).length;
    
    document.getElementById('totalReuniones').textContent = totalReuniones;
    document.getElementById('reunionesMes').textContent = reunionesMes;
    document.getElementById('acuerdosActivos').textContent = acuerdosActivos;
    document.getElementById('seguimientosPendientes').textContent = seguimientosPendientes;
}

function buscarReuniones() {
    const buscar = document.getElementById('buscarReunion').value.toLowerCase().trim();
    const curso = document.getElementById('filtrarCursoReunion').value;
    const estado = document.getElementById('filtrarEstadoReunion').value;
    
    const filtrados = datosReuniones.filter(r => {
        const estudiante = (r['Nombre Estudiante'] || r.estudiante || '').toLowerCase();
        const nombrePadre = (r['Nombre Padre/Madre'] || r.nombrePadre || '').toLowerCase();
        const cursoR = r['Curso'] || r.curso || '';
        const estadoR = r['Estado'] || r.estado || '';
        
        const coincideBusqueda = !buscar || estudiante.includes(buscar) || nombrePadre.includes(buscar);
        const coincideCurso = !curso || cursoR === curso;
        const coincideEstado = !estado || estadoR === estado;
        
        return coincideBusqueda && coincideCurso && coincideEstado;
    });
    
    const tbody = document.getElementById('bodyReuniones');
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No se encontraron resultados</td></tr>';
        return;
    }
    
    // Mostrar resultados filtrados (reutilizando lógica de cargarTablaReuniones)
    const reunionesTemp = datosReuniones;
    datosReuniones = filtrados;
    cargarTablaReuniones();
    datosReuniones = reunionesTemp;
}

async function recargarReuniones() {
    const tbody = document.getElementById('bodyReuniones');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#666;">🔄 Recargando...</td></tr>';
    
    if (CONFIG.urlReuniones) {
        const datos = await cargarDatosDesdeGoogleSheets(CONFIG.urlReuniones);
        if (datos && datos.length > 0) {
            datosReuniones = datos;
            cargarTablaReuniones();
            actualizarEstadisticasReuniones();
            mostrarAlerta('alertReuniones', `✅ ${datos.length} reuniones recargadas`);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#dc3545;">⚠️ No se pudieron cargar los datos</td></tr>';
        }
    }
}

function verDetalleReunion(index) {
    const r = datosReuniones[index];
    const estudiante = r['Nombre Estudiante'] || r.estudiante || '';
    const curso = r['Curso'] || r.curso || '';
    const fecha = r['Fecha y Hora'] || r.fecha || '';
    const padrePresente = r['Padre/Madre Presente'] || r.padrePresente || '';
    const nombrePadre = r['Nombre Padre/Madre'] || r.nombrePadre || '';
    const personal = r['Personal UGC'] || r.personal || '';
    const motivo = r['Motivo'] || r.motivo || '';
    const situacion = r['Situación Tratada'] || r.situacion || '';
    const acuerdos = r['Acuerdos Establecidos'] || r.acuerdos || '';
    const estado = r['Estado'] || r.estado || '';
    const fechaSeg = r['Fecha Seguimiento'] || r.fechaSeguimiento || '';
    const observaciones = r['Observaciones'] || r.observaciones || '';
    
    // Calcular número de reunión en orden cronológico
    const reunionesEstudiante = datosReuniones
        .filter(reunion => {
            const est = reunion['Nombre Estudiante'] || reunion.estudiante || '';
            return est.toLowerCase() === estudiante.toLowerCase();
        })
        .sort((a, b) => {
            const fechaA = new Date(a['Fecha y Hora'] || a.fecha || '');
            const fechaB = new Date(b['Fecha y Hora'] || b.fecha || '');
            return fechaA - fechaB;
        });
    
    const numeroReunion = reunionesEstudiante.findIndex(reunion => reunion === r) + 1;
    
    // Separar acuerdos en lista
    const acuerdosLista = acuerdos.split('\n').filter(a => a.trim()).map((acuerdo, i) => {
        const textoLimpio = acuerdo.replace(/^\d+[\.\)]\s*/, '').trim();
        return `
            <div style="background:white;padding:12px;margin-bottom:8px;border-radius:6px;border-left:3px solid #2a5298;">
                <strong>${i + 1}.</strong> ${textoLimpio}
            </div>`;
    }).join('');
    
    // Crear o actualizar sección de detalle debajo de la tabla
    let detalleSection = document.getElementById('detalleReunionSection');
    if (!detalleSection) {
        detalleSection = document.createElement('div');
        detalleSection.id = 'detalleReunionSection';
        detalleSection.style.marginTop = '30px';
        document.querySelector('#bodyReuniones').parentElement.parentElement.appendChild(detalleSection);
    }
    
    const detalleHTML = `
        <div style="padding:20px;background:linear-gradient(135deg, #28a745 0%, #20c997 100%);border-radius:10px;margin-bottom:15px;">
            <h3 style="color:white;margin:0;">✨ Vista Detallada de Reunión (Al hacer clic en "Ver")</h3>
        </div>
        
        <div style="background:white;padding:20px;border-radius:8px;margin-bottom:15px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <h4 style="color:#28a745;margin-bottom:15px;">📅 Reunión del ${fecha ? new Date(fecha).toLocaleDateString('es-DO') + ' - ' + new Date(fecha).toLocaleTimeString('es-DO', {hour:'2-digit',minute:'2-digit'}) : '-'}</h4>
            <p><strong>Estudiante:</strong> ${estudiante} (${curso})</p>
            <p><strong>Presente:</strong> ${nombrePadre || padrePresente} (${padrePresente})</p>
            <p><strong>Reunión #${numeroReunion}</strong> con este padre/madre</p>
            <p><strong>Personal UGC:</strong> ${personal}</p>
            <p><strong>Motivo:</strong> ${motivo}</p>
            ${situacion ? `<p><strong>Situación:</strong> ${situacion}</p>` : ''}
        </div>
        
        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;">
            <h4 style="margin-bottom:10px;">📋 Acuerdos Establecidos:</h4>
            ${acuerdosLista}
        </div>
        
        <div style="padding:15px;background:${estado === 'Cumplido' ? '#d4edda' : estado === 'En seguimiento' ? '#d1ecf1' : '#f8d7da'};border-radius:8px;margin-bottom:15px;">
            <p><strong>Estado:</strong> <span style="color:${estado === 'Cumplido' ? '#155724' : estado === 'En seguimiento' ? '#0c5460' : '#721c24'}">${estado}</span></p>
            ${fechaSeg ? `<p><strong>Seguimiento:</strong> ${new Date(fechaSeg).toLocaleDateString('es-DO')}</p>` : ''}
            ${observaciones ? `<p><strong>Observaciones:</strong> ${observaciones}</p>` : ''}
        </div>
        
        <button class="btn btn-success" onclick="generarActaReunion(${index})">📄 Generar Acta de esta Reunión</button>
        <button class="btn" onclick="ocultarDetalleReunion()" style="background:#6c757d;color:white;margin-left:10px;">✕ Cerrar</button>
    `;
    
    detalleSection.innerHTML = detalleHTML;
    detalleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarDetalleReunion() {
    const detalleSection = document.getElementById('detalleReunionSection');
    if (detalleSection) {
        detalleSection.innerHTML = '';
    }
}

function generarActaReunion(index) {
    const r = datosReuniones[index];
    generarActaPDF(r);
}

function generarActaPDF(reunion) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const estudiante = reunion['Nombre Estudiante'] || reunion.estudiante || '';
    const startY = agregarEncabezadoCENSA(doc, 'Acta de Acuerdos y Compromisos');
    
    let yPos = startY + 5;
    
    // Título
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REUNIÓN CON PADRES/TUTORES', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Información de la reunión
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const fecha = reunion['Fecha y Hora'] || reunion.fecha || '';
    const curso = reunion['Curso'] || reunion.curso || '';
    const padrePresente = reunion['Padre/Madre Presente'] || reunion.padrePresente || '';
    const nombrePadre = reunion['Nombre Padre/Madre'] || reunion.nombrePadre || '';
    const personal = reunion['Personal UGC'] || reunion.personal || '';
    const motivo = reunion['Motivo'] || reunion.motivo || '';
    
    doc.text(`Fecha: ${fecha ? new Date(fecha).toLocaleString('es-DO') : '-'}`, 14, yPos);
    yPos += 6;
    doc.text(`Estudiante: ${estudiante}`, 14, yPos);
    yPos += 6;
    doc.text(`Curso: ${curso}`, 14, yPos);
    yPos += 6;
    doc.text(`Presente en la reunión: ${nombrePadre || padrePresente} (${padrePresente})`, 14, yPos);
    yPos += 6;
    doc.text(`Personal UGC/Docente: ${personal}`, 14, yPos);
    yPos += 10;
    
    // Motivo
    doc.setFont('helvetica', 'bold');
    doc.text('Motivo de la Reunión:', 14, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(motivo, 14, yPos);
    yPos += 10;
    
    // Situación tratada
    const situacion = reunion['Situación Tratada'] || reunion.situacion || '';
    if (situacion) {
        doc.setFont('helvetica', 'bold');
        doc.text('Situación Tratada:', 14, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const situacionLineas = doc.splitTextToSize(situacion, 180);
        doc.text(situacionLineas, 14, yPos);
        yPos += (situacionLineas.length * 5) + 5;
    }
    
    // Acuerdos
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('ACUERDOS Y COMPROMISOS ESTABLECIDOS:', 14, yPos);
    yPos += 7;
    
    const acuerdos = reunion['Acuerdos Establecidos'] || reunion.acuerdos || '';
    doc.setFont('helvetica', 'normal');
    const acuerdosLineas = doc.splitTextToSize(acuerdos, 180);
    doc.text(acuerdosLineas, 14, yPos);
    yPos += (acuerdosLineas.length * 5) + 10;
    
    // Fecha de seguimiento
    const fechaSeg = reunion['Fecha Seguimiento'] || reunion.fechaSeguimiento || '';
    if (fechaSeg) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`Fecha de seguimiento: ${new Date(fechaSeg).toLocaleDateString('es-DO')}`, 14, yPos);
        yPos += 10;
    }
    
    // Firmas
    if (yPos > 230) {
        doc.addPage();
        yPos = 20;
    }
    
    yPos += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.line(20, yPos, 90, yPos);
    doc.line(120, yPos, 190, yPos);
    doc.text('Padre/Madre/Tutor', 55, yPos + 5, { align: 'center' });
    doc.text('Personal UGC/Docente', 155, yPos + 5, { align: 'center' });
    
    // Pie de página
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, 285);
    
    doc.save(`Acta_Reunion_${estudiante.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportarReunionesPDF() {
    if (datosReuniones.length === 0) {
        alert('No hay reuniones para exportar');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    const startY = agregarEncabezadoCENSA(doc, 'Reporte de Reuniones con Padres');
    
    const tableData = datosReuniones.map(r => [
        (r['Fecha y Hora'] || r.fecha) ? new Date(r['Fecha y Hora'] || r.fecha).toLocaleDateString('es-DO') : '',
        r['Nombre Estudiante'] || r.estudiante || '',
        r['Curso'] || r.curso || '',
        r['Nombre Padre/Madre'] || r.nombrePadre || '',
        r['Motivo'] || r.motivo || '',
        r['Estado'] || r.estado || '',
        (r['Fecha Seguimiento'] || r.fechaSeguimiento) ? new Date(r['Fecha Seguimiento'] || r.fechaSeguimiento).toLocaleDateString('es-DO') : '-'
    ]);
    
    doc.autoTable({
        startY: startY,
        head: [['Fecha', 'Estudiante', 'Curso', 'Padre/Madre', 'Motivo', 'Estado', 'Seguimiento']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 58, 138],
            fontSize: 9,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 8,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 45 },
            2: { cellWidth: 20 },
            3: { cellWidth: 45 },
            4: { cellWidth: 50 },
            5: { cellWidth: 30 },
            6: { cellWidth: 25 }
        }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Total de reuniones: ${datosReuniones.length}`, 14, finalY);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 14, finalY + 5);
    
    doc.save(`Reuniones_CENSA_${new Date().toISOString().split('T')[0]}.pdf`);
}
