// ========================================
// SISTEMA DE NOTAS RÁPIDAS - CENSA
// Con Google Sheets (como los demás módulos)
// ========================================

// Configuración de Google Sheets
let urlNotasRapidas = ''; // Se configura desde el módulo de configuración
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

    async agregarNota(estudiante, tipo, prioridad, texto) {
        const nuevaNota = {
            id: Date.now().toString(),
            estudiante: estudiante,
            tipo: tipo,
            prioridad: prioridad,
            texto: texto,
            fecha: new Date().toISOString(),
            dispositivo: this.obtenerDispositivo(),
            timestamp: new Date().toLocaleString('es-DO')
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

    async editarNota(id, estudiante, tipo, prioridad, texto) {
        const index = this.notas.findIndex(n => n.id === id);
        if (index !== -1) {
            const notaActualizada = {
                ...this.notas[index],
                estudiante: estudiante,
                tipo: tipo,
                prioridad: prioridad,
                texto: texto,
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
            contador.textContent = this.notas.length;
            contador.style.display = this.notas.length > 0 ? 'flex' : 'none';
        }
    }

    actualizarVista() {
        if (this.cargando) return;

        const container = document.getElementById('notasContent');
        const vacio = document.getElementById('notasVacio');
        
        if (this.notas.length === 0) {
            if (vacio) vacio.style.display = 'block';
            container.innerHTML = '';
            if (vacio) container.appendChild(vacio);
            return;
        }

        if (vacio) vacio.style.display = 'none';
        container.innerHTML = '';

        // Ordenar por prioridad y fecha
        const notasOrdenadas = [...this.notas].sort((a, b) => {
            const prioridadOrden = { alta: 1, media: 2, baja: 3 };
            if (prioridadOrden[a.prioridad] !== prioridadOrden[b.prioridad]) {
                return prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
            }
            return new Date(b.fecha) - new Date(a.fecha);
        });

        notasOrdenadas.forEach(nota => {
            const notaElement = this.crearElementoNota(nota);
            container.appendChild(notaElement);
        });
    }

    crearElementoNota(nota) {
        const div = document.createElement('div');
        div.className = `nota-item prioridad-${nota.prioridad}`;
        
        const dispositivo = nota.dispositivo ? `<span style="font-size: 0.85em; color: #9ca3af;">📱 ${nota.dispositivo}</span>` : '';
        
        div.innerHTML = `
            <div class="nota-header-item">
                <span class="nota-tipo ${nota.tipo}">${this.obtenerIconoTipo(nota.tipo)} ${this.obtenerNombreTipo(nota.tipo)}</span>
                <span class="nota-prioridad ${nota.prioridad}">${this.obtenerIconoPrioridad(nota.prioridad)} ${nota.prioridad.toUpperCase()}</span>
            </div>
            <div class="nota-estudiante">👤 ${nota.estudiante}</div>
            <div class="nota-texto">${nota.texto}</div>
            <div class="nota-fecha">🕐 ${this.formatearFecha(new Date(nota.fecha))} ${dispositivo}</div>
            <div class="nota-acciones">
                <button class="nota-btn nota-btn-registrar" onclick="sistemaNotas.registrarIncidencia('${nota.id}')">
                    📋 Registrar
                </button>
                <button class="nota-btn nota-btn-editar" onclick="sistemaNotas.iniciarEdicion('${nota.id}')">
                    ✏️ Editar
                </button>
                <button class="nota-btn nota-btn-borrar" onclick="sistemaNotas.confirmarEliminar('${nota.id}')">
                    🗑️ Borrar
                </button>
            </div>
        `;
        return div;
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

        closeNotasPanel();

        setTimeout(() => {
            openModule('incidencias');

            setTimeout(() => {
                const estudianteInput = document.querySelector('#incidencias input[placeholder*="estudiante"]');
                const tipoSelect = document.querySelector('#incidencias select');
                const detallesTextarea = document.querySelector('#incidencias textarea');

                if (estudianteInput) estudianteInput.value = nota.estudiante;

                if (tipoSelect) {
                    const mapeoTipos = {
                        'tardanza': 'Leve',
                        'incidencia': 'Grave',
                        'llamada': 'Leve',
                        'reunion': 'Leve',
                        'recordatorio': 'Leve',
                        'otros': 'Leve'
                    };
                    tipoSelect.value = mapeoTipos[nota.tipo] || 'Leve';
                }

                if (detallesTextarea) detallesTextarea.value = nota.texto;

                const formulario = document.querySelector('#incidencias form');
                if (formulario) {
                    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                notificaciones.info(
                    'Datos cargados',
                    'Completa los campos, guarda la incidencia y luego borra esta nota',
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
        botonesDiv.innerHTML = `
            <button onclick="sistemaNotas.eliminarNotaConfirmada('${id}'); this.closest('.notificacion').remove();" 
                    style="flex: 1; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Sí, eliminar
            </button>
            <button onclick="this.closest('.notificacion').remove();" 
                    style="flex: 1; padding: 8px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Cancelar
            </button>
        `;
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
    setTimeout(() => {
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
            await sistemaNotas.editarNota(sistemaNotas.notaEditando, estudiante, tipo, prioridad, texto);
        } else {
            await sistemaNotas.agregarNota(estudiante, tipo, prioridad, texto);
        }

        cancelarNuevaNota();

        const content = document.getElementById('notasContent');
        if (content) content.scrollTop = 0;
    } finally {
        btnGuardar.classList.remove('btn-cargando');
        btnGuardar.textContent = textoOriginal;
    }
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

console.log('✅ Sistema de Notas Rápidas (Google Sheets) cargado correctamente');
