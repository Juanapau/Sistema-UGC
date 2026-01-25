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
            const notaActualizada = {
                ...this.notas[index],
                estudiante: estudiante,
                tipo: tipo,
                prioridad: prioridad,
                texto: texto,
                fechaAccion: fechaAccion || '',
                editado: new Date().toISOString()
            };

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
        const eliminado = await eliminarNotaDeGoogleSheets(id);
        
        if (eliminado) {
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
        
        if (this.notas.length > 0) {
            notificaciones.exito(
                'Sincronizado',
                `${this.notas.length} nota${this.notas.length !== 1 ? 's' : ''} cargada${this.notas.length !== 1 ? 's' : ''}`
            );
        } else {
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
            const ahora = new Date();
            ahora.setHours(0, 0, 0, 0);
            const finHoy = new Date(ahora);
            finHoy.setHours(23, 59, 59, 999);
            
            const notasHoy = this.notas.filter(nota => {
                if (!nota.fechaAccion) return true;
                const fechaNota = new Date(nota.fechaAccion);
                return fechaNota <= finHoy;
            });
            
            const total = this.notas.length;
            const hoy = notasHoy.length;
            
            if (hoy > 0) {
                contador.innerHTML = `${hoy} 🔥`;
                contador.style.background = '#ea580c';
            } else if (total > 0) {
                contador.textContent = total;
                contador.style.background = '#059669';
            }
            
            contador.style.display = total > 0 ? 'flex' : 'none';
            
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
        
        actualizarContadoresPestanas();
        
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

        const notasOrdenadas = this.ordenarNotas(notasFiltradas);

        notasOrdenadas.forEach(nota => {
            const notaElement = this.crearElementoNota(nota);
            container.appendChild(notaElement);
        });
    }
    
    filtrarNotasPorTab() {
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const finHoy = new Date(ahora);
        finHoy.setHours(23, 59, 59, 999);
        
        switch(this.tabActiva) {
            case 'hoy':
                return this.notas.filter(nota => {
                    if (!nota.fechaAccion) {
                        return true;
                    }
                    const fechaNota = new Date(nota.fechaAccion);
                    return fechaNota <= finHoy;
                });
                
            case 'proximas':
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
            
            if (a.fechaAccion && b.fechaAccion) {
                const fechaA = new Date(a.fechaAccion);
                const fechaB = new Date(b.fechaAccion);
                
                const aVencida = fechaA < ahora;
                const bVencida = fechaB < ahora;
                if (aVencida && !bVencida) return -1;
                if (!aVencida && bVencida) return 1;
                
                if (fechaA.getTime() !== fechaB.getTime()) {
                    return fechaA - fechaB;
                }
            }
            
            if (a.fechaAccion && !b.fechaAccion) return -1;
            if (!a.fechaAccion && b.fechaAccion) return 1;
            
            if (prioridadOrden[a.prioridad] !== prioridadOrden[b.prioridad]) {
                return prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
            }
            
            return new Date(b.fecha) - new Date(a.fecha);
        });
    }

    crearElementoNota(nota) {
        const div = document.createElement('div');
        
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);
        const esVencida = nota.fechaAccion && new Date(nota.fechaAccion) < ahora;
        
        div.className = `nota-item prioridad-${nota.prioridad}${esVencida ? ' nota-vencida' : ''}`;
        
        const dispositivo = nota.dispositivo ? `<span style="font-size: 0.85em; color: #9ca3af;">📱 ${nota.dispositivo}</span>` : '';
        
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
        
        div.innerHTML = `
            <div class="nota-header-item">
                <span class="nota-tipo ${nota.tipo}">${this.obtenerIconoTipo(nota.tipo)} ${this.obtenerNombreTipo(nota.tipo)}</span>
                <span class="nota-prioridad ${nota.prioridad}">${this.obtenerIconoPrioridad(nota.prioridad)} ${nota.prioridad.toUpperCase()}</span>
            </div>
            <div class="nota-estudiante">👤 ${nota.estudiante}</div>
            <div class="nota-texto">${nota.texto}</div>
            ${fechaAccionHTML}
            <div class="nota-fecha">🕐 Creada ${this.formatearFecha(new Date(nota.fecha))} ${dispositivo}</div>
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
                if (moduloDestino === 'tardanzas') {
                    const estudianteInput = document.querySelector('#tardanzas input[placeholder*="estudiante"]');
                    const fechaInput = document.querySelector('#tardanzas input[type="date"]');
                    const horaInput = document.querySelector('#tardanzas input[type="time"]');
                    const motivoTextarea = document.querySelector('#tardanzas textarea');

                    if (estudianteInput) estudianteInput.value = nota.estudiante;
                    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
                    if (horaInput) horaInput.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (motivoTextarea) motivoTextarea.value = nota.texto;

                } else if (moduloDestino === 'incidencias') {
                    const estudianteInput = document.querySelector('#incidencias input[placeholder*="estudiante"]');
                    const tipoSelect = document.querySelector('#incidencias select');
                    const detallesTextarea = document.querySelector('#incidencias textarea');

                    if (estudianteInput) estudianteInput.value = nota.estudiante;
                    if (tipoSelect) {
                        const mapeoTipos = {
                            'alta': 'Grave',
                            'media': 'Leve',
                            'baja': 'Leve'
                        };
                        tipoSelect.value = mapeoTipos[nota.prioridad] || 'Leve';
                    }
                    if (detallesTextarea) detallesTextarea.value = nota.texto;

                } else if (moduloDestino === 'reuniones') {
                    const estudianteInput = document.querySelector('#reuniones input[placeholder*="estudiante"]');
                    const fechaInput = document.querySelector('#reuniones input[type="date"]');
                    const horaInput = document.querySelector('#reuniones input[type="time"]');
                    const motivoTextarea = document.querySelector('#reuniones textarea[placeholder*="motivo"]');

                    if (estudianteInput) estudianteInput.value = nota.estudiante;
                    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
                    if (horaInput) horaInput.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (motivoTextarea) motivoTextarea.value = nota.texto;
                }

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
        
        // Buscar curso del estudiante en estudiantesNotas
        if (estudiantesNotas.length > 0) {
            const estudiante = estudiantesNotas.find(est => {
                const nombreCompleto = (est['Nombre Completo'] || est['nombre'] || est['Nombre'] || '').toLowerCase();
                return nombreCompleto === nota.estudiante.toLowerCase();
            });
            
            if (estudiante) {
                const curso = estudiante['Curso'] || estudiante['curso'] || '';
                if (curso) {
                    const cursoDiv = document.getElementById('cursoNotaRapida');
                    if (cursoDiv) {
                        cursoDiv.textContent = `📚 ${curso}`;
                        cursoDiv.style.display = 'block';
                        estudianteSeleccionadoNotaRapida = { 
                            nombre: nota.estudiante, 
                            curso: curso
                        };
                    }
                }
            }
        }
        
        if (nota.fechaAccion) {
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

    if (panel.classList.contains('active')) {
        if (!sistemaNotas) {
            sistemaNotas = new NotasRapidas();
        }
        
        if (!CONFIG_NOTAS.urlNotasRapidas) {
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
    document.getElementById('notaFecha').value = '';
    
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
    const fechaAccion = document.getElementById('notaFecha').value;

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

    if (!CONFIG_NOTAS.urlNotasRapidas) {
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
// AUTOCOMPLETADO DE ESTUDIANTES - NOTAS
// ========================================

let estudianteSeleccionadoNotaRapida = null;

function filtrarEstudiantesNotaRapida() {
    const input = document.getElementById('notaEstudiante');
    const sugerenciasDiv = document.getElementById('sugerenciasNotaRapida');
    const textoBusqueda = input.value.toLowerCase().trim();
    
    console.log('🔍 Buscando en notas:', textoBusqueda);
    
    // Limpiar selección previa
    estudianteSeleccionadoNotaRapida = null;
    const cursoDiv = document.getElementById('cursoNotaRapida');
    if (cursoDiv) cursoDiv.style.display = 'none';
    
    if (textoBusqueda.length < 2) {
        sugerenciasDiv.style.display = 'none';
        return;
    }
    
    console.log(`📚 Estudiantes disponibles: ${estudiantesNotas.length}`);
    
    const coincidencias = estudiantesNotas.filter(e => {
        const nombre = (
            e['Nombre Completo'] || 
            e['nombre'] || 
            e['Nombre'] || 
            e['NOMBRE'] ||
            e['nombre_completo'] ||
            e['NombreCompleto'] ||
            ''
        ).toLowerCase();
        return nombre.includes(textoBusqueda);
    }).slice(0, 15);
    
    console.log(`📋 Coincidencias encontradas: ${coincidencias.length}`);
    
    if (coincidencias.length === 0) {
        sugerenciasDiv.style.display = 'none';
        return;
    }
    
    sugerenciasDiv.innerHTML = coincidencias.map((e, index) => {
        const nombre = e['Nombre Completo'] || e['nombre'] || e['Nombre'] || e['NOMBRE'] || e['nombre_completo'] || e['NombreCompleto'] || '';
        const curso = e['Curso'] || e['curso'] || e['CURSO'] || '';
        return `
            <div class="sugerencia-item" data-index="${index}">
                <div style="font-weight:600;">${nombre}</div>
                <div style="font-size:0.85em;color:#666;">${curso}</div>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners
    document.querySelectorAll('#sugerenciasNotaRapida .sugerencia-item').forEach((item, index) => {
        item.addEventListener('click', function() {
            const estudiante = coincidencias[index];
            const nombre = estudiante['Nombre Completo'] || estudiante['nombre'] || estudiante['Nombre'] || estudiante['NOMBRE'] || estudiante['nombre_completo'] || estudiante['NombreCompleto'] || '';
            const curso = estudiante['Curso'] || estudiante['curso'] || estudiante['CURSO'] || '';
            seleccionarEstudianteNotaRapida(nombre, curso);
        });
    });
    
    sugerenciasDiv.style.display =// ========================================
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
