// ========================================
// SISTEMA DE NOTIFICACIONES - GOOGLE SHEETS
// ✨ VERSIÓN MEJORADA - Actualización rápida y compatible con iOS
// Con sincronización en tiempo real entre dispositivos
// ========================================

// 👉 CONFIGURACIÓN DE URL - Esta URL se configura desde el módulo de Configuración
let urlNotificaciones = 'https://script.google.com/macros/s/AKfycbxza27B1vj81BpWe_8qrsQusxE0YC2FzoY1j4yAKkG3uq89gA1xIljm3PuWCQljJojZ2Q/exec';

// Variables globales
let datosNotificaciones = [];
let sistemaNotificacionesSheets = null;
let intervaloActualizacionNotificaciones = null;
let intervaloActualizacionBackground = null; // 🆕 NUEVO: Para actualización en segundo plano
let ultimaActualizacionBadge = 0; // 🆕 NUEVO: Para evitar actualizaciones excesivas del badge

// ========================================
// CLASE PRINCIPAL
// ========================================

class NotificacionesGoogleSheets {
    constructor() {
        this.url = urlNotificaciones;
        this.ultimaActualizacion = null;
        this.usuarioActual = this.obtenerUsuario();
        this.notificacionesAnteriores = 0; // 🆕 NUEVO: Para detectar nuevas notificaciones
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
    async cargarNotificaciones(silencioso = false) {
        if (!this.url) {
            console.log('URL de notificaciones no configurada');
            return [];
        }

        try {
            // 🆕 MEJORADO: Añadir timestamp para evitar caché
            const timestamp = new Date().getTime();
            // ✅ COMPATIBLE: Fetch simple sin headers especiales para evitar CORS preflight
            const response = await fetch(`${this.url}?action=leer&t=${timestamp}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && Array.isArray(data.data)) {
                    const cantidadAnterior = datosNotificaciones.length;
                    datosNotificaciones = data.data;
                    this.ultimaActualizacion = new Date();
                    
                    // 🆕 NUEVO: Detectar si hay nuevas notificaciones
                    if (!silencioso && datosNotificaciones.length > cantidadAnterior) {
                        this.animarBadgeNuevas();
                    }
                    
                    actualizarPanelNotificaciones();
                    actualizarContadoresNotificaciones();
                    return data.data;
                }
            }
        } catch (error) {
            if (!silencioso) {
                console.error('Error al cargar notificaciones:', error);
            }
        }
        return [];
    }

    // 🆕 NUEVO: Animación del badge cuando hay nuevas notificaciones
    animarBadgeNuevas() {
        const badge = document.getElementById('notifCounter');
        if (badge && badge.style.display !== 'none') {
            badge.style.animation = 'none';
            setTimeout(() => {
                badge.style.animation = 'pulse 0.5s ease-in-out 3';
            }, 10);
        }
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
            // 🆕 MEJORADO: Usar URLSearchParams en lugar de JSON para compatibilidad con iOS
            const formData = new URLSearchParams();
            formData.append('action', 'agregar');
            
            // Agregar cada campo de la notificación
            for (const key in notificacion) {
                formData.append(key, notificacion[key]);
            }

            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'no-cors', // ✅ COMPATIBLE: Necesario para Apps Script actual
                body: formData
            });

            // 🆕 MEJORADO: Recargar más rápido después de agregar
            setTimeout(() => this.cargarNotificaciones(true), 500);
            return true;
        } catch (error) {
            console.error('Error al crear notificación:', error);
            // 🆕 NUEVO: Reintentar una vez más en caso de error
            setTimeout(() => this.cargarNotificaciones(true), 2000);
            return false;
        }
    }

    // Marcar notificación como leída
    async marcarComoLeida(idUnico) {
        if (!this.url) return false;

        try {
            // 🆕 MEJORADO: Actualizar localmente PRIMERO
            const notif = datosNotificaciones.find(n => n.ID_Unico === idUnico);
            if (notif) {
                notif.Leida = 'true';
                actualizarPanelNotificaciones();
            }

            // 🆕 MEJORADO: Usar URLSearchParams para compatibilidad con iOS
            const formData = new URLSearchParams();
            formData.append('action', 'marcarLeida');
            formData.append('idUnico', idUnico);

            // Enviar a Google Sheets (modo no-cors no puede leer respuesta)
            fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).catch(error => {
                console.log('Error al enviar (ignorado en no-cors):', error);
            });

            // 🆕 NUEVO: Esperar 3 segundos antes de recargar desde Sheets
            // Esto le da tiempo a Google Sheets para procesar
            setTimeout(() => {
                this.cargarNotificaciones(true);
            }, 3000);

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
            // 🆕 MEJORADO: Eliminar localmente PRIMERO
            datosNotificaciones = datosNotificaciones.filter(n => n.ID_Unico !== idUnico);
            actualizarPanelNotificaciones();

            // 🆕 MEJORADO: Usar URLSearchParams para compatibilidad con iOS
            const formData = new URLSearchParams();
            formData.append('action', 'eliminar');
            formData.append('idUnico', idUnico);

            // Enviar a Google Sheets
            fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).catch(error => {
                console.log('Error al enviar (ignorado en no-cors):', error);
            });

            // 🆕 NUEVO: Recargar después de 3 segundos para confirmar
            setTimeout(() => {
                this.cargarNotificaciones(true);
            }, 3000);

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
            // 🆕 MEJORADO: Actualizar localmente PRIMERO
            datosNotificaciones.forEach(n => {
                if (n.Usuario === 'todos' || n.Usuario === this.usuarioActual) {
                    n.Leida = 'true';
                }
            });
            actualizarPanelNotificaciones();

            // 🆕 MEJORADO: Usar URLSearchParams para compatibilidad con iOS
            const formData = new URLSearchParams();
            formData.append('action', 'marcarTodasLeidas');
            formData.append('usuario', this.usuarioActual);

            // Enviar a Google Sheets
            fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).catch(error => {
                console.log('Error al enviar (ignorado en no-cors):', error);
            });

            // 🆕 NUEVO: Recargar después de 3 segundos
            setTimeout(() => {
                this.cargarNotificaciones(true);
            }, 3000);

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
            // 🆕 MEJORADO: Eliminar localmente PRIMERO
            datosNotificaciones = datosNotificaciones.filter(n => {
                if (n.Usuario === 'todos' || n.Usuario === this.usuarioActual) {
                    return n.Leida !== 'true';
                }
                return true;
            });
            actualizarPanelNotificaciones();

            // 🆕 MEJORADO: Usar URLSearchParams para compatibilidad con iOS
            const formData = new URLSearchParams();
            formData.append('action', 'limpiarLeidas');
            formData.append('usuario', this.usuarioActual);

            // Enviar a Google Sheets
            fetch(this.url, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).catch(error => {
                console.log('Error al enviar (ignorado en no-cors):', error);
            });

            // 🆕 NUEVO: Recargar después de 3 segundos
            setTimeout(() => {
                this.cargarNotificaciones(true);
            }, 3000);

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
// INTERFAZ DE USUARIO - PANEL DE NOTIFICACIONES
// ========================================

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
        
        // 🆕 MEJORADO: Mostrar indicador de carga
        mostrarIndicadorActualizacion(true);
        
        // Cargar notificaciones
        sistemaNotificacionesSheets.cargarNotificaciones().then(() => {
            mostrarIndicadorActualizacion(false);
        });
    }
}

// 🆕 NUEVO: Indicador visual de actualización
function mostrarIndicadorActualizacion(mostrar) {
    const header = document.querySelector('.notif-header h3');
    if (!header) return;
    
    let indicador = document.getElementById('indicadorActualizacion');
    
    if (mostrar) {
        if (!indicador) {
            indicador = document.createElement('span');
            indicador.id = 'indicadorActualizacion';
            indicador.style.cssText = `
                display: inline-block;
                margin-left: 10px;
                color: #059669;
                font-size: 14px;
                animation: pulse 1s ease-in-out infinite;
            `;
            indicador.textContent = '🔄';
            header.appendChild(indicador);
        }
        indicador.style.display = 'inline-block';
    } else {
        if (indicador) {
            indicador.style.display = 'none';
        }
    }
}

// Mostrar notificaciones en el panel
function mostrarNotificacionesSheets(filtro = 'todas') {
    const content = document.getElementById('notifContent');
    if (!content) return;
    
    if (!sistemaNotificacionesSheets) {
        content.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#999;">
                <div style="font-size:64px;margin-bottom:20px;">⚙️</div>
                <p style="font-size:18px;margin-bottom:10px;">Sistema no inicializado</p>
                <p style="font-size:14px;">Configura la URL en Configuración del Sistema</p>
            </div>
        `;
        return;
    }
    
    const misNotificaciones = sistemaNotificacionesSheets.obtenerMisNotificaciones();
    
    let notifFiltradas = misNotificaciones;
    if (filtro === 'sin-leer') {
        notifFiltradas = misNotificaciones.filter(n => n.Leida !== 'true');
    } else if (filtro === 'leidas') {
        notifFiltradas = misNotificaciones.filter(n => n.Leida === 'true');
    }
    
    if (notifFiltradas.length === 0) {
        const mensajes = {
            'todas': { emoji: '📭', texto: 'No hay notificaciones' },
            'sin-leer': { emoji: '✅', texto: 'No hay notificaciones sin leer' },
            'leidas': { emoji: '📭', texto: 'No hay notificaciones leídas' }
        };
        const msg = mensajes[filtro] || mensajes['todas'];
        
        content.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#999;">
                <div style="font-size:64px;margin-bottom:20px;">${msg.emoji}</div>
                <p style="font-size:18px;">${msg.texto}</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    notifFiltradas.sort((a, b) => {
        const fechaA = new Date(a.Timestamp || 0);
        const fechaB = new Date(b.Timestamp || 0);
        return fechaB - fechaA;
    });
    
    content.innerHTML = notifFiltradas.map(notif => {
        const prioridad = notif.Prioridad || 'info';
        const leida = notif.Leida === 'true';
        const fecha = new Date(notif.Timestamp);
        const fechaTexto = fecha.toLocaleDateString('es-DO', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const iconosPrioridad = {
            'urgente': '🚨',
            'importante': '⚠️',
            'info': 'ℹ️'
        };
        
        const colorBorde = {
            'urgente': '#dc3545',
            'importante': '#ffc107',
            'info': '#0d6efd'
        };
        
        return `
            <div class="notif-item ${leida ? 'leida' : ''}" 
                 onclick="marcarNotifLeida('${notif.ID_Unico}')" 
                 style="border-left: 4px solid ${colorBorde[prioridad]};">
                <div class="notif-header-item">
                    <span class="notif-badge-type badge-${prioridad}">
                        ${iconosPrioridad[prioridad]} ${prioridad.toUpperCase()}
                    </span>
                    <span class="notif-fecha">${fechaTexto}</span>
                </div>
                <h4 class="notif-titulo">${notif.Titulo}</h4>
                <p class="notif-mensaje">${notif.Mensaje}</p>
                <div class="notif-acciones">
                    ${!leida ? '<span class="notif-nuevo">NUEVA</span>' : ''}
                    <button onclick="event.stopPropagation(); eliminarNotifSheets('${notif.ID_Unico}')" 
                            class="btn-eliminar-notif">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

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

// Eliminar notificación individual
async function eliminarNotifSheets(idUnico) {
    if (!sistemaNotificacionesSheets) return;
    
    const notif = datosNotificaciones.find(n => n.ID_Unico === idUnico);
    if (!notif) return;
    
    mostrarModalConfirmacion(
        '🗑️ Eliminar notificación',
        `¿Estás seguro de que deseas eliminar esta notificación?<br><br><strong>${notif.Titulo}</strong>`,
        true,
        async function() {
            await sistemaNotificacionesSheets.eliminarNotificacion(idUnico);
            mostrarNotificacionToast('✅ Notificación eliminada');
        }
    );
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
// 🆕 NUEVO: SISTEMA DE ACTUALIZACIÓN INTELIGENTE
// ========================================

function inicializarSistemaNotificaciones() {
    try {
        // Cargar URL desde CONFIG si existe
        if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.urlNotificaciones) {
            urlNotificaciones = CONFIG.urlNotificaciones;
        }
        
        if (urlNotificaciones) {
            sistemaNotificacionesSheets = new NotificacionesGoogleSheets();
            
            // Cargar notificaciones de forma asíncrona sin bloquear
            sistemaNotificacionesSheets.cargarNotificaciones(true).catch(error => {
                console.log('Error al cargar notificaciones iniciales:', error);
            });
            
            // 🆕 MEJORADO: Limpiar intervalos anteriores si existen
            if (intervaloActualizacionNotificaciones) {
                clearInterval(intervaloActualizacionNotificaciones);
            }
            if (intervaloActualizacionBackground) {
                clearInterval(intervaloActualizacionBackground);
            }
            
            // 🆕 NUEVO: Actualización rápida cuando el panel está ABIERTO (cada 5 segundos)
            intervaloActualizacionNotificaciones = setInterval(() => {
                try {
                    const panel = document.getElementById('notifPanel');
                    if (panel && panel.classList.contains('active') && sistemaNotificacionesSheets) {
                        sistemaNotificacionesSheets.cargarNotificaciones(true).catch(error => {
                            console.log('Error al actualizar notificaciones:', error);
                        });
                    }
                } catch (error) {
                    console.log('Error en intervalo de notificaciones:', error);
                }
            }, 5000); // ⚡ 5 segundos cuando está abierto
            
            // 🆕 NUEVO: Actualización en segundo plano cuando el panel está CERRADO (cada 15 segundos)
            intervaloActualizacionBackground = setInterval(() => {
                try {
                    const panel = document.getElementById('notifPanel');
                    // Solo actualizar si el panel está CERRADO
                    if ((!panel || !panel.classList.contains('active')) && sistemaNotificacionesSheets) {
                        // Actualización silenciosa (solo badge, sin animaciones)
                        const ahora = Date.now();
                        // Evitar actualizaciones muy frecuentes del badge
                        if (ahora - ultimaActualizacionBadge > 10000) {
                            sistemaNotificacionesSheets.cargarNotificaciones(true).catch(error => {
                                console.log('Error en actualización background:', error);
                            });
                            ultimaActualizacionBadge = ahora;
                        }
                    }
                } catch (error) {
                    console.log('Error en actualización background:', error);
                }
            }, 15000); // ⚡ 15 segundos cuando está cerrado
            
            console.log('✅ Sistema de notificaciones inicializado correctamente');
            console.log('⚡ Actualización: 5s (panel abierto) | 15s (segundo plano)');
        } else {
            console.log('⚠️ URL de notificaciones no configurada');
        }
    } catch (error) {
        console.log('❌ Error al inicializar sistema de notificaciones:', error.message);
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

// 🆕 NUEVO: Agregar estilos CSS para animación del badge
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
`;
document.head.appendChild(styleSheet);

console.log('✅ Sistema de notificaciones MEJORADO cargado');
console.log('🚀 Características: Actualización rápida + Compatible con iOS');
