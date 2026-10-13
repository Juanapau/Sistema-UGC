// ========================================
// SISTEMA DE NOTIFICACIONES - GOOGLE SHEETS
// VERSIÓN CORREGIDA - Sin onclick inline
// Compatible con iOS/Android/Desktop
// ========================================

// 👉 CONFIGURACIÓN DE URL
let urlNotificaciones = 'https://script.google.com/macros/s/AKfycbxzxH-mSiQnYZAADC7JLwnfbYvKYwNyOje1Tje77PP8u9Gv_ksx_CEk0J8R1e1fHiTM/exec?hoja=Notificaciones';

// Variables globales
let datosNotificaciones = [];
let sistemaNotificacionesSheets = null;
let intervaloActualizacionNotificaciones = null;
let intervaloActualizacionBackground = null;
// IDs de notificaciones eliminadas localmente pero que quizá el servidor aún no
// ha borrado. Evita que una notificación recién eliminada reaparezca cuando una
// recarga en segundo plano (3s/5s/15s) llega antes de que el servidor la elimine.
let _notifEliminadasPendientes = new Set();
// IDs marcados como leídos localmente que el servidor quizá aún no ha confirmado.
// Evita que una recarga en segundo plano (3s/5s/15s) los vuelva a mostrar sin leer.
let _notifLeidasPendientes = new Set();

// ========================================
// FUNCIÓN AUXILIAR
// ========================================

function esNotificacionLeida(notif) {
    const valor = String(notif.Leida).toLowerCase();
    return valor === 'true';
}

// Extrae el nombre del estudiante de una notificación para poder abrir su
// historial. Si en el futuro existe un campo propio (Estudiante) se usa ese;
// de lo contrario se obtiene del mensaje según el tipo de notificación.
function extraerEstudianteDeNotif(notif) {
    if (!notif) return '';
    if (notif.Estudiante) return String(notif.Estudiante).trim();
    const msg = String(notif.Mensaje || '');
    const tipo = String(notif.Tipo || '').toLowerCase();
    const strongs = [];
    const re = /<strong>(.*?)<\/strong>/gi;
    let m;
    while ((m = re.exec(msg)) !== null) strongs.push(m[1].trim());

    if (tipo === 'incidencia') {
        const mm = msg.match(/para\s+<strong>(.*?)<\/strong>\s+por/i);
        if (mm) return mm[1].trim();
        if (strongs.length >= 2) return strongs[1];
    } else if (tipo === 'contacto') {
        const mm = msg.match(/estudiante\s+<strong>(.*?)<\/strong>/i);
        if (mm) return mm[1].trim();
        if (strongs.length) return strongs[strongs.length - 1];
    } else if (tipo === 'tardanzas') {
        if (strongs.length) return strongs[0];
    }
    return strongs.length ? strongs[strongs.length - 1] : '';
}

// ========================================
// CLASE PRINCIPAL
// ========================================

class NotificacionesGoogleSheets {
    constructor() {
        this.url = urlNotificaciones;
        this.usuarioActual = this.obtenerUsuario();
    }

    obtenerUsuario() {
        let usuario = localStorage.getItem('usuario_ugc');
        if (!usuario) {
            usuario = `Usuario_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            localStorage.setItem('usuario_ugc', usuario);
        }
        return usuario;
    }

    async cargarNotificaciones(silencioso = false) {
        if (!this.url) return [];

        try {
            const timestamp = new Date().getTime();
            const sep = this.url.includes('?') ? '&' : '?';
            const response = await fetch(`${this.url}${sep}t=${timestamp}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && Array.isArray(data.data)) {
                    const cantidadAnterior = datosNotificaciones.length;
                    const servidor = data.data;

                    // NOTA: los "pendientes" se identifican por Timestamp, que es
                    // único por notificación y estable (a diferencia del ID, que
                    // puede repetirse, o de la fila, que cambia al borrar).

                    // Mantener como leídas las notificaciones marcadas localmente
                    // aunque el servidor aún no haya procesado el cambio.
                    if (_notifLeidasPendientes.size > 0) {
                        servidor.forEach(n => {
                            if (_notifLeidasPendientes.has(n.Timestamp)) {
                                if (esNotificacionLeida(n)) {
                                    _notifLeidasPendientes.delete(n.Timestamp); // servidor ya confirmó
                                } else {
                                    n.Leida = 'true'; // conservar como leída
                                }
                            }
                        });
                    }

                    // Olvidar los tombstones que el servidor ya eliminó realmente
                    if (_notifEliminadasPendientes.size > 0) {
                        const tsServidor = new Set(servidor.map(n => n.Timestamp));
                        _notifEliminadasPendientes.forEach(ts => {
                            if (!tsServidor.has(ts)) _notifEliminadasPendientes.delete(ts);
                        });
                    }

                    // Ocultar las que se eliminaron localmente pero siguen en el
                    // servidor (aún no procesó el borrado), para que no reaparezcan
                    datosNotificaciones = (_notifEliminadasPendientes.size > 0)
                        ? servidor.filter(n => !_notifEliminadasPendientes.has(n.Timestamp))
                        : servidor;

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

    animarBadgeNuevas() {
        const badge = document.getElementById('notifCounter');
        if (badge && badge.style.display !== 'none') {
            badge.style.animation = 'none';
            setTimeout(() => {
                badge.style.animation = 'pulse 0.5s ease-in-out 3';
            }, 10);
        }
    }

    async crearNotificacion(tipo, titulo, mensaje, prioridad = 'info', destinatario = 'todos') {
        if (!this.url) return false;

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
            const _hojaNotif = (this.url.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notificaciones';
            const payload = { hoja: _hojaNotif, action: 'agregar', ...notificacion };
            const urlConParams = this.url.split('?')[0] + '?' + new URLSearchParams(payload).toString();

            fetch(urlConParams, {
                method: 'POST',
                mode: 'no-cors',
                redirect: 'follow'
            }).catch(error => {
                console.log('Error al enviar:', error);
            });

            // Solo recargar panel si existe en esta página
            if (document.getElementById('notifPanel')) {
                setTimeout(() => this.cargarNotificaciones(true), 1000);
            }
            return true;
        } catch (error) {
            console.error('Error al crear notificación:', error);
            return false;
        }
    }

    async marcarComoLeida(fila, ts, idUnico) {
        if (!this.url) return false;

        try {
            console.log('🔵 [JS] Marcar como leída (fila ' + fila + '):', idUnico);

            // Recordar por Timestamp, por si la recarga llega antes que el servidor
            if (ts) _notifLeidasPendientes.add(ts);

            // 1. Actualizar localmente PRIMERO (la notificación exacta por fila/ts)
            const notif = datosNotificaciones.find(n => String(n._fila) === String(fila))
                       || datosNotificaciones.find(n => n.Timestamp === ts);
            if (notif) {
                notif.Leida = 'true';
                actualizarPanelNotificaciones();
            } else {
                console.warn('⚠️ [JS] No encontrada localmente');
            }

            // 2. Enviar a Google Sheets (por fila exacta)
            const _hojaNotif2 = (this.url.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notificaciones';
            const urlML = this.url.split('?')[0] + '?' + new URLSearchParams({ hoja: _hojaNotif2, action: 'marcarLeida', fila: fila, idUnico: idUnico || '' }).toString();
            fetch(urlML, { method: 'POST', mode: 'no-cors', redirect: 'follow' }).catch(error => {
                console.log('Error al enviar:', error);
            });

            // 3. Recargar después de 3 segundos
            setTimeout(() => this.cargarNotificaciones(true), 3000);

            return true;
        } catch (error) {
            console.error('Error al marcar como leída:', error);
            return false;
        }
    }

    async eliminarNotificacion(fila, ts, idUnico) {
        if (!this.url) return false;

        try {
            // Tombstone por Timestamp para que ninguna recarga posterior la resucite
            if (ts) {
                _notifEliminadasPendientes.add(ts);
                _notifLeidasPendientes.delete(ts);
            }
            // Quitar localmente SOLO la notificación exacta (por fila/ts)
            datosNotificaciones = datosNotificaciones.filter(n =>
                !(String(n._fila) === String(fila) || (ts && n.Timestamp === ts)));
            actualizarPanelNotificaciones();

            const _hojaNotif3 = (this.url.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notificaciones';
            const urlEl = this.url.split('?')[0] + '?' + new URLSearchParams({ hoja: _hojaNotif3, action: 'eliminar', fila: fila, idUnico: idUnico || '' }).toString();
            fetch(urlEl, { method: 'POST', mode: 'no-cors', redirect: 'follow' }).catch(error => {
                console.log('Error al enviar:', error);
            });

            setTimeout(() => this.cargarNotificaciones(true), 3000);

            return true;
        } catch (error) {
            console.error('Error al eliminar:', error);
            return false;
        }
    }

    async marcarTodasLeidas() {
        if (!this.url) return false;

        try {
            datosNotificaciones.forEach(n => {
                if (n.Usuario === 'todos' || n.Usuario === this.usuarioActual) {
                    n.Leida = 'true';
                    if (n.Timestamp) _notifLeidasPendientes.add(n.Timestamp); // conservar hasta confirmación
                }
            });
            actualizarPanelNotificaciones();

            const _hojaNotif4 = (this.url.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notificaciones';
            const urlMT = this.url.split('?')[0] + '?' + new URLSearchParams({ hoja: _hojaNotif4, action: 'marcarTodasLeidas', usuario: this.usuarioActual }).toString();
            fetch(urlMT, { method: 'POST', mode: 'no-cors', redirect: 'follow' }).catch(error => {
                console.log('Error al enviar:', error);
            });

            setTimeout(() => this.cargarNotificaciones(true), 3000);

            return true;
        } catch (error) {
            console.error('Error al marcar todas:', error);
            return false;
        }
    }

    async limpiarLeidas() {
        if (!this.url) return false;

        try {
            datosNotificaciones = datosNotificaciones.filter(n => {
                if (n.Usuario === 'todos' || n.Usuario === this.usuarioActual) {
                    return !esNotificacionLeida(n);
                }
                return true;
            });
            actualizarPanelNotificaciones();

            const _hojaNotif5 = (this.url.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notificaciones';
            const urlLimpia = this.url.split('?')[0] + '?' + new URLSearchParams({ hoja: _hojaNotif5, action: 'limpiarLeidas', usuario: this.usuarioActual }).toString();
            fetch(urlLimpia, { method: 'POST', mode: 'no-cors', redirect: 'follow' }).catch(error => {
                console.log('Error al enviar:', error);
            });

            setTimeout(() => this.cargarNotificaciones(true), 3000);

            return true;
        } catch (error) {
            console.error('Error al limpiar:', error);
            return false;
        }
    }

    generarIdUnico(tipo, contenido) {
        // La parte única (tiempo + aleatorio) va al FINAL y nunca se recorta,
        // para que dos notificaciones nunca compartan el mismo ID.
        const base = `${tipo}-${contenido}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 60);
        const unico = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        return `${base}-${unico}`;
    }

    obtenerMisNotificaciones() {
        return datosNotificaciones.filter(n => 
            n.Usuario === 'todos' || n.Usuario === this.usuarioActual
        );
    }

    obtenerNoLeidas() {
        return this.obtenerMisNotificaciones().filter(n => !esNotificacionLeida(n));
    }
}

// ========================================
// INTERFAZ DE USUARIO
// ========================================

function toggleNotificacionesSheets() {
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (panel.classList.contains('active')) {
        if (!sistemaNotificacionesSheets) {
            inicializarSistemaNotificaciones();
        }
        
        if (!urlNotificaciones) {
            mostrarModalConfirmacion(
                '⚙️ Configuración pendiente',
                'Ve a <strong>Configuración del Sistema</strong> y agrega la URL de Google Sheets.',
                false,
                null,
                'Entendido'
            );
            panel.classList.remove('active');
            overlay.classList.remove('active');
            return;
        }
        
        const tabs = document.querySelectorAll('.notif-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const tabTodas = document.querySelector('.notif-tab[data-tab="todas"]');
        if (tabTodas) tabTodas.classList.add('active');
        
        mostrarIndicadorActualizacion(true);
        
        sistemaNotificacionesSheets.cargarNotificaciones().then(() => {
            mostrarIndicadorActualizacion(false);
        });
    }
}

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

// ========================================
// 🆕 NUEVA FUNCIÓN: Manejar clic en notificación
// ========================================

function manejarClickNotificacion(event) {
    const notifItem = event.currentTarget;
    const idUnico = notifItem.dataset.idUnico;
    const fila = notifItem.dataset.fila;
    const ts = notifItem.dataset.ts;

    // Si ya está leída, no hacer nada
    if (notifItem.classList.contains('leida')) {
        console.log('🚫 [CLICK] Notificación ya leída, ignorando');
        return;
    }

    console.log('👆 [CLICK] Notificación clickeada (fila ' + fila + ')');

    if (sistemaNotificacionesSheets) {
        sistemaNotificacionesSheets.marcarComoLeida(fila, ts, idUnico);
    }
}

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
        notifFiltradas = misNotificaciones.filter(n => !esNotificacionLeida(n));
    } else if (filtro === 'leidas') {
        notifFiltradas = misNotificaciones.filter(n => esNotificacionLeida(n));
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
    
    notifFiltradas.sort((a, b) => {
        const fechaA = new Date(a.Timestamp || 0);
        const fechaB = new Date(b.Timestamp || 0);
        return fechaB - fechaA;
    });
    
    // 🆕 RENDERIZAR SIN ONCLICK INLINE
    content.innerHTML = notifFiltradas.map(notif => {
        const prioridad = notif.Prioridad || 'info';
        const leida = esNotificacionLeida(notif);
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
        
        const estiloNotif = leida
            ? `background: #f8f9fa; opacity: 0.85; border-left: 4px solid #6c757d;`
            : `background: white; border-left: 4px solid ${colorBorde[prioridad]}; cursor: pointer;`;

        const estudianteNotif = extraerEstudianteDeNotif(notif);
        const _estEsc = estudianteNotif.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const _fila = (notif._fila != null ? notif._fila : '');
        const _ts = String(notif.Timestamp || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

        return `
            <div class="notif-item ${leida ? 'leida' : 'sin-leer'}"
                 data-id-unico="${notif.ID_Unico}"
                 data-fila="${_fila}"
                 data-ts="${_ts}"
                 style="${estiloNotif}">
                <div class="notif-header-item">
                    <span class="notif-badge-type badge-${prioridad}">
                        ${iconosPrioridad[prioridad]} ${prioridad.toUpperCase()}
                    </span>
                    <span class="notif-fecha">${fechaTexto}</span>
                    ${leida ? '<span class="notif-estado-leida">✓ Leída</span>' : ''}
                </div>
                <h4 class="notif-titulo" style="${leida ? 'color: #6c757d;' : ''}">${notif.Titulo}</h4>
                <p class="notif-mensaje" style="${leida ? 'color: #868e96;' : ''}">${notif.Mensaje}</p>
                <div class="notif-acciones">
                    ${!leida ? '<span class="notif-nuevo">🆕 NUEVA</span>' : '<span class="notif-archivada">📂 Archivada</span>'}
                    ${estudianteNotif ? `<button class="btn-ver-historial-notif" data-estudiante="${_estEsc}">👆 Clic para ver el historial</button>` : ''}
                    <button class="btn-eliminar-notif" data-id="${notif.ID_Unico}" data-fila="${_fila}" data-ts="${_ts}">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // 🆕 AGREGAR EVENT LISTENERS después de renderizar
    agregarEventListeners();
}

// 🆕 NUEVA FUNCIÓN: Agregar event listeners
function agregarEventListeners() {
    // Event listeners para notificaciones
    document.querySelectorAll('.notif-item.sin-leer').forEach(item => {
        item.addEventListener('click', manejarClickNotificacion);
    });
    
    // Event listeners para botones eliminar
    document.querySelectorAll('.btn-eliminar-notif').forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            eliminarNotifSheets(this.dataset.fila, this.dataset.ts, this.dataset.id);
        });
    });

    // Event listeners para "Clic para ver el historial"
    document.querySelectorAll('.btn-ver-historial-notif').forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            const estudiante = this.dataset.estudiante;
            if (!estudiante) return;
            if (typeof abrirHistorialEstudiante === 'function') {
                // Cerrar el panel de notificaciones antes de abrir el historial
                const panel = document.getElementById('notifPanel');
                if (panel && panel.classList.contains('active') && typeof toggleNotificacionesSheets === 'function') {
                    toggleNotificacionesSheets();
                }
                setTimeout(() => abrirHistorialEstudiante(estudiante), 150);
            } else {
                console.warn('⚠️ abrirHistorialEstudiante no está disponible en esta página');
            }
        });
    });
}

function actualizarPanelNotificaciones() {
    if (!document.getElementById('notifPanel')) return; // No existe en esta página
    const tabActiva = document.querySelector('.notif-tab.active');
    const filtro = tabActiva ? tabActiva.getAttribute('data-tab') : 'todas';
    
    mostrarNotificacionesSheets(filtro);
    actualizarContadoresNotificaciones();
}

function actualizarContadoresNotificaciones() {
    if (!sistemaNotificacionesSheets) return;
    
    const misNotificaciones = sistemaNotificacionesSheets.obtenerMisNotificaciones();
    const total = misNotificaciones.length;
    const noLeidas = misNotificaciones.filter(n => !esNotificacionLeida(n)).length;
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

function cambiarTabNotifSheets(tab) {
    const tabs = document.querySelectorAll('.notif-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    mostrarNotificacionesSheets(tab);
}

async function eliminarNotifSheets(fila, ts, idUnico) {
    if (!sistemaNotificacionesSheets) return;

    const notif = datosNotificaciones.find(n => String(n._fila) === String(fila))
               || datosNotificaciones.find(n => n.Timestamp === ts);
    if (!notif) return;

    mostrarModalConfirmacion(
        '🗑️ Eliminar notificación',
        `¿Estás seguro de que deseas eliminar esta notificación?<br><br><strong>${notif.Titulo}</strong>`,
        true,
        async function() {
            await sistemaNotificacionesSheets.eliminarNotificacion(fila, ts, idUnico);
            mostrarNotificacionToast('✅ Notificación eliminada');
        }
    );
}

async function marcarTodasNotifLeidas() {
    if (!sistemaNotificacionesSheets) return;
    
    await sistemaNotificacionesSheets.marcarTodasLeidas();
    mostrarNotificacionToast('✅ Todas marcadas como leídas');
}

async function limpiarNotifLeidas() {
    if (!sistemaNotificacionesSheets) return;
    
    const misNotificaciones = sistemaNotificacionesSheets.obtenerMisNotificaciones();
    const cantidadLeidas = misNotificaciones.filter(n => esNotificacionLeida(n)).length;
    
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
        `¿Estás seguro de que deseas eliminar <strong>${cantidadLeidas}</strong> notificación${cantidadLeidas > 1 ? 'es' : ''} leída${cantidadLeidas > 1 ? 's' : ''}?`,
        true,
        async function() {
            await sistemaNotificacionesSheets.limpiarLeidas();
            mostrarNotificacionToast('✅ Notificaciones eliminadas');
        }
    );
}

// ========================================
// FUNCIONES DE CREACIÓN
// ========================================

async function notificarNuevaIncidencia(estudiante, tipoFalta, tipoConducta, docente, curso) {
    // Si no está inicializado, intentar inicializar ahora
    if (!sistemaNotificacionesSheets) {
        console.log('⚠️ sistemaNotificacionesSheets no inicializado, intentando inicializar...');
        inicializarSistemaNotificaciones();
        // Esperar un momento para que se inicialice
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!sistemaNotificacionesSheets) {
        console.warn('❌ No se pudo inicializar el sistema de notificaciones');
        return;
    }
    
    // TODAS las incidencias son importantes (badge amarillo)
    const prioridad = 'importante';
    
    const cursoTexto = curso ? ` | Curso: <strong>${curso}</strong>` : '';
    const docenteTexto = docente ? ` | Docente: <strong>${docente}</strong>` : '';
    
    await sistemaNotificacionesSheets.crearNotificacion(
        'incidencia',
        'Nueva incidencia registrada',
        `Se ha registrado una <strong>Falta ${tipoFalta}</strong> para <strong>${estudiante}</strong> por ${tipoConducta}${cursoTexto}${docenteTexto}.`,
        prioridad,
        'todos'
    );
}

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

async function notificarTardanzasCriticas(estudiante, cantidad) {
    if (!sistemaNotificacionesSheets) return;
    
    const idUnico = `tardanzas-${estudiante}-${cantidad}-${new Date().getMonth()}-${new Date().getFullYear()}`;
    
    const existe = datosNotificaciones.some(n => n.ID_Unico === idUnico);
    if (existe) return;
    
    await sistemaNotificacionesSheets.crearNotificacion(
        'tardanzas',
        'Estudiante con 3 tardanzas',
        `<strong>${estudiante}</strong> ha alcanzado ${cantidad} tardanzas este mes.`,
        'urgente',
        'todos'
    );
}

// ========================================
// INICIALIZACIÓN
// ========================================

function inicializarSistemaNotificaciones() {
    try {
        if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.urlNotificaciones) {
            urlNotificaciones = CONFIG.urlNotificaciones;
        }
        
        if (urlNotificaciones) {
            sistemaNotificacionesSheets = new NotificacionesGoogleSheets();
            
            sistemaNotificacionesSheets.cargarNotificaciones(true).catch(error => {
                console.log('Error al cargar inicial:', error);
            });
            
            if (intervaloActualizacionNotificaciones) {
                clearInterval(intervaloActualizacionNotificaciones);
            }
            if (intervaloActualizacionBackground) {
                clearInterval(intervaloActualizacionBackground);
            }
            
            intervaloActualizacionNotificaciones = setInterval(() => {
                try {
                    const panel = document.getElementById('notifPanel');
                    if (panel && panel.classList.contains('active') && sistemaNotificacionesSheets) {
                        sistemaNotificacionesSheets.cargarNotificaciones(true).catch(error => {
                            console.log('Error al actualizar:', error);
                        });
                    }
                } catch (error) {
                    console.log('Error en intervalo:', error);
                }
            }, 5000);
            
            intervaloActualizacionBackground = setInterval(() => {
                try {
                    const panel = document.getElementById('notifPanel');
                    if ((!panel || !panel.classList.contains('active')) && sistemaNotificacionesSheets) {
                        sistemaNotificacionesSheets.cargarNotificaciones(true).catch(error => {
                            console.log('Error en background:', error);
                        });
                    }
                } catch (error) {
                    console.log('Error en background:', error);
                }
            }, 15000);
            
            console.log('✅ Sistema de notificaciones inicializado');
            console.log('🔧 Usando EVENT LISTENERS (no onclick inline)');
            console.log('⚡ Actualización: 5s | 15s');
        }
    } catch (error) {
        console.log('❌ Error al inicializar:', error);
    }
}

function actualizarURLNotificaciones(nuevaURL) {
    urlNotificaciones = nuevaURL;
    if (typeof CONFIG !== 'undefined' && CONFIG) {
        CONFIG.urlNotificaciones = nuevaURL;
    }
    inicializarSistemaNotificaciones();
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

if (typeof mostrarModalConfirmacion === 'undefined') {
    function mostrarModalConfirmacion(titulo, mensaje, mostrarCancelar, callbackConfirmar, textoConfirmar = 'Confirmar') {
        if (confirm(mensaje.replace(/<[^>]*>/g, ''))) {
            if (callbackConfirmar) callbackConfirmar();
        }
    }
}

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
// ESTILOS CSS
// ========================================

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    .notif-item.sin-leer {
        transition: all 0.3s ease;
    }
    
    .notif-item.sin-leer:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notif-item.leida {
        transition: all 0.3s ease;
        cursor: default !important;
    }
    
    .notif-item.leida:hover {
        opacity: 1 !important;
    }
    
    .notif-estado-leida {
        display: inline-block;
        background: #28a745;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 8px;
    }
    
    .notif-nuevo {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
        animation: pulse 2s ease-in-out infinite;
    }
    
    .notif-archivada {
        background: #6c757d;
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 600;
        opacity: 0.7;
    }

    .btn-ver-historial-notif {
        background: transparent;
        color: #d97706;
        border: none;
        padding: 4px 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.2s, color 0.2s;
    }
    .btn-ver-historial-notif:hover {
        background: rgba(217, 119, 6, 0.12);
        color: #b45309;
    }
`;
document.head.appendChild(styleSheet);

console.log('✅ Sistema de notificaciones CORREGIDO cargado');
console.log('🔧 Event listeners en lugar de onclick inline');
console.log('🚀 Compatible iOS/Android/Desktop');
