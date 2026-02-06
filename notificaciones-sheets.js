// ========================================
// SISTEMA DE NOTIFICACIONES - GOOGLE SHEETS
// Con sincronización en tiempo real entre dispositivos
// ========================================

// 👉 CONFIGURACIÓN DE URL - Esta URL se configura desde el módulo de Configuración
let urlNotificaciones = '';

// Variables globales
let datosNotificaciones = [];
let sistemaNotificacionesSheets = null;
let intervaloActualizacionNotificaciones = null;

// ========================================
// CLASE PRINCIPAL
// ========================================

class NotificacionesGoogleSheets {
    constructor() {
        this.url = urlNotificaciones;
        this.ultimaActualizacion = null;
        this.usuarioActual = this.obtenerUsuario();
    }

    // Obtener identificador del usuario (basado en dispositivo)
    obtenerUsuario() {
        let usuario = localStorage.getItem('usuario_ugc');
        if (!usuario) {
            // Generar un ID único para este dispositivo/usuario
            usuario = `Usuario_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            localStorage.setItem('usuario_ugc', usuario);
        }
        return usuario;
    }

    // Cargar todas las notificaciones desde Google Sheets
    async cargarNotificaciones() {
        if (!this.url) {
            console.log('URL de notificaciones no configurada');
            return [];
        }

        try {
            const response = await fetch(`${this.url}?action=leer`);
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                datosNotificaciones = data.data;
                this.ultimaActualizacion = new Date();
                actualizarPanelNotificaciones();
                return data.data;
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
        return [];
    }

    // Crear nueva notificación
    async crearNotificacion(tipo, titulo, mensaje, prioridad = 'info', destinatario = 'todos') {
        if (!this.url) {
            console.warn('URL de notificaciones no configurada');
            return false;
        }

        const notificacion = {
            ID_Unico: this.generarIdUnico(tipo, mensaje),
            Tipo: tipo,
            Titulo: titulo,
            Mensaje: mensaje,
            Prioridad: prioridad,
            Timestamp: new Date().toISOString(),
            Leida: 'false',
            Usuario: destinatario
        };

        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'agregar',
                    data: notificacion
                })
            });

            // Recargar notificaciones después de agregar
            setTimeout(() => this.cargarNotificaciones(), 1000);
            return true;
        } catch (error) {
            console.error('Error al crear notificación:', error);
            return false;
        }
    }

    // Marcar notificación como leída
    async marcarComoLeida(idUnico) {
        if (!this.url) return false;

        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'marcarLeida',
                    idUnico: idUnico
                })
            });

            // Actualizar localmente
            const notif = datosNotificaciones.find(n => n.ID_Unico === idUnico);
            if (notif) {
                notif.Leida = 'true';
                actualizarPanelNotificaciones();
            }

            return true;
        } catch (error) {
            console.error('Error al marcar como leída:', error);
            return false;
        }
    }

    // Eliminar notificación
    async eliminarNotificacion(idUnico) {
        if (!this.url) return false;

        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'eliminar',
                    idUnico: idUnico
                })
            });

            // Actualizar localmente
            datosNotificaciones = datosNotificaciones.filter(n => n.ID_Unico !== idUnico);
            actualizarPanelNotificaciones();

            return true;
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            return false;
        }
    }

    // Marcar todas como leídas
    async marcarTodasLeidas() {
        if (!this.url) return false;

        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'marcarTodasLeidas',
                    usuario: this.usuarioActual
                })
            });

            // Actualizar localmente
            datosNotificaciones.forEach(n => {
                if (n.Usuario === 'todos' || n.Usuario === this.usuarioActual) {
                    n.Leida = 'true';
                }
            });
            actualizarPanelNotificaciones();

            return true;
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
            return false;
        }
    }

    // Limpiar notificaciones leídas
    async limpiarLeidas() {
        if (!this.url) return false;

        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'limpiarLeidas',
                    usuario: this.usuarioActual
                })
            });

            // Actualizar localmente
            datosNotificaciones = datosNotificaciones.filter(n => {
                if (n.Usuario === 'todos' || n.Usuario === this.usuarioActual) {
                    return n.Leida !== 'true';
                }
                return true;
            });
            actualizarPanelNotificaciones();

            return true;
        } catch (error) {
            console.error('Error al limpiar notificaciones:', error);
            return false;
        }
    }

    // Generar ID único
    generarIdUnico(tipo, contenido) {
        const texto = `${tipo}-${contenido}-${Date.now()}`;
        return texto.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 100);
    }

    // Obtener notificaciones del usuario actual
    obtenerMisNotificaciones() {
        return datosNotificaciones.filter(n => 
            n.Usuario === 'todos' || n.Usuario === this.usuarioActual
        );
    }

    // Obtener notificaciones no leídas
    obtenerNoLeidas() {
        return this.obtenerMisNotificaciones().filter(n => n.Leida !== 'true');
    }
}

// ========================================
// FUNCIONES DE INTERFAZ
// ========================================

// Toggle del panel de notificaciones
function toggleNotificacionesSheets() {
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (panel.classList.contains('active')) {
        // Inicializar sistema si no existe
        if (!sistemaNotificacionesSheets) {
            inicializarSistemaNotificaciones();
        }
        
        // Verificar configuración
        if (!urlNotificaciones) {
            mostrarModalConfirmacion(
                '⚙️ Configuración pendiente',
                'Ve a <strong>Configuración del Sistema</strong> y agrega la URL de Google Sheets para Notificaciones.',
                false,
                null,
                'Entendido'
            );
            panel.classList.remove('active');
            overlay.classList.remove('active');
            return;
        }
        
        // Resetear pestaña
        const tabs = document.querySelectorAll('.notif-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const tabTodas = document.querySelector('.notif-tab[data-tab="todas"]');
        if (tabTodas) tabTodas.classList.add('active');
        
        // Cargar notificaciones
        sistemaNotificacionesSheets.cargarNotificaciones();
    }
}

// Mostrar notificaciones en el panel
function mostrarNotificacionesSheets(filtro = 'todas') {
    const content = document.getElementById('notifContent');
    if (!content) return;
    
    if (!sistemaNotificacionesSheets) {
        content.innerHTML = '<div class="notif-empty"><p>Inicializando sistema...</p></div>';
        return;
    }
    
    let notifsFiltradas = sistemaNotificacionesSheets.obtenerMisNotificaciones();
    
    if (filtro === 'sin-leer') {
        notifsFiltradas = notifsFiltradas.filter(n => n.Leida !== 'true');
    } else if (filtro === 'leidas') {
        notifsFiltradas = notifsFiltradas.filter(n => n.Leida === 'true');
    }
    
    // Ordenar por timestamp (más recientes primero)
    notifsFiltradas.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
    
    if (notifsFiltradas.length === 0) {
        content.innerHTML = `
            <div class="notif-empty">
                <div class="notif-empty-icon">📭</div>
                <p style="font-size:1.1em;font-weight:600;margin-bottom:5px;">No hay notificaciones</p>
                <p style="font-size:0.9em;">Todas tus notificaciones aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    notifsFiltradas.forEach(notif => {
        const tiempoTexto = obtenerTiempoRelativoNotif(new Date(notif.Timestamp));
        const badgeClass = notif.Prioridad === 'urgente' ? 'badge-urgente' : 
                          notif.Prioridad === 'importante' ? 'badge-importante' : 'badge-info';
        const badgeTexto = notif.Prioridad === 'urgente' ? 'Urgente' :
                          notif.Prioridad === 'importante' ? 'Importante' : 'Información';
        
        const icono = obtenerIconoNotificacion(notif.Tipo);
        
        html += `
            <div class="notif-item ${notif.Leida !== 'true' ? 'unread' : ''}" onclick="marcarNotifLeida('${notif.ID_Unico}')">
                <div class="notif-header-row">
                    <div class="notif-title">
                        <span class="notif-icon">${icono}</span>
                        <span>${notif.Titulo}</span>
                    </div>
                </div>
                <div class="notif-message">${notif.Mensaje}</div>
                <div class="notif-meta">
                    <span class="notif-time">🕐 ${tiempoTexto}</span>
                    <span class="notif-badge-type ${badgeClass}">${badgeTexto}</span>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

// Obtener icono según tipo
function obtenerIconoNotificacion(tipo) {
    const iconos = {
        'incidencia': '📋',
        'contacto': '📞',
        'tardanzas': '🚨',
        'reunion': '📅',
        'sistema': '⚙️'
    };
    return iconos[tipo] || 'ℹ️';
}

// Obtener tiempo relativo
function obtenerTiempoRelativoNotif(fecha) {
    const ahora = new Date();
    const diff = ahora - fecha;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 1) return 'ahora mismo';
    if (minutos < 60) return `hace ${minutos} min`;
    if (horas < 24) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-DO');
}

// Actualizar el panel completo
function actualizarPanelNotificaciones() {
    const tabActiva = document.querySelector('.notif-tab.active');
    const filtro = tabActiva ? tabActiva.getAttribute('data-tab') : 'todas';
    
    mostrarNotificacionesSheets(filtro);
    actualizarContadoresNotificaciones();
}

// Actualizar contadores
function actualizarContadoresNotificaciones() {
    if (!sistemaNotificacionesSheets) return;
    
    const misNotificaciones = sistemaNotificacionesSheets.obtenerMisNotificaciones();
    const total = misNotificaciones.length;
    const noLeidas = misNotificaciones.filter(n => n.Leida !== 'true').length;
    const leidas = total - noLeidas;
    
    const badge = document.getElementById('notifCounter');
    if (badge) {
        badge.textContent = noLeidas;
        badge.style.display = noLeidas > 0 ? 'flex' : 'none';
    }
    
    const countTodas = document.getElementById('countTodas');
    const countSinLeer = document.getElementById('countSinLeer');
    const countLeidas = document.getElementById('countLeidas');
    
    if (countTodas) countTodas.textContent = total;
    if (countSinLeer) countSinLeer.textContent = noLeidas;
    if (countLeidas) countLeidas.textContent = leidas;
}

// Cambiar pestaña
function cambiarTabNotifSheets(tab) {
    const tabs = document.querySelectorAll('.notif-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    mostrarNotificacionesSheets(tab);
}

// Marcar notificación como leída
async function marcarNotifLeida(idUnico) {
    if (!sistemaNotificacionesSheets) return;
    
    await sistemaNotificacionesSheets.marcarComoLeida(idUnico);
}

// Marcar todas como leídas
async function marcarTodasNotifLeidas() {
    if (!sistemaNotificacionesSheets) return;
    
    await sistemaNotificacionesSheets.marcarTodasLeidas();
    mostrarNotificacionToast('✅ Todas las notificaciones marcadas como leídas');
}

// Limpiar notificaciones leídas
async function limpiarNotifLeidas() {
    if (!sistemaNotificacionesSheets) return;
    
    const misNotificaciones = sistemaNotificacionesSheets.obtenerMisNotificaciones();
    const cantidadLeidas = misNotificaciones.filter(n => n.Leida === 'true').length;
    
    if (cantidadLeidas === 0) {
        mostrarModalConfirmacion(
            '📭 Sin notificaciones leídas',
            'No hay notificaciones leídas para eliminar.',
            false,
            null,
            'Entendido'
        );
        return;
    }
    
    mostrarModalConfirmacion(
        '🗑️ Limpiar notificaciones',
        `¿Estás seguro de que deseas eliminar <strong>${cantidadLeidas}</strong> notificación${cantidadLeidas > 1 ? 'es' : ''} leída${cantidadLeidas > 1 ? 's' : ''}?<br><br>Esta acción no se puede deshacer.`,
        true,
        async function() {
            await sistemaNotificacionesSheets.limpiarLeidas();
            mostrarNotificacionToast('✅ Notificaciones eliminadas correctamente');
        }
    );
}

// ========================================
// FUNCIONES DE CREACIÓN DE NOTIFICACIONES
// ========================================

// Crear notificación cuando se registra una incidencia
async function notificarNuevaIncidencia(estudiante, tipoFalta, tipoConducta) {
    if (!sistemaNotificacionesSheets) return;
    
    const prioridad = (tipoFalta === 'Grave' || tipoFalta === 'Muy Grave') ? 'importante' : 'info';
    
    await sistemaNotificacionesSheets.crearNotificacion(
        'incidencia',
        'Nueva incidencia registrada',
        `Se ha registrado una <strong>Falta ${tipoFalta}</strong> para <strong>${estudiante}</strong> por ${tipoConducta}.`,
        prioridad,
        'todos'  // Visible para todos los usuarios
    );
}

// Crear notificación cuando se registra un contacto
async function notificarNuevoContacto(estudiante, nombrePadre, nombreMadre) {
    if (!sistemaNotificacionesSheets) return;
    
    let contactosRegistrados = [];
    if (nombrePadre) contactosRegistrados.push('Padre');
    if (nombreMadre) contactosRegistrados.push('Madre');
    
    const textContactos = contactosRegistrados.length > 0 
        ? contactosRegistrados.join(' y ') 
        : 'Contacto de emergencia';
    
    await sistemaNotificacionesSheets.crearNotificacion(
        'contacto',
        'Nuevo contacto registrado',
        `Se ha registrado el contacto de <strong>${textContactos}</strong> para el estudiante <strong>${estudiante}</strong>.`,
        'info',
        'todos'
    );
}

// Crear notificación cuando un estudiante alcanza 3 tardanzas
async function notificarTardanzasCriticas(estudiante, cantidad) {
    if (!sistemaNotificacionesSheets) return;
    
    const idUnico = `tardanzas-${estudiante}-${cantidad}-${new Date().getMonth()}-${new Date().getFullYear()}`;
    
    // Verificar si ya existe esta notificación
    const existe = datosNotificaciones.some(n => n.ID_Unico === idUnico);
    if (existe) return;
    
    await sistemaNotificacionesSheets.crearNotificacion(
        'tardanzas',
        'Estudiante con 3 tardanzas',
        `<strong>${estudiante}</strong> ha alcanzado ${cantidad} tardanzas este mes. Se requiere acción inmediata según el protocolo.`,
        'urgente',
        'todos'
    );
}

// ========================================
// INICIALIZACIÓN Y ACTUALIZACIÓN
// ========================================

function inicializarSistemaNotificaciones() {
    try {
        // Cargar URL desde CONFIG si existe
        if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.urlNotificaciones) {
            urlNotificaciones = CONFIG.urlNotificaciones;
        }
        
        if (urlNotificaciones) {
            sistemaNotificacionesSheets = new NotificacionesGoogleSheets();
            sistemaNotificacionesSheets.cargarNotificaciones();
            
            // Actualizar cada 30 segundos cuando el panel está abierto
            if (intervaloActualizacionNotificaciones) {
                clearInterval(intervaloActualizacionNotificaciones);
            }
            
            intervaloActualizacionNotificaciones = setInterval(() => {
                const panel = document.getElementById('notifPanel');
                if (panel && panel.classList.contains('active')) {
                    sistemaNotificacionesSheets.cargarNotificaciones();
                }
            }, 30000);
        }
    } catch (error) {
        console.log('Sistema de notificaciones no inicializado:', error.message);
    }
}

// Actualizar URL de configuración
function actualizarURLNotificaciones(nuevaURL) {
    urlNotificaciones = nuevaURL;
    if (typeof CONFIG !== 'undefined' && CONFIG) {
        CONFIG.urlNotificaciones = nuevaURL;
    }
    inicializarSistemaNotificaciones();
}

// ========================================
// FUNCIONES AUXILIARES (SI NO EXISTEN)
// ========================================

// Función para mostrar modal de confirmación (reutiliza la del sistema principal)
if (typeof mostrarModalConfirmacion === 'undefined') {
    function mostrarModalConfirmacion(titulo, mensaje, mostrarCancelar, callbackConfirmar, textoConfirmar = 'Confirmar') {
        // [El código del modal ya existe en app.js, esta es solo un respaldo]
        if (confirm(mensaje.replace(/<[^>]*>/g, ''))) {
            if (callbackConfirmar) callbackConfirmar();
        }
    }
}

// Función para mostrar toast (reutiliza la del sistema principal)
if (typeof mostrarNotificacionToast === 'undefined') {
    function mostrarNotificacionToast(mensaje) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #059669;
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(5, 150, 105, 0.4);
            z-index: 100000;
            font-weight: 600;
        `;
        toast.textContent = mensaje;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) document.body.removeChild(toast);
        }, 3000);
    }
}

// ========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ========================================

// NOTA: La inicialización automática está deshabilitada para evitar errores
// Se inicializará solo cuando se configure la URL desde Configuración del Sistema

// Inicializar cuando el DOM esté listo (sin causar errores si CONFIG no existe)
/*
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inicializarSistemaNotificaciones, 1000); // Esperar 1 segundo para que CONFIG cargue
    });
} else {
    setTimeout(inicializarSistemaNotificaciones, 1000);
}
*/

// Actualizar notificaciones periódicamente (cada 2 minutos) - SOLO SI ESTÁ INICIALIZADO
setInterval(() => {
    try {
        if (sistemaNotificacionesSheets && urlNotificaciones) {
            sistemaNotificacionesSheets.cargarNotificaciones();
        }
    } catch (error) {
        // Ignorar errores silenciosamente
    }
}, 120000); // 2 minutos

console.log('✅ Sistema de notificaciones cargado (pendiente de configuración)');
