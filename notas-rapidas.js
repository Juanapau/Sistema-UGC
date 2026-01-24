// ========================================
// SISTEMA DE NOTAS RÁPIDAS - CENSA
// ========================================

// Clase para manejar las notas
class NotasRapidas {
    constructor() {
        this.notas = this.cargarNotas();
        this.notaEditando = null;
        this.inicializar();
    }

    inicializar() {
        this.actualizarVista();
        this.actualizarContador();
    }

    // ========== GESTIÓN DE ALMACENAMIENTO ==========
    
    cargarNotas() {
        const notasGuardadas = localStorage.getItem('notasRapidas');
        return notasGuardadas ? JSON.parse(notasGuardadas) : [];
    }

    guardarEnStorage() {
        localStorage.setItem('notasRapidas', JSON.stringify(this.notas));
    }

    // ========== OPERACIONES CRUD ==========
    
    agregarNota(estudiante, tipo, prioridad, texto) {
        const nuevaNota = {
            id: Date.now(),
            estudiante: estudiante,
            tipo: tipo,
            prioridad: prioridad,
            texto: texto,
            fecha: new Date().toISOString(),
            fechaLegible: this.formatearFecha(new Date())
        };

        this.notas.unshift(nuevaNota); // Agregar al inicio
        this.guardarEnStorage();
        this.actualizarVista();
        this.actualizarContador();
        
        return nuevaNota;
    }

    editarNota(id, estudiante, tipo, prioridad, texto) {
        const index = this.notas.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notas[index] = {
                ...this.notas[index],
                estudiante: estudiante,
                tipo: tipo,
                prioridad: prioridad,
                texto: texto
            };
            this.guardarEnStorage();
            this.actualizarVista();
        }
    }

    eliminarNota(id) {
        this.notas = this.notas.filter(n => n.id !== id);
        this.guardarEnStorage();
        this.actualizarVista();
        this.actualizarContador();
    }

    obtenerNota(id) {
        return this.notas.find(n => n.id === id);
    }

    // ========== UTILIDADES ==========
    
    formatearFecha(fecha) {
        const ahora = new Date();
        const diff = ahora - fecha;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        
        return fecha.toLocaleDateString('es-DO', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
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
        const container = document.getElementById('notasContent');
        const vacio = document.getElementById('notasVacio');
        
        if (this.notas.length === 0) {
            vacio.style.display = 'block';
            container.innerHTML = '';
            container.appendChild(vacio);
            return;
        }

        vacio.style.display = 'none';
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
        div.innerHTML = `
            <div class="nota-header-item">
                <span class="nota-tipo ${nota.tipo}">${this.obtenerIconoTipo(nota.tipo)} ${this.obtenerNombreTipo(nota.tipo)}</span>
                <span class="nota-prioridad ${nota.prioridad}">${this.obtenerIconoPrioridad(nota.prioridad)} ${nota.prioridad.toUpperCase()}</span>
            </div>
            <div class="nota-estudiante">👤 ${nota.estudiante}</div>
            <div class="nota-texto">${nota.texto}</div>
            <div class="nota-fecha">🕐 ${this.formatearFecha(new Date(nota.fecha))}</div>
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

        // Cerrar panel de notas
        closeNotasPanel();

        // Esperar un momento para que se cierre el panel
        setTimeout(() => {
            // Abrir módulo de incidencias
            openModule('incidencias');

            // Esperar a que el módulo se cargue
            setTimeout(() => {
                // Pre-llenar el formulario
                const estudianteInput = document.querySelector('#incidencias input[placeholder*="estudiante"]');
                const tipoSelect = document.querySelector('#incidencias select');
                const detallesTextarea = document.querySelector('#incidencias textarea');

                if (estudianteInput) {
                    estudianteInput.value = nota.estudiante;
                }

                if (tipoSelect) {
                    // Mapear tipos de nota a tipos de incidencia
                    const mapeoTipos = {
                        'tardanza': 'Leve',
                        'incidencia': 'Grave',
                        'llamada': 'Leve',
                        'recordatorio': 'Leve'
                    };
                    const tipoIncidencia = mapeoTipos[nota.tipo] || 'Leve';
                    tipoSelect.value = tipoIncidencia;
                }

                if (detallesTextarea) {
                    detallesTextarea.value = nota.texto;
                }

                // Scroll al formulario
                const formulario = document.querySelector('#incidencias form');
                if (formulario) {
                    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                // Mostrar mensaje
                alert('✅ Datos cargados en el formulario de incidencias.\n\nRecuerda:\n• Completar los campos restantes\n• Guardar la incidencia\n• Borrar la nota cuando termines');
            }, 300);
        }, 300);
    }

    iniciarEdicion(id) {
        const nota = this.obtenerNota(id);
        if (!nota) return;

        this.notaEditando = id;
        
        // Llenar formulario con datos de la nota
        document.getElementById('notaEstudiante').value = nota.estudiante;
        document.getElementById('notaTipo').value = nota.tipo;
        document.getElementById('notaPrioridad').value = nota.prioridad;
        document.getElementById('notaTexto').value = nota.texto;

        // Mostrar formulario
        mostrarFormNuevaNota();

        // Cambiar texto del botón
        const btnGuardar = document.querySelector('.btn-guardar-nota');
        btnGuardar.textContent = '💾 Actualizar';
    }

    confirmarEliminar(id) {
        const nota = this.obtenerNota(id);
        if (!nota) return;

        if (confirm(`¿Estás segura de eliminar esta nota?\n\n👤 ${nota.estudiante}\n📝 ${nota.texto.substring(0, 50)}...`)) {
            this.eliminarNota(id);
            alert('✅ Nota eliminada correctamente');
        }
    }
}

// ========================================
// FUNCIONES GLOBALES DE INTERFAZ
// ========================================

let sistemaNotas = null;

// Inicializar sistema al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    sistemaNotas = new NotasRapidas();
});

// Abrir/cerrar panel
function toggleNotasPanel() {
    const overlay = document.getElementById('notasOverlay');
    const panel = document.getElementById('notasPanel');
    
    overlay.classList.toggle('active');
    panel.classList.toggle('active');

    // Cerrar formulario si está abierto
    if (!panel.classList.contains('active')) {
        cancelarNuevaNota();
    }
}

function closeNotasPanel() {
    const overlay = document.getElementById('notasOverlay');
    const panel = document.getElementById('notasPanel');
    
    overlay.classList.remove('active');
    panel.classList.remove('active');
    
    // Cerrar formulario si está abierto
    cancelarNuevaNota();
}

// Mostrar formulario de nueva nota
function mostrarFormNuevaNota() {
    const form = document.getElementById('formNuevaNota');
    form.classList.remove('oculto');
    
    // Hacer scroll al formulario
    setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Cancelar nueva nota
function cancelarNuevaNota() {
    const form = document.getElementById('formNuevaNota');
    form.classList.add('oculto');
    
    // Limpiar formulario
    document.getElementById('notaEstudiante').value = '';
    document.getElementById('notaTipo').value = 'tardanza';
    document.getElementById('notaPrioridad').value = 'media';
    document.getElementById('notaTexto').value = '';
    
    // Resetear modo edición
    if (sistemaNotas) {
        sistemaNotas.notaEditando = null;
    }
    
    // Restaurar texto del botón
    const btnGuardar = document.querySelector('.btn-guardar-nota');
    if (btnGuardar) {
        btnGuardar.textContent = '💾 Guardar';
    }
}

// Guardar nota
function guardarNota() {
    const estudiante = document.getElementById('notaEstudiante').value.trim();
    const tipo = document.getElementById('notaTipo').value;
    const prioridad = document.getElementById('notaPrioridad').value;
    const texto = document.getElementById('notaTexto').value.trim();

    // Validaciones
    if (!estudiante) {
        alert('⚠️ Por favor ingresa el nombre del estudiante');
        document.getElementById('notaEstudiante').focus();
        return;
    }

    if (!texto) {
        alert('⚠️ Por favor escribe una nota');
        document.getElementById('notaTexto').focus();
        return;
    }

    // Guardar o editar
    if (sistemaNotas.notaEditando) {
        sistemaNotas.editarNota(sistemaNotas.notaEditando, estudiante, tipo, prioridad, texto);
        alert('✅ Nota actualizada correctamente');
    } else {
        sistemaNotas.agregarNota(estudiante, tipo, prioridad, texto);
        alert('✅ Nota guardada correctamente');
    }

    // Limpiar y cerrar formulario
    cancelarNuevaNota();

    // Hacer scroll arriba
    const content = document.getElementById('notasContent');
    if (content) {
        content.scrollTop = 0;
    }
}

// ========================================
// ATAJOS DE TECLADO
// ========================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N = Nueva nota (solo si el panel está abierto)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        const panel = document.getElementById('notasPanel');
        if (panel && panel.classList.contains('active')) {
            e.preventDefault();
            mostrarFormNuevaNota();
        }
    }

    // Escape = Cerrar panel o formulario
    if (e.key === 'Escape') {
        const form = document.getElementById('formNuevaNota');
        if (form && !form.classList.contains('oculto')) {
            cancelarNuevaNota();
        } else {
            closeNotasPanel();
        }
    }
});

console.log('✅ Sistema de Notas Rápidas cargado correctamente');
