// ========================================
// SISTEMA DE NOTAS RÁPIDAS - CENSA
// Con Google Sheets (como los demás módulos)
// ========================================

// 👉 CONFIGURACIÓN DE URL - Cambia aquí la URL de Google Sheets si es necesario
let urlNotasRapidas = 'https://script.google.com/macros/s/AKfycbxzxH-mSiQnYZAADC7JLwnfbYvKYwNyOje1Tje77PP8u9Gv_ksx_CEk0J8R1e1fHiTM/exec?hoja=Notas';
let datosNotas = [];

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
    if (!urlNotasRapidas) {
        console.log('⚠️ No hay URL de notas configurada');
        notificaciones.advertencia(
            'Configuración pendiente',
            'Ve a Configuración y agrega la URL de Google Sheets para Notas'
        );
        return [];
    }
    
    console.log('📥 Cargando notas desde:', urlNotasRapidas);
    
    // Usar la función global que ya funciona con los otros módulos
    try {
        const data = await cargarDatosDesdeGoogleSheets(urlNotasRapidas);
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
    if (!urlNotasRapidas) {
        notificaciones.error('Error de configuración', 'No hay URL de Google Sheets configurada');
        return false;
    }

    try {
        const response = await fetch(urlNotasRapidas, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({...nota, hoja: (urlNotasRapidas.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notas'})
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
    if (!urlNotasRapidas) {
        notificaciones.error('Error de configuración', 'No hay URL de Google Sheets configurada');
        return false;
    }

    try {
        const response = await fetch(urlNotasRapidas, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({...nota, accion: 'actualizar', hoja: (urlNotasRapidas.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notas'})
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
    if (!urlNotasRapidas) {
        notificaciones.error('Error de configuración', 'No hay URL de Google Sheets configurada');
        return false;
    }

    try {
        const response = await fetch(urlNotasRapidas, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: id, accion: 'eliminar', hoja: (urlNotasRapidas.match(/[?&]hoja=([^&]+)/) || [])[1] || 'Notas'})
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
        this.tabActiva = 'hoy'; // Pestaña por defecto
        this.notificacionMostrada = false; // Para mostrar notificación solo una vez
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
        // Obtener el curso del estudiante seleccionado
        const curso = estudianteSeleccionadoNotaRapida ? estudianteSeleccionadoNotaRapida.curso : '';
        
        const nuevaNota = {
            id: Date.now().toString(),
            estudiante: estudiante,
            curso: curso, // ✨ NUEVO: Guardar el curso
            tipo: tipo,
            prioridad: prioridad,
            texto: texto,
            fechaAccion: fechaAccion || '', // Nueva fecha de acción
            fecha: new Date().toISOString(), // Fecha de creación
            dispositivo: this.obtenerDispositivo(),
            timestamp: new Date().toLocaleString('es-DO'),
            editado: ''
        };

        // Guardar en Google Sheets
        const guardado = await guardarNotaEnGoogleSheets(nuevaNota);
        
        if (guardado) {
            // Agregar localmente
            this.notas.unshift(nuevaNota);
            datosNotas = this.notas;
            this.actualizarVista();
            this.actualizarContador();
            
            notificaciones.exito(
                'Nota guardada',
                'Disponible automáticamente en todos tus dispositivos'
            );
            
            return nuevaNota;
        } else {
            return null;
        }
    }

    async editarNota(id, estudiante, tipo, prioridad, texto, fechaAccion = null) {
        const index = this.notas.findIndex(n => n.id === id);
        if (index !== -1) {
            // Obtener el curso del estudiante seleccionado o mantener el existente
            const curso = estudianteSeleccionadoNotaRapida ? estudianteSeleccionadoNotaRapida.curso : this.notas[index].curso;
            
            const notaActualizada = {
                ...this.notas[index],
                estudiante: estudiante,
                curso: curso, // ✨ Mantener o actualizar el curso
                tipo: tipo,
                prioridad: prioridad,
                texto: texto,
                fechaAccion: fechaAccion || '',
                editado: new Date().toISOString()
            };

            // Actualizar en Google Sheets
            const actualizado = await actualizarNotaEnGoogleSheets(notaActualizada);
            
            if (actualizado) {
                this.notas[index] = notaActualizada;
                datosNotas = this.notas;
                this.actualizarVista();
                
                notificaciones.exito(
                    'Nota actualizada',
                    'Cambios sincronizados en todos tus dispositivos'
                );
            }
        }
    }

    async eliminarNota(id) {
        // Eliminar de Google Sheets
        const eliminado = await eliminarNotaDeGoogleSheets(id);
        
        if (eliminado) {
            // Eliminar localmente
            this.notas = this.notas.filter(n => n.id !== id);
            datosNotas = this.notas;
            this.actualizarVista();
            this.actualizarContador();
            
            notificaciones.exito(
                'Nota eliminada',
                'Eliminada de todos tus dispositivos'
            );
        }
    }

    obtenerNota(id) {
        return this.notas.find(n => n.id === id);
    }

    async recargarNotas() {
        console.log('🔄 Recargando notas...');
        this.mostrarCargando();
        await this.cargarNotas();
        this.ocultarCargando();
        this.actualizarVista();
        this.actualizarContador();
        
        console.log(`📊 Total de notas cargadas: ${this.notas.length}`);
        
        // Mostrar notificación según el resultado
        if (this.notas.length > 0) {
            notificaciones.exito(
                'Sincronizado',
                `${this.notas.length} nota${this.notas.length !== 1 ? 's' : ''} cargada${this.notas.length !== 1 ? 's' : ''}`
            );
        } else {
            // No mostrar nada si no hay notas (es normal)
            console.log('ℹ️ No hay notas pendientes');
        }
    }

    obtenerDispositivo() {
        const width = window.innerWidth;
        if (width < 768) return 'Móvil';
        if (width < 1024) return 'Tablet';
        return 'PC';
    }
    
    formatearFecha(fecha) {
        const ahora = new Date();
        const diff = ahora - fecha;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias < 7) return `Hace ${dias}d`;
        
        return fecha.toLocaleDateString('es-DO', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    actualizarContador() {
        const contador = document.getElementById('contadorNotas');
        if (contador) {
            // Contar notas para hoy
            const ahora = new Date();
            ahora.setHours(0, 0, 0, 0);
            const finHoy = new Date(ahora);
            finHoy.setHours(23, 59, 59, 999);
            
            const notasHoy = this.notas.filter(nota => {
                if (!nota.fechaAccion) return true; // Sin fecha también cuenta como "hoy"
                const fechaNota = new Date(nota.fechaAccion);
                return fechaNota <= finHoy; // Incluye vencidas y de hoy
            });
            
            // Actualizar badge
            const total = this.notas.length;
            const hoy = notasHoy.length;
            
            if (hoy > 0) {
                // Mostrar cantidad para hoy con fuego
                contador.innerHTML = `${hoy} 🔥`;
                contador.style.background = '#ea580c';
            } else if (total > 0) {
                // Solo mostrar total
                contador.textContent = total;
                contador.style.background = '#059669';
            }
            
            contador.style.display = total > 0 ? 'flex' : 'none';
            
            // Mostrar notificación al abrir el sistema (solo una vez)
            if (!this.notificacionMostrada && hoy > 0) {
                setTimeout(() => {
                    mostrarNotificacionNotasHoy();
                }, 1000);
                this.notificacionMostrada = true;
            }
        }
    }

    actualizarVista() {
        if (this.cargando) return;

        const container = document.getElementById('notasContent');
        const vacio = document.getElementById('notasVacio');
        
        // Actualizar contadores de pestañas
        actualizarContadoresPestanas();
        
        // Filtrar notas según pestaña activa
        let notasFiltradas = this.filtrarNotasPorTab();
        
        if (notasFiltradas.length === 0) {
            const mensajesVacio = {
                'hoy': {
                    icono: '✨',
                    titulo: 'No hay tareas para hoy',
                    subtitulo: 'Disfruta tu día libre de pendientes'
                },
                'proximas': {
                    icono: '📅',
                    titulo: 'No hay tareas programadas',
                    subtitulo: 'Agrega notas con fecha para planificar'
                },
                'todas': {
                    icono: '📭',
                    titulo: 'No hay notas pendientes',
                    subtitulo: 'Crea una nota para empezar'
                }
            };
            
            const mensaje = mensajesVacio[this.tabActiva] || mensajesVacio.todas;
            
            container.innerHTML = `
                <div class="notas-vacio">
                    <div style="font-size: 3em;">${mensaje.icono}</div>
                    <p>${mensaje.titulo}</p>
                    <p style="font-size: 0.9em; margin-top: 5px;">${mensaje.subtitulo}</p>
                </div>
            `;
            return;
        }

        if (vacio) vacio.style.display = 'none';
        container.innerHTML = '';

        // Ordenar notas según la pestaña
        const notasOrdenadas = this.ordenarNotas(notasFiltradas);

        notasOrdenadas.forEach(nota => {
            const notaElement = this.crearElementoNota(nota);
            container.appendChild(notaElement);
        });
    }
    
    filtrarNotasPorTab() {
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0); // Inicio del día
        const finHoy = new Date(ahora);
        finHoy.setHours(23, 59, 59, 999); // Fin del día
        
        switch(this.tabActiva) {
            case 'hoy':
                // Notas para hoy o vencidas
                return this.notas.filter(nota => {
                    if (!nota.fechaAccion) {
                        // Notas sin fecha también se muestran en "hoy"
                        return true;
                    }
                    const fechaNota = new Date(nota.fechaAccion);
                    // Incluir vencidas y de hoy
                    return fechaNota <= finHoy;
                });
                
            case 'proximas':
                // Solo notas futuras (después de hoy)
                return this.notas.filter(nota => {
                    if (!nota.fechaAccion) return false;
                    const fechaNota = new Date(nota.fechaAccion);
                    return fechaNota > finHoy;
                });
                
            case 'todas':
            default:
                return this.notas;
        }
    }
    
    ordenarNotas(notas) {
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const finHoy = new Date(ahora);
        finHoy.setHours(23, 59, 59, 999);
        
        return [...notas].sort((a, b) => {
            const prioridadOrden = { alta: 1, media: 2, baja: 3 };
            
            // Si ambas tienen fecha de acción
            if (a.fechaAccion && b.fechaAccion) {
                const fechaA = new Date(a.fechaAccion);
                const fechaB = new Date(b.fechaAccion);
                
                // Vencidas primero (en rojo)
                const aVencida = fechaA < ahora;
                const bVencida = fechaB < ahora;
                if (aVencida && !bVencida) return -1;
                if (!aVencida && bVencida) return 1;
                
                // Luego por fecha
                if (fechaA.getTime() !== fechaB.getTime()) {
                    return fechaA - fechaB;
                }
            }
            
            // Si solo una tiene fecha, esa va primero
            if (a.fechaAccion && !b.fechaAccion) return -1;
            if (!a.fechaAccion && b.fechaAccion) return 1;
            
            // Si ninguna tiene fecha o empate, ordenar por prioridad
            if (prioridadOrden[a.prioridad] !== prioridadOrden[b.prioridad]) {
                return prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
            }
            
            // Por último, por fecha de creación (más recientes primero)
            return new Date(b.fecha) - new Date(a.fecha);
        });
    }

    crearElementoNota(nota) {
        const div = document.createElement('div');
        
        // Determinar si está vencida
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const esVencida = nota.fechaAccion && new Date(nota.fechaAccion) < ahora;
        
        div.className = `nota-item prioridad-${nota.prioridad}${esVencida ? ' nota-vencida' : ''}`;
        
        const dispositivo = nota.dispositivo ? `<span style="font-size: 0.85em; color: #9ca3af;">📱 ${nota.dispositivo}</span>` : '';
        
        // Formatear fecha de acción si existe
        let fechaAccionHTML = '';
        if (nota.fechaAccion) {
            const fechaAccion = new Date(nota.fechaAccion);
            const esHoy = this.esFechaHoy(fechaAccion);
            const esMañana = this.esFechaMañana(fechaAccion);
            
            let textoFecha = '';
            if (esVencida) {
                textoFecha = `⚠️ VENCIDA - ${this.formatearFechaAccion(fechaAccion)}`;
            } else if (esHoy) {
                const hora = fechaAccion.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
                textoFecha = `🔥 HOY ${hora}`;
            } else if (esMañana) {
                const hora = fechaAccion.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
                textoFecha = `📅 MAÑANA ${hora}`;
            } else {
                textoFecha = `📅 ${this.formatearFechaAccion(fechaAccion)}`;
            }
            
            const colorFecha = esVencida ? '#dc2626' : esHoy ? '#ea580c' : '#059669';
            fechaAccionHTML = `<div style="font-weight:600;color:${colorFecha};margin-top:6px;font-size:0.9em;">${textoFecha}</div>`;
        }
        
        // Mostrar curso si existe
        const cursoHTML = nota.curso ? ` <span style="color:#059669;font-weight:600;">📚 ${nota.curso}</span>` : '';
        
        div.innerHTML = `
            <div class="nota-header-item">
                <span class="nota-tipo ${nota.tipo}">${this.obtenerIconoTipo(nota.tipo)} ${this.obtenerNombreTipo(nota.tipo)}</span>
                <span class="nota-prioridad ${nota.prioridad}">${this.obtenerIconoPrioridad(nota.prioridad)} ${nota.prioridad.toUpperCase()}</span>
            </div>
            <div class="nota-estudiante">👤 ${nota.estudiante}${cursoHTML}</div>
            <div class="nota-texto">${nota.texto}</div>
            ${fechaAccionHTML}
            <div class="nota-fecha">🕐 Creada ${this.formatearFecha(new Date(nota.fecha))} ${dispositivo}</div>
            <div class="nota-acciones">
                <button class="nota-btn nota-btn-registrar" data-nota-id="${nota.id}" data-accion="registrar">
                    📋 Registrar
                </button>
                <button class="nota-btn nota-btn-editar" data-nota-id="${nota.id}" data-accion="editar">
                    ✏️ Editar
                </button>
                <button class="nota-btn nota-btn-borrar" data-nota-id="${nota.id}" data-accion="borrar">
                    🗑️ Borrar
                </button>
            </div>
        `;
        
        // Agregar event listeners a los botones
        const btnRegistrar = div.querySelector('[data-accion="registrar"]');
        const btnEditar = div.querySelector('[data-accion="editar"]');
        const btnBorrar = div.querySelector('[data-accion="borrar"]');
        
        if (btnRegistrar) {
            btnRegistrar.addEventListener('click', () => this.registrarIncidencia(nota.id));
        }
        if (btnEditar) {
            btnEditar.addEventListener('click', () => this.iniciarEdicion(nota.id));
        }
        if (btnBorrar) {
            btnBorrar.addEventListener('click', () => this.confirmarEliminar(nota.id));
        }
        
        return div;
    }
    
    esFechaHoy(fecha) {
        const hoy = new Date();
        return fecha.getDate() === hoy.getDate() &&
               fecha.getMonth() === hoy.getMonth() &&
               fecha.getFullYear() === hoy.getFullYear();
    }
    
    esFechaMañana(fecha) {
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        return fecha.getDate() === mañana.getDate() &&
               fecha.getMonth() === mañana.getMonth() &&
               fecha.getFullYear() === mañana.getFullYear();
    }
    
    formatearFechaAccion(fecha) {
        const opciones = { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return fecha.toLocaleDateString('es-DO', opciones);
    }

    obtenerIconoTipo(tipo) {
        const iconos = {
            tardanza: '📚',
            incidencia: '⚠️',
            llamada: '📞',
            reunion: '👥',
            recordatorio: '🔔',
            otros: '📝'
        };
        return iconos[tipo] || '📝';
    }

    obtenerNombreTipo(tipo) {
        const nombres = {
            tardanza: 'Tardanza',
            incidencia: 'Incidencia',
            llamada: 'Llamada Pendiente',
            reunion: 'Reunión',
            recordatorio: 'Recordatorio',
            otros: 'Otros'
        };
        return nombres[tipo] || tipo;
    }

    obtenerIconoPrioridad(prioridad) {
        const iconos = {
            alta: '🔴',
            media: '🟡',
            baja: '🟢'
        };
        return iconos[prioridad] || '⚪';
    }

    registrarIncidencia(id) {
        const nota = this.obtenerNota(id);
        if (!nota) return;

        // Determinar a qué módulo redirigir según el tipo
        let moduloDestino = null;
        let nombreModulo = '';
        
        switch(nota.tipo) {
            case 'tardanza':
                moduloDestino = 'tardanzas';
                nombreModulo = 'Tardanzas';
                break;
            case 'incidencia':
                moduloDestino = 'incidencias';
                nombreModulo = 'Incidencias';
                break;
            case 'reunion':
                moduloDestino = 'reuniones';
                nombreModulo = 'Reuniones';
                break;
            default:
                // Si es otro tipo (llamada, recordatorio, otros), no hacer nada
                notificaciones.info(
                    'Tipo de nota',
                    'Este tipo de nota no se puede registrar directamente en un módulo'
                );
                return;
        }

        closeNotasPanel();

        setTimeout(() => {
            openModule(moduloDestino);

            setTimeout(() => {
                // Pre-llenar según el módulo
                if (moduloDestino === 'tardanzas') {
                    // Formulario de tardanzas
                    const estudianteInput = document.querySelector('#tardanzas input[placeholder*="estudiante"]');
                    const fechaInput = document.querySelector('#tardanzas input[type="date"]');
                    const horaInput = document.querySelector('#tardanzas input[type="time"]');
                    const motivoTextarea = document.querySelector('#tardanzas textarea');

                    if (estudianteInput) estudianteInput.value = nota.estudiante;
                    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
                    if (horaInput) horaInput.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (motivoTextarea) motivoTextarea.value = nota.texto;

                } else if (moduloDestino === 'incidencias') {
                    // Formulario de incidencias
                    const estudianteInput = document.querySelector('#incidencias input[placeholder*="estudiante"]');
                    const tipoSelect = document.querySelector('#incidencias select');
                    const detallesTextarea = document.querySelector('#incidencias textarea');

                    if (estudianteInput) estudianteInput.value = nota.estudiante;
                    if (tipoSelect) {
                        // Mapear prioridad a tipo de incidencia
                        const mapeoTipos = {
                            'alta': 'Grave',
                            'media': 'Leve',
                            'baja': 'Leve'
                        };
                        tipoSelect.value = mapeoTipos[nota.prioridad] || 'Leve';
                    }
                    if (detallesTextarea) detallesTextarea.value = nota.texto;

                } else if (moduloDestino === 'reuniones') {
                    // Formulario de reuniones
                    const estudianteInput = document.querySelector('#reuniones input[placeholder*="estudiante"]');
                    const fechaInput = document.querySelector('#reuniones input[type="date"]');
                    const horaInput = document.querySelector('#reuniones input[type="time"]');
                    const motivoTextarea = document.querySelector('#reuniones textarea[placeholder*="motivo"]');

                    if (estudianteInput) estudianteInput.value = nota.estudiante;
                    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
                    if (horaInput) horaInput.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (motivoTextarea) motivoTextarea.value = nota.texto;
                }

                // Scroll al formulario
                const formulario = document.querySelector(`#${moduloDestino} form`);
                if (formulario) {
                    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                notificaciones.info(
                    'Datos cargados',
                    `Completa los campos restantes en ${nombreModulo}, guarda el registro y luego borra esta nota`,
                    6000
                );
            }, 300);
        }, 300);
    }

    iniciarEdicion(id) {
        const nota = this.obtenerNota(id);
        if (!nota) return;

        this.notaEditando = id;
        
        document.getElementById('notaEstudiante').value = nota.estudiante;
        document.getElementById('notaTipo').value = nota.tipo;
        document.getElementById('notaPrioridad').value = nota.prioridad;
        document.getElementById('notaTexto').value = nota.texto;
        
        // Intentar obtener estudiantes de múltiples fuentes
        let estudiantes = [];
        if (window.datosEstudiantes && Array.isArray(window.datosEstudiantes)) {
            estudiantes = window.datosEstudiantes;
        } else if (typeof datosEstudiantes !== 'undefined' && Array.isArray(datosEstudiantes)) {
            estudiantes = datosEstudiantes;
        } else if (typeof globalThis !== 'undefined' && globalThis.datosEstudiantes) {
            estudiantes = globalThis.datosEstudiantes;
        }
        
        if (estudiantes.length > 0) {
            const estudiante = estudiantes.find(est => {
                const nombreCompleto = `${est['Nombre'] || ''} ${est['Apellidos'] || ''}`;
                return nombreCompleto.toLowerCase() === nota.estudiante.toLowerCase();
            });
            
            if (estudiante && estudiante['Curso']) {
                const cursoDiv = document.getElementById('cursoNotaRapida');
                if (cursoDiv) {
                    cursoDiv.textContent = `📚 ${estudiante['Curso']}`;
                    cursoDiv.style.display = 'block';
                    estudianteSeleccionadoNotaRapida = { 
                        nombre: nota.estudiante, 
                        curso: estudiante['Curso'] 
                    };
                }
            }
        }
        
        // Cargar fecha de acción si existe
        if (nota.fechaAccion) {
            // Convertir a formato datetime-local (YYYY-MM-DDTHH:MM)
            const fecha = new Date(nota.fechaAccion);
            const year = fecha.getFullYear();
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const day = String(fecha.getDate()).padStart(2, '0');
            const hours = String(fecha.getHours()).padStart(2, '0');
            const minutes = String(fecha.getMinutes()).padStart(2, '0');
            document.getElementById('notaFecha').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            document.getElementById('notaFecha').value = '';
        }

        mostrarFormNuevaNota();

        const btnGuardar = document.querySelector('.btn-guardar-nota');
        btnGuardar.textContent = '💾 Actualizar';
    }

    confirmarEliminar(id) {
        const nota = this.obtenerNota(id);
        if (!nota) return;

        const notifConfirm = notificaciones.advertencia(
            '¿Eliminar nota?',
            `${nota.estudiante} - ${nota.texto.substring(0, 40)}...`,
            0
        );

        const botonesDiv = document.createElement('div');
        botonesDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 10px;';
        
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Sí, eliminar';
        btnEliminar.style.cssText = 'flex: 1; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;';
        
        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = 'flex: 1; padding: 8px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;';
        
        // Event listener para eliminar
        btnEliminar.addEventListener('click', async () => {
            await this.eliminarNotaConfirmada(id);
            notifConfirm.remove();
        });
        
        // Event listener para cancelar
        btnCancelar.addEventListener('click', () => {
            notifConfirm.remove();
        });
        
        botonesDiv.appendChild(btnEliminar);
        botonesDiv.appendChild(btnCancelar);
        notifConfirm.querySelector('.notificacion-contenido').appendChild(botonesDiv);
    }

    async eliminarNotaConfirmada(id) {
        await this.eliminarNota(id);
    }
}

// ========================================
// FUNCIONES GLOBALES DE INTERFAZ
// ========================================

let sistemaNotas = null;

// Inicializar cuando se configure la URL
function inicializarSistemaNotas() {
    if (!sistemaNotas) {
        sistemaNotas = new NotasRapidas();
    }
    sistemaNotas.inicializar();
}

function toggleNotasPanel() {
    const overlay = document.getElementById('notasOverlay');
    const panel = document.getElementById('notasPanel');
    
    overlay.classList.toggle('active');
    panel.classList.toggle('active');

    if (!panel.classList.contains('active')) {
        cancelarNuevaNota();
    }

    // Recargar al abrir
    if (panel.classList.contains('active')) {
        if (!sistemaNotas) {
            sistemaNotas = new NotasRapidas();
        }
        
        // Verificar que la URL esté configurada
        if (!urlNotasRapidas) {
            notificaciones.advertencia(
                'Configuración pendiente',
                'Ve a Configuración y agrega la URL de Google Sheets para Notas'
            );
            return;
        }
        
        sistemaNotas.recargarNotas();
    }
}

function closeNotasPanel() {
    const overlay = document.getElementById('notasOverlay');
    const panel = document.getElementById('notasPanel');
    
    overlay.classList.remove('active');
    panel.classList.remove('active');
    cancelarNuevaNota();
}

function mostrarFormNuevaNota() {
    const form = document.getElementById('formNuevaNota');
    form.classList.remove('oculto');
    
    // Inicializar autocompletado si no está inicializado
    setTimeout(() => {
        inicializarAutocompletadoNotaRapida();
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function cancelarNuevaNota() {
    const form = document.getElementById('formNuevaNota');
    form.classList.add('oculto');
    
    document.getElementById('notaEstudiante').value = '';
    document.getElementById('notaTipo').value = 'tardanza';
    document.getElementById('notaPrioridad').value = 'media';
    document.getElementById('notaTexto').value = '';
    document.getElementById('notaFecha').value = ''; // Limpiar fecha
    
    // Limpiar curso y sugerencias
    document.getElementById('cursoNotaRapida').style.display = 'none';
    document.getElementById('sugerenciasNotaRapida').style.display = 'none';
    estudianteSeleccionadoNotaRapida = null;
    
    if (sistemaNotas) {
        sistemaNotas.notaEditando = null;
    }
    
    const btnGuardar = document.querySelector('.btn-guardar-nota');
    if (btnGuardar) {
        btnGuardar.textContent = '💾 Guardar';
    }
}

async function guardarNota() {
    const estudiante = document.getElementById('notaEstudiante').value.trim();
    const tipo = document.getElementById('notaTipo').value;
    const prioridad = document.getElementById('notaPrioridad').value;
    const texto = document.getElementById('notaTexto').value.trim();
    const fechaAccion = document.getElementById('notaFecha').value; // NUEVO

    if (!estudiante) {
        notificaciones.advertencia('Campo requerido', 'Por favor ingresa el nombre del estudiante');
        document.getElementById('notaEstudiante').focus();
        return;
    }

    if (!texto) {
        notificaciones.advertencia('Campo requerido', 'Por favor escribe una nota');
        document.getElementById('notaTexto').focus();
        return;
    }

    if (!urlNotasRapidas) {
        notificaciones.error(
            'Configuración pendiente',
            'Ve al módulo de Configuración y agrega la URL de Google Sheets para Notas'
        );
        return;
    }

    const btnGuardar = document.querySelector('.btn-guardar-nota');
    const textoOriginal = btnGuardar.textContent;
    btnGuardar.classList.add('btn-cargando');
    btnGuardar.textContent = 'Guardando...';

    try {
        if (sistemaNotas.notaEditando) {
            await sistemaNotas.editarNota(sistemaNotas.notaEditando, estudiante, tipo, prioridad, texto, fechaAccion);
        } else {
            await sistemaNotas.agregarNota(estudiante, tipo, prioridad, texto, fechaAccion);
        }

        cancelarNuevaNota();

        const content = document.getElementById('notasContent');
        if (content) content.scrollTop = 0;
    } finally {
        btnGuardar.classList.remove('btn-cargando');
        btnGuardar.textContent = textoOriginal;
    }
}

// ========================================
// FUNCIONES PARA FECHAS RÁPIDAS (FASE 1)
// ========================================

function setFechaRapida(tipo) {
    const inputFecha = document.getElementById('notaFecha');
    if (!inputFecha) return;
    
    const ahora = new Date();
    let fechaTarget = new Date();
    
    switch(tipo) {
        case 'hoy':
            // Hoy a las 5:00 PM
            fechaTarget.setHours(17, 0, 0, 0);
            break;
        case 'manana':
            // Mañana a las 9:00 AM
            fechaTarget.setDate(fechaTarget.getDate() + 1);
            fechaTarget.setHours(9, 0, 0, 0);
            break;
        case '3dias':
            // En 3 días a las 9:00 AM
            fechaTarget.setDate(fechaTarget.getDate() + 3);
            fechaTarget.setHours(9, 0, 0, 0);
            break;
        case 'semana':
            // Próxima semana (lunes) a las 9:00 AM
            const diasHastaLunes = (8 - fechaTarget.getDay()) % 7 || 7;
            fechaTarget.setDate(fechaTarget.getDate() + diasHastaLunes);
            fechaTarget.setHours(9, 0, 0, 0);
            break;
        case 'limpiar':
            inputFecha.value = '';
            return;
    }
    
    // Formatear para datetime-local (YYYY-MM-DDTHH:MM)
    const year = fechaTarget.getFullYear();
    const month = String(fechaTarget.getMonth() + 1).padStart(2, '0');
    const day = String(fechaTarget.getDate()).padStart(2, '0');
    const hours = String(fechaTarget.getHours()).padStart(2, '0');
    const minutes = String(fechaTarget.getMinutes()).padStart(2, '0');
    
    inputFecha.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ========================================
// FUNCIONES PARA PESTAÑAS (FASE 2)
// ========================================

let tabActivaNotas = 'hoy';

function cambiarTabNotas(tab) {
    tabActivaNotas = tab;
    
    // Actualizar clases de pestañas
    document.querySelectorAll('.nota-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });
    
    // Actualizar vista de notas
    if (sistemaNotas) {
        sistemaNotas.tabActiva = tab;
        sistemaNotas.actualizarVista();
    }
}

function actualizarContadoresPestanas() {
    if (!sistemaNotas || !sistemaNotas.notas) return;
    
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0); // Inicio del día
    const finHoy = new Date(ahora);
    finHoy.setHours(23, 59, 59, 999); // Fin del día
    
    // Contar notas por categoría
    let countHoy = 0;
    let countProximas = 0;
    let countTodas = sistemaNotas.notas.length;
    
    sistemaNotas.notas.forEach(nota => {
        if (nota.fechaAccion) {
            const fechaNota = new Date(nota.fechaAccion);
            if (fechaNota >= ahora && fechaNota <= finHoy) {
                countHoy++;
            } else if (fechaNota > finHoy) {
                countProximas++;
            }
        }
    });
    
    // Actualizar badges
    const badgeHoy = document.getElementById('countHoy');
    const badgeProximas = document.getElementById('countProximas');
    const badgeTodas = document.getElementById('countTodas');
    
    if (badgeHoy) badgeHoy.textContent = countHoy;
    if (badgeProximas) badgeProximas.textContent = countProximas;
    if (badgeTodas) badgeTodas.textContent = countTodas;
}

// ========================================
// FUNCIONES PARA NOTIFICACIÓN INICIAL (FASE 3)
// ========================================

function mostrarNotificacionNotasHoy() {
    if (!sistemaNotas || !sistemaNotas.notas) return;
    
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    const finHoy = new Date(ahora);
    finHoy.setHours(23, 59, 59, 999);
    
    const notasHoy = sistemaNotas.notas.filter(nota => {
        if (!nota.fechaAccion) return false;
        const fechaNota = new Date(nota.fechaAccion);
        return fechaNota >= ahora && fechaNota <= finHoy;
    });
    
    if (notasHoy.length > 0) {
        const lista = notasHoy.slice(0, 3).map(n => 
            `• ${obtenerIconoTipo(n.tipo)} ${n.estudiante}: ${n.texto.substring(0, 40)}${n.texto.length > 40 ? '...' : ''}`
        ).join('<br>');
        
        const mensaje = notasHoy.length <= 3 ? lista : 
            `${lista}<br><em>...y ${notasHoy.length - 3} más</em>`;
        
        notificaciones.info(
            `Tienes ${notasHoy.length} tarea${notasHoy.length > 1 ? 's' : ''} para hoy`,
            mensaje,
            6000
        );
    }
}

function obtenerIconoTipo(tipo) {
    const iconos = {
        'tardanza': '📚',
        'incidencia': '⚠️',
        'llamada': '📞',
        'reunion': '👥',
        'recordatorio': '🔔',
        'otros': '📝'
    };
    return iconos[tipo] || '📝';
}

// Atajos de teclado
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        const panel = document.getElementById('notasPanel');
        if (panel && panel.classList.contains('active')) {
            e.preventDefault();
            mostrarFormNuevaNota();
        }
    }

    if (e.key === 'Escape') {
        const form = document.getElementById('formNuevaNota');
        if (form && !form.classList.contains('oculto')) {
            cancelarNuevaNota();
        } else {
            closeNotasPanel();
        }
    }
});

// ========================================
// AUTOCOMPLETADO DE ESTUDIANTES - NOTAS RÁPIDAS
// (COPIADO DEL MÓDULO DE ESTUDIANTES QUE FUNCIONA)
// ========================================

let estudianteSeleccionadoNotaRapida = null;

function inicializarAutocompletadoNotaRapida() {
    const input = document.getElementById('notaEstudiante');
    const contenedorSugerencias = document.getElementById('sugerenciasNotaRapida');
    const cursoDiv = document.getElementById('cursoNotaRapida');
    
    if (!input || !contenedorSugerencias) {
        console.warn('⚠️ No se encontraron elementos para autocompletado');
        return;
    }
    
    console.log('✅ Inicializando autocompletado de notas rápidas');
    
    input.addEventListener('input', function() {
        const texto = this.value.toLowerCase().trim();
        
        // Limpiar curso si está escribiendo
        if (cursoDiv) cursoDiv.style.display = 'none';
        estudianteSeleccionadoNotaRapida = null;
        
        if (texto.length === 0) {
            contenedorSugerencias.style.display = 'none';
            return;
        }
        
        // Obtener estudiantes de forma robusta
        let estudiantes = [];
        if (window.datosEstudiantes && Array.isArray(window.datosEstudiantes)) {
            estudiantes = window.datosEstudiantes;
        } else if (typeof datosEstudiantes !== 'undefined' && Array.isArray(datosEstudiantes)) {
            estudiantes = datosEstudiantes;
        }
        
        console.log(`🔍 Buscando "${texto}" en ${estudiantes.length} estudiantes`);
        
        if (estudiantes.length < 10) {
            contenedorSugerencias.innerHTML = `
                <div style="padding:15px;text-align:center;color:#059669;">
                    <div style="font-size:1.2em;margin-bottom:5px;">⏳</div>
                    <div>Cargando estudiantes...</div>
                    <div style="font-size:0.85em;margin-top:5px;color:#666;">
                        ${estudiantes.length} de ~400 cargados
                    </div>
                </div>
            `;
            contenedorSugerencias.style.display = 'block';
            
            // Reintentar después de 500ms
            setTimeout(() => {
                if (this.value.toLowerCase().trim() === texto) {
                    this.dispatchEvent(new Event('input'));
                }
            }, 500);
            return;
        }
        
        const coincidencias = estudiantes.filter(e => {
            const nombre = (e['Nombre Completo'] || e['Nombre'] || '').toLowerCase();
            const apellidos = (e['Apellidos'] || '').toLowerCase();
            const nombreCompleto = `${nombre} ${apellidos}`.trim();
            const curso = (e['Curso'] || '').toLowerCase();
            return nombreCompleto.includes(texto) || curso.includes(texto);
        }).slice(0, 10);
        
        console.log(`✅ Encontradas ${coincidencias.length} coincidencias`);
        
        if (coincidencias.length === 0) {
            contenedorSugerencias.innerHTML = '<div style="padding:15px;text-align:center;color:#999;">No se encontraron estudiantes</div>';
            contenedorSugerencias.style.display = 'block';
            return;
        }
        
        contenedorSugerencias.innerHTML = coincidencias.map(e => {
            const nombre = e['Nombre Completo'] || `${e['Nombre'] || ''} ${e['Apellidos'] || ''}`.trim();
            const curso = e['Curso'] || '';
            const nombreEscapado = nombre.replace(/'/g, "\\'");
            const cursoEscapado = curso.replace(/'/g, "\\'");
            
            return `
                <div onclick="seleccionarEstudianteNotaRapida('${nombreEscapado}', '${cursoEscapado}')" 
                     style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;"
                     onmouseover="this.style.background='#f0fdf4'" 
                     onmouseout="this.style.background='white'">
                    <div style="font-weight:600;">${nombre}</div>
                    <div style="font-size:0.85em;color:#666;">${curso}</div>
                </div>
            `;
        }).join('');
        
        contenedorSugerencias.style.display = 'block';
    });
    
    input.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            this.dispatchEvent(new Event('input'));
        }
    });
}

function seleccionarEstudianteNotaRapida(nombre, curso) {
    const input = document.getElementById('notaEstudiante');
    const sugerencias = document.getElementById('sugerenciasNotaRapida');
    const cursoDiv = document.getElementById('cursoNotaRapida');
    
    console.log(`✅ Seleccionado: ${nombre} - ${curso}`);
    
    input.value = nombre;
    estudianteSeleccionadoNotaRapida = { nombre, curso };
    
    // Mostrar el curso debajo del input
    if (curso && cursoDiv) {
        cursoDiv.textContent = `📚 ${curso}`;
        cursoDiv.style.display = 'block';
    }
    
    sugerencias.style.display = 'none';
}

// Cerrar sugerencias al hacer click fuera
document.addEventListener('click', function(e) {
    const sugerencias = document.getElementById('sugerenciasNotaRapida');
    const input = document.getElementById('notaEstudiante');
    
    if (sugerencias && input && e.target !== input && !sugerencias.contains(e.target)) {
        sugerencias.style.display = 'none';
    }
});

// Diagnóstico de autocompletado
setTimeout(() => {
    const input = document.getElementById('notaEstudiante');
    const sugerencias = document.getElementById('sugerenciasNotaRapida');
    const curso = document.getElementById('cursoNotaRapida');
    
    // Intentar obtener estudiantes de múltiples fuentes
    let estudiantes = [];
    let fuente = 'ninguna';
    
    if (window.datosEstudiantes && Array.isArray(window.datosEstudiantes) && window.datosEstudiantes.length > 0) {
        estudiantes = window.datosEstudiantes;
        fuente = 'window.datosEstudiantes';
    } else if (typeof datosEstudiantes !== 'undefined' && Array.isArray(datosEstudiantes) && datosEstudiantes.length > 0) {
        estudiantes = datosEstudiantes;
        fuente = 'datosEstudiantes (global)';
    } else if (typeof globalThis !== 'undefined' && globalThis.datosEstudiantes) {
        estudiantes = globalThis.datosEstudiantes;
        fuente = 'globalThis.datosEstudiantes';
    }
    
    console.log('🔍 Diagnóstico Autocompletado Notas Rápidas:');
    console.log('  Input estudiante:', input ? '✅ OK' : '❌ NO ENCONTRADO');
    console.log('  Div sugerencias:', sugerencias ? '✅ OK' : '❌ NO ENCONTRADO');
    console.log('  Div curso:', curso ? '✅ OK' : '❌ NO ENCONTRADO');
    console.log('  Fuente de datos:', fuente);
    
    const total = estudiantes.length;
    if (total === 0) {
        console.log('  datosEstudiantes: ❌ NO DISPONIBLE (0 estudiantes)');
    } else if (total < 10) {
        console.log(`  datosEstudiantes: ⚠️ Solo ${total} estudiantes (esperando más...)`);
    } else if (total < 100) {
        console.log(`  datosEstudiantes: ⏳ ${total} estudiantes cargados (cargando más...)`);
    } else {
        console.log(`  datosEstudiantes: ✅ ${total} estudiantes cargados - LISTO PARA USAR`);
    }
    
    // Verificar de nuevo después de 3 segundos
    if (total < 100) {
        setTimeout(() => {
            let estudiantesFinal = [];
            if (window.datosEstudiantes && Array.isArray(window.datosEstudiantes)) {
                estudiantesFinal = window.datosEstudiantes;
            } else if (typeof datosEstudiantes !== 'undefined' && Array.isArray(datosEstudiantes)) {
                estudiantesFinal = datosEstudiantes;
            }
            
            const totalFinal = estudiantesFinal.length;
            console.log(`📊 Actualización: ${totalFinal} estudiantes ahora disponibles`);
            if (totalFinal >= 100) {
                console.log('✅ Autocompletado LISTO para usarse');
            }
        }, 3000);
    }
}, 2000);

console.log('✅ Sistema de Notas Rápidas (Google Sheets) cargado correctamente');

// Test de funciones de autocompletado
setTimeout(() => {
    console.log('🧪 Test de funciones de autocompletado:');
    console.log('  typeof filtrarEstudiantesNotaRapida:', typeof filtrarEstudiantesNotaRapida);
    console.log('  typeof mostrarSugerenciasNotaRapida:', typeof mostrarSugerenciasNotaRapida);
    console.log('  typeof seleccionarEstudianteNotaRapida:', typeof seleccionarEstudianteNotaRapida);
    
    if (typeof filtrarEstudiantesNotaRapida === 'function') {
        console.log('  ✅ Funciones de autocompletado disponibles globalmente');
    } else {
        console.error('  ❌ ERROR: Funciones de autocompletado NO disponibles');
    }
}, 100);
