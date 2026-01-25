// ========================================
// SISTEMA DE NOTAS RÁPIDAS - CENSA
// Con Google Sheets (como los demás módulos)
// ========================================

// Configuración de Google Sheets (EN MEMORIA - NO localStorage)
const CONFIG_NOTAS = {
    urlNotasRapidas: '', // Se configura desde el módulo de configuración
    urlEstudiantes: 'https://script.google.com/macros/s/AKfycbyk1gUcU_cFSDbMz34WpEn1s81ctUIExmxzG062TZAx0KQhj5eOyQQVN2Rk8rLdMkicEA/exec'
};

let datosNotas = [];
let estudiantesNotas = []; // Array local de estudiantes para autocompletado

// ========================================
// CARGAR ESTUDIANTES PARA AUTOCOMPLETADO
// ========================================

async function cargarEstudiantesParaNotas() {
    try {
        console.log('🔄 Cargando estudiantes para notas...');
        const response = await fetch(CONFIG_NOTAS.urlEstudiantes);
        const data = await response.json();

        console.log('📦 Respuesta completa:', data);

        // Verificar diferentes formatos de respuesta
        if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            estudiantesNotas = data.values.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
            console.log(`✅ ${estudiantesNotas.length} estudiantes cargados (formato values)`);
        } else if (Array.isArray(data) && data.length > 0) {
            estudiantesNotas = data;
            console.log(`✅ ${estudiantesNotas.length} estudiantes cargados (formato array)`);
        } else if (data.data && Array.isArray(data.data)) {
            estudiantesNotas = data.data;
            console.log(`✅ ${estudiantesNotas.length} estudiantes cargados (formato data)`);
        } else {
            console.warn('⚠️ Formato de respuesta no reconocido');
            console.log('Estructura recibida:', Object.keys(data));
        }

        if (estudiantesNotas.length > 0) {
            console.log('👤 Primer estudiante:', estudiantesNotas[0]);
            console.log('🔑 Campos disponibles:', Object.keys(estudiantesNotas[0]));
        } else {
            console.warn('⚠️ No se encontraron estudiantes en la respuesta');
        }
    } catch (error) {
        console.error('❌ Error cargando estudiantes:', error);
    }
}

// ========================================
// SISTEMA DE NOTIFICACIONES
// ========================================

class SistemaNotificaciones {
    constructor() {
        this.container = document.getElementById('notificacionContainer');
    }

    mostrar(tipo, titulo, mensaje, duracion = 3000) {
        const notif = document.createElement('div');
        notif.className = `notificacion ${tipo}`;
        
        const iconos = {
            exito: '✅',
            info: 'ℹ️',
            advertencia: '⚠️',
            error: '❌'
        };

        notif.innerHTML = `
            <div class="notificacion-icono">${iconos[tipo] || 'ℹ️'}</div>
            <div class="notificacion-contenido">
                <div class="notificacion-titulo">${titulo}</div>
                ${mensaje ? `<div class="notificacion-mensaje">${mensaje}</div>` : ''}
            </div>
            <button class="notificacion-cerrar" onclick="this.parentElement.remove()">✕</button>
        `;

        this.container.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);

        if (duracion > 0) {
            setTimeout(() => {
                notif.classList.remove('show');
                setTimeout(() => notif.remove(), 300);
            }, duracion);
        }

        return notif;
    }

    exito(titulo, mensaje, duracion) {
        return this.mostrar('exito', titulo, mensaje, duracion);
    }

    info(titulo, mensaje, duracion) {
        return this.mostrar('info', titulo, mensaje, duracion);
    }

    advertencia(titulo, mensaje, duracion) {
        return this.mostrar('advertencia', titulo, mensaje, duracion);
    }

    error(titulo, mensaje, duracion = 5000) {
        return this.mostrar('error', titulo, mensaje, duracion);
    }
}

const notificaciones = new SistemaNotificaciones();

// ========================================
// FUNCIONES DE GOOGLE SHEETS
// ========================================

async function cargarNotasDesdeGoogleSheets() {
    if (!CONFIG_NOTAS.urlNotasRapidas) {
        console.log('⚠️ No hay URL de notas configurada');
        notificaciones.advertencia(
            'Configuración pendiente',
            'Ve a Configuración y agrega la URL de Google Sheets para Notas'
        );
        return [];
    }
    
    console.log('📥 Cargando notas desde:', CONFIG_NOTAS.urlNotasRapidas);
    
    try {
        const data = await cargarDatosDesdeGoogleSheets(CONFIG_NOTAS.urlNotasRapidas);
        console.log('✅ Notas cargadas desde Google Sheets:', data.length, 'registros');
        console.log('📋 Datos recibidos:', data);
        return data;
    } catch (error) {
        console.error('❌ Error al cargar notas:', error);
        notificaciones.error('Error de conexión', 'No se pudieron cargar las notas. Verifica tu configuración.');
        return [];
    }
}

async function guardarNotaEnGoogleSheets(nota) {
    if (!CONFIG_NOTAS.urlNotasRapidas) {
        notificaciones.error('Error de configuración', 'No hay URL de Google Sheets configurada');
        return false;
    }

    try {
        const response = await fetch(CONFIG_NOTAS.urlNotasRapidas, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nota)
        });

        console.log('✅ Nota guardada en Google Sheets');
        return true;
    } catch (error) {
        console.error('Error al guardar nota:', error);
        notificaciones.error('Error al guardar', 'No se pudo guardar la nota');
        return false;
    }
}

async function actualizarNotaEnGoogleSheets(nota) {
    if (!CONFIG_NOTAS.urlNotasRapidas) {
        notificaciones.error('Error de configuración', 'No hay URL de Google Sheets configurada');
        return false;
    }

    try {
        const response = await fetch(CONFIG_NOTAS.urlNotasRapidas, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...nota,
                accion: 'actualizar'
            })
        });

        console.log('✅ Nota actualizada en Google Sheets');
        return true;
    } catch (error) {
        console.error('Error al actualizar nota:', error);
        notificaciones.error('Error al actualizar', 'No se pudo actualizar la nota');
        return false;
    }
}

async function eliminarNotaDeGoogleSheets(id) {
    if (!CONFIG_NOTAS.urlNotasRapidas) {
        notificaciones.error('Error de configuración', 'No hay URL de Google Sheets configurada');
        return false;
    }

    try {
        const response = await fetch(CONFIG_NOTAS.urlNotasRapidas, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
                accion: 'eliminar'
            })
        });

        console.log('✅ Nota eliminada de Google Sheets');
        return true;
    } catch (error) {
        console.error('Error al eliminar nota:', error);
        notificaciones.error('Error al eliminar', 'No se pudo eliminar la nota');
        return false;
    }
}

// ========================================
// CLASE PARA MANEJAR LAS NOTAS
// ========================================

class NotasRapidas {
    constructor() {
        this.notas = [];
        this.notaEditando = null;
        this.cargando = false;
        this.tabActiva = 'hoy';
        this.notificacionMostrada = false;
    }

    async inicializar() {
        this.mostrarCargando();
        await this.cargarNotas();
        this.ocultarCargando();
        this.actualizarVista();
        this.actualizarContador();
    }

    mostrarCargando() {
        this.cargando = true;
        const content = document.getElementById('notasContent');
        if (content) {
            content.innerHTML = `
                <div class="notas-vacio">
                    <div style="font-size: 3em;">⏳</div>
                    <p>Cargando notas...</p>
                </div>
            `;
        }
    }

    ocultarCargando() {
        this.cargando = false;
    }

    async cargarNotas() {
        try {
            const notasCargadas = await cargarNotasDesdeGoogleSheets();
            
            if (notasCargadas && notasCargadas.length >= 0) {
                this.notas = notasCargadas;
                datosNotas = this.notas;
                console.log(`✅ ${this.notas.length} nota${this.notas.length !== 1 ? 's' : ''} cargada${this.notas.length !== 1 ? 's' : ''}`);
            } else {
                this.notas = [];
                datosNotas = [];
            }
        } catch (error) {
            console.error('Error cargando notas:', error);
            this.notas = [];
            datosNotas = [];
        }
    }

    async agregarNota(estudiante, tipo, prioridad, texto, fechaAccion = null) {
        const nuevaNota = {
            id: Date.now().toString(),
            estudiante: estudiante,
            tipo: tipo,
            prioridad: prioridad,
            texto: texto,
            fechaAccion: fechaAccion || '',
            fecha: new Date().toISOString(),
            dispositivo: this.obtenerDispositivo(),
            timestamp: new Date().toLocaleString('es-DO'),
            editado: ''
        };

        const guardado = await guardarNotaEnGoogleSheets(nuevaNota);
        
        if (guardado) {
            this.notas.unshift(nuevaNota);
            datosNotas = this.notas;
            this.actualizarVista();
            this.actualizarContador();
            
            notificaciones.exito(
                'Nota guard
