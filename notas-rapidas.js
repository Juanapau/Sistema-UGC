// ========================================
// SISTEMA DE NOTAS RÁPIDAS - CENSA
// Con sincronización GitHub
// ========================================

// CONFIGURACIÓN
const GITHUB_CONFIG = {
    owner: 'Juanapau',  // Tu usuario de GitHub
    repo: 'Sistema-UGC',  // Tu repositorio
    branch: 'main',  // Rama principal
    path: 'notas.json'  // Archivo de notas
};

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

        // Mostrar con animación
        setTimeout(() => notif.classList.add('show'), 10);

        // Auto-cerrar
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
// CLASE PARA MANEJAR GITHUB
// ========================================

class GitHubStorage {
    constructor(config) {
        this.config = config;
        this.baseUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${config.path}`;
    }

    async cargarNotas() {
        try {
            // Agregar timestamp para evitar caché
            const url = `${this.baseUrl}?t=${Date.now()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                // Si el archivo no existe, retornar array vacío
                if (response.status === 404) {
                    console.log('📝 Archivo de notas no encontrado, creando nuevo...');
                    return [];
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.notas || [];
        } catch (error) {
            console.error('Error cargando notas desde GitHub:', error);
            
            // Si hay error de red, intentar cargar desde localStorage como respaldo
            const notasLocal = localStorage.getItem('notasRapidas_respaldo');
            if (notasLocal) {
                console.log('📦 Cargando notas desde respaldo local...');
                return JSON.parse(notasLocal);
            }
            
            return [];
        }
    }

    async guardarNotas(notas) {
        try {
            // Guardar también en localStorage como respaldo
            localStorage.setItem('notasRapidas_respaldo', JSON.stringify(notas));
            
            // Generar archivo JSON actualizado
            const contenido = {
                notas: notas,
                ultima_actualizacion: new Date().toISOString(),
                version: "1.0"
            };

            // Crear y descargar archivo
            this.descargarJSON(contenido);
            
            // Mostrar info de que se descargó el archivo
            notificaciones.info(
                'Archivo descargado',
                'Sube notas.json a GitHub para sincronizar en todos tus dispositivos',
                6000
            );

            return true;
        } catch (error) {
            console.error('Error guardando notas:', error);
            notificaciones.error(
                'Error al guardar',
                'No se pudieron guardar las notas. Intenta de nuevo.'
            );
            return false;
        }
    }

    descargarJSON(contenido) {
        const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notas.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ========================================
// CLASE PARA MANEJAR LAS NOTAS
// ========================================

class NotasRapidas {
    constructor() {
        this.storage = new GitHubStorage(GITHUB_CONFIG);
        this.notas = [];
        this.notaEditando = null;
        this.cargando = false;
        this.inicializar();
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

    // ========== GESTIÓN DE ALMACENAMIENTO ==========
    
    async cargarNotas() {
        try {
            this.notas = await this.storage.cargarNotas();
            console.log(`✅ ${this.notas.length} notas cargadas desde GitHub`);
        } catch (error) {
            console.error('Error cargando notas:', error);
            notificaciones.error(
                'Error de conexión',
                'No se pudieron cargar las notas. Verifica tu conexión.'
            );
            this.notas = [];
        }
    }

    async guardarEnStorage() {
        await this.storage.guardarNotas(this.notas);
    }

    // ========== OPERACIONES CRUD ==========
    
    async agregarNota(estudiante, tipo, prioridad, texto) {
        const nuevaNota = {
            id: Date.now(),
            estudiante: estudiante,
            tipo: tipo,
            prioridad: prioridad,
            texto: texto,
            fecha: new Date().toISOString(),
            fechaLegible: this.formatearFecha(new Date()),
            dispositivo: this.obtenerDispositivo()
        };

        this.notas.unshift(nuevaNota);
        await this.guardarEnStorage();
        this.actualizarVista();
        this.actualizarContador();
        
        return nuevaNota;
    }

    async editarNota(id, estudiante, tipo, prioridad, texto) {
        const index = this.notas.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notas[index] = {
                ...this.notas[index],
                estudiante: estudiante,
                tipo: tipo,
                prioridad: prioridad,
                texto: texto,
                editado: new Date().toISOString()
            };
            await this.guardarEnStorage();
            this.actualizarVista();
        }
    }

    async eliminarNota(id) {
        this.notas = this.notas.filter(n => n.id !== id);
        await this.guardarEnStorage();
        this.actualizarVista();
        this.actualizarContador();
    }

    obtenerNota(id) {
        return this.notas.find(n => n.id === id);
    }

    // ========== UTILIDADES ==========

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

    // ========== RENDERIZADO ==========
    
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
                <button class="nota-btn nota-btn-registrar" onclick="sistemaNotas.registrarIncidencia(${nota.id})">
                    📋 Registrar
                </button>
                <button class="nota-btn nota-btn-editar" onclick="sistemaNotas.iniciarEdicion(${nota.id})">
                    ✏️ Editar
                </button>
                <button class="nota-btn nota-btn-borrar" onclick="sistemaNotas.confirmarEliminar(${nota.id})">
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
            recordatorio: '🔔'
        };
        return iconos[tipo] || '📝';
    }

    obtenerNombreTipo(tipo) {
        const nombres = {
            tardanza: 'Tardanza',
            incidencia: 'Incidencia',
            llamada: 'Llamada Pendiente',
            recordatorio: 'Recordatorio'
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

    // ========== ACCIONES ==========
    
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
                        'recordatorio': 'Leve'
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
                    'Completa los campos restantes y guarda la incidencia. Luego borra la nota.',
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

        // Agregar botones de confirmación
        const botonesDiv = document.createElement('div');
        botonesDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 10px;';
        botonesDiv.innerHTML = `
            <button onclick="sistemaNotas.eliminarNotaConfirmada(${id}); this.closest('.notificacion').remove();" 
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
        notificaciones.exito('Nota eliminada', 'La nota se eliminó correctamente');
    }

    async recargarNotas() {
        this.mostrarCargando();
        await this.cargarNotas();
        this.ocultarCargando();
        this.actualizarVista();
        this.actualizarContador();
    }
}

// ========================================
// FUNCIONES GLOBALES DE INTERFAZ
// ========================================

let sistemaNotas = null;

document.addEventListener('DOMContentLoaded', function() {
    sistemaNotas = new NotasRapidas();
});

function toggleNotasPanel() {
    const overlay = document.getElementById('notasOverlay');
    const panel = document.getElementById('notasPanel');
    
    overlay.classList.toggle('active');
    panel.classList.toggle('active');

    if (!panel.classList.contains('active')) {
        cancelarNuevaNota();
    }

    // Recargar notas al abrir el panel
    if (panel.classList.contains('active') && sistemaNotas) {
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

    // Mostrar botón cargando
    const btnGuardar = document.querySelector('.btn-guardar-nota');
    const textoOriginal = btnGuardar.textContent;
    btnGuardar.classList.add('btn-cargando');
    btnGuardar.textContent = 'Guardando...';

    try {
        if (sistemaNotas.notaEditando) {
            await sistemaNotas.editarNota(sistemaNotas.notaEditando, estudiante, tipo, prioridad, texto);
            notificaciones.exito('Nota actualizada', 'Los cambios se guardaron correctamente');
        } else {
            await sistemaNotas.agregarNota(estudiante, tipo, prioridad, texto);
            notificaciones.exito('Nota guardada', 'La nota se guardó correctamente');
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

console.log('✅ Sistema de Notas Rápidas (GitHub) cargado correctamente');
