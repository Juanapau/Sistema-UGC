// CONTENIDO DEL RÉGIMEN DISCIPLINARIO CENSA
// Este archivo contiene todas las faltas y sus sanciones

const regimenData = {
    leves: [
        {
            nombre: "Tardanzas (3 en un mes)",
            medida: "Permanecer en recepción hasta culminar acto cívico. Realizar acto cívico en espacio designado. Ingresar en segunda hora. Al acumular tres tardanzas: citación a padres, acuerdos y compromisos por escrito."
        },
        {
            nombre: "Actividades no permitidas en áreas administrativas (jugar, comer, gritar, corretear)",
            medida: "Registro de disciplina. Dirigirse a lugares de recreo permitidos."
        },
        {
            nombre: "Fuera del aula durante registro de asistencia",
            medida: "Quedará ausente. Pérdida del derecho de entregar trabajos y participación en esa asignatura."
        },
        {
            nombre: "Esconderse para no ingresar al aula",
            medida: "Reporte de disciplina. Permanecer fuera del aula realizando trabajos de ornato y limpieza supervisados por mayordomía."
        },
        {
            nombre: "Ausentarse primera semana después de vacaciones sin excusa",
            medida: "Quedará ausente en registro. Labor social en el plantel supervisada por mayordomía."
        },
        {
            nombre: "Salir del aula en ausencia del maestro o en cambios de clase",
            medida: "Retiro de carnet. Registro de disciplina. Quedará ausente si corresponde."
        },
        {
            nombre: "Alteraciones al uniforme institucional",
            medida: "Aviso a padres para procurar uniforme aprobado. Permanecer fuera del aula hasta portar uniforme correctamente."
        },
        {
            nombre: "Prendas o accesorios no aprobados (collares, joyas, gorras, cachuchas, pañoletas, gafas no médicas, suéteres, mallas, fajas)",
            medida: "Retiro de objetos por un período escolar, entrega solo a padres. Registro de disciplina."
        },
        {
            nombre: "Calzado inadecuado (chancletas, crocs, zapatillas, balerinas, tacones)",
            medida: "Informar a padres para traer calzado correcto antes de ingresar. Registro de disciplina."
        },
        {
            nombre: "Suéter por fuera del pantalón o correas inadecuadas",
            medida: "Usar uniforme correctamente. Retiro de correa. Registro de disciplina."
        },
        {
            nombre: "Pelo desarreglado, sin peinar, peinados elaborados (hembras) o cortes inadecuados, barba desarreglada (varones)",
            medida: "Arreglarse y recogerse el pelo. Registro y acompañamiento del departamento de psicología."
        },
        {
            nombre: "Mechones de colores, tintes o combinados de pelo",
            medida: "Informar a padres para retirar tinte. No ingresa hasta normalizar. Registro de disciplina."
        },
        {
            nombre: "Uñas largas, pintadas, postizas o con diseños",
            medida: "Recortarse uñas y retirar color. Llamar a padres para uñas postizas. Registro de disciplina."
        },
        {
            nombre: "Sobrenombres, apodos o bromas de mal gusto a compañeros",
            medida: "Diálogo sobre conducta. Disculpa con compañero y curso. Registro. Acompañamiento de Orientación y Psicología."
        },
        {
            nombre: "Expresiones vulgares, ordinarias o de doble sentido",
            medida: "Diálogo sobre conducta. Disculpa con compañeros. Trabajo reflexivo según el caso. Registro."
        },
        {
            nombre: "Celulares, iPod, aparatos electrónicos, software sin autorización",
            medida: "Retención hasta finalizar jornada. Si es reincidente: retención por un período escolar, entrega solo a padres. Registro."
        },
        {
            nombre: "Provocar chistes en clase en perjuicio de compañeros",
            medida: "Corrección pública. Separación del aula si amerita con labores a favor del centro mientras reflexiona. Registro."
        },
        {
            nombre: "Escribir, rayar o hacer ejercicios sobre mesa o mobiliario",
            medida: "Reparar el daño. Si necesita reparación, comunicar a padres para restauración. Registro."
        },
        {
            nombre: "Desprender, rayar, romper o llevarse informaciones de murales o mobiliario",
            medida: "Reponer lo dañado. Disculpa con compañeros y maestro guía. Registro."
        },
        {
            nombre: "Celebraciones en aula afectando proceso de aprendizaje",
            medida: "Suspensión de actividad. Sanción disciplinaria al curso completo."
        },
        {
            nombre: "Sabotear clases o propiciar situaciones que afectan la organización",
            medida: "Corrección pública. Separación del aula si amerita. Registro."
        },
        {
            nombre: "Salir en clases antes/después de descanso sin autorización",
            medida: "Reporte de disciplina. Trabajos de ornato y limpieza supervisados por Gestión de Convivencia."
        }
    ],
    
    graves: [
        {
            nombre: "Desinterés y negligencia en formación o proceso de aprendizaje",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Usar uniforme en lugares de dudosa moralidad",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Fotos o exhibición provocativa e inadecuada con uniforme",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Colgar fotos en redes sociales con uniforme sin autorización",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Comentarios irrespetuosos sobre el Centro en redes sociales o medios virtuales",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Participar en guiones, anuncios, portadas con uniforme sin autorización",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Rebeldía, rechazo o displicencia ante políticas y filosofía institucional",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Desprecio e irrespeto a símbolos institucionales (bandera, escudo, uniforme)",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Conducta irrespetuosa frente a directivos, docentes, administrativos o personal (oral, escrito, telefónico, virtual)",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Comentarios inapropiados e injustos que afecten nombre de la Institución o su personal",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Rayar, arrancar o alterar informaciones en carteleras, murales o pizarrones",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Ingresar a oficinas directivas, administrativas o archivo sin autorización",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Ausencias reiteradas sin excusa (más del 5% mensual)",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Ausencia en actividades formativas sin autorización (reforzamiento, talleres, oraciones, retiros, convivencias, excursiones)",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Conducta descontrolada, altanera y burlona frente a compañeros",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Crítica negativa, chismes o comentarios inapropiados de compañeros o personal",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Ingresar a aula ajena apoderándose u ocasionando daños a pertenencias",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Hacer negocios dentro del Centro (ventas, rifas, sanes)",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Traer revistas o material pornográfico",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Uso inadecuado de recursos tecnológicos con contenido inmoral",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Modificar claves de red o configuraciones vulnerando seguridad",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Muestras de afecto inapropiadas (abrazos, besos, tomarse las manos, sentarse en piernas, juegos de manos)",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Fraude en exámenes",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Burlarse o humillar al compañero que comete error o se le dificulta comprender",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Negligencia en el estudio de manera sistemática",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Posponer estudio (dormir, TV, chatear, internet) en detrimento del aprendizaje",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Desaprovechar tiempo de estudio en actividades no favorables",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Copiar tareas, presentar trabajos ajenos como propios",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Dañar material, muebles, pupitres, paredes, puertas, juegos, equipos del plantel",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Rayar, agregar o suprimir palabras en carteleras o comunicaciones",
            medida: "Aplicar sanciones del Art. 43"
        },
        {
            nombre: "Agregar o suprimir palabras en circulares",
            medida: "Aplicar sanciones del Art. 43"
        }
    ],
    
    muyGraves: [
        {
            nombre: "Acoso y agresión de cualquier tipo dentro o fuera de la Institución",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Desafío o agresión a autoridades del Centro",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Agredir física, verbal o sexualmente a compañero o miembro de la comunidad",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Sitios web, videos pornográficos u ofensivos; fotos inapropiadas; correos insultantes; uso de redes sociales para atacar, ridiculizar, acosar o difamar",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Falsificar firma de padres o hacerse pasar por ellos (teléfono, virtual)",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Ingresar con licores, cigarrillos, drogas, sustancias psicoactivas, objetos cortopunzantes, armas",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Incumplimiento de leyes o hallado culpable en procesos penales o civiles",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Fumar, consumir alcohol, bebidas energéticas o sustancias controladas en el Centro o actividades",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Participar en bandas, pandillas o grupos cuyo objetivo sea hacer daño",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Salir del Centro sin permiso o usando engaño",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Engaño, fraude y trampa en cualquier modalidad",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Imitar firmas de directivos o docentes, o usar su nombre para permisos o autorizaciones",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Plagiar sello físico o digital de la Institución sin autorización",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Sustraer sin autorización material, evaluaciones, planillas, registros institucionales",
            medida: "Aplicar sanciones del Art. 48"
        },
        {
            nombre: "Robo de identidad (real, virtual); hackeos de claves, correos; violación de privacidad",
            medida: "Aplicar sanciones del Art. 48"
        }
    ],
    
    sancionesGraves: [
        "Enviar al estudiante a espacio supervisado por máximo 2 días con tareas específicas. Padres revisan y firman avances diarios.",
        "Matrícula condicional hasta superar la falta bajo evaluación del equipo disciplinario.",
        "Labores de ayuda y servicio a la comunidad educativa fuera del horario escolar (con consentimiento firmado de padres).",
        "Trabajos extras: investigaciones, carteleras, exposiciones sobre el valor faltado.",
        "Excusa pública del estudiante o grupo si la falta lo amerita.",
        "Resarcir la falta (reponer, devolver, arreglar)."
    ],
    
    sancionesMuyGraves: [
        "Suspensión de asistencia por un período escolar o mitad del mismo. Realizar tareas con presentación cada 15 días y evaluación final.",
        "Retiro definitivo del Centro cuando la severidad lo amerite.",
        "Procedimientos de intervención judicial según Ley 136-03 y normativas nacionales."
    ],
    
    notasImportantes: {
        leves: "Cuando las faltas leves son reiterativas (más de 2 veces) se convierten en FALTAS GRAVES. Si un estudiante acumula más de dos faltas leves se convocará a los padres y se tomarán medidas preventivas.",
        graves: "Las faltas graves son plausibles de sanción y constarán en el expediente desde la primera vez. La reincidencia o incumplimiento de sanciones será motivo para inscripción condicional. Las faltas graves pueden considerarse MUY GRAVES cuando son reiterativas o con intención de hacer daño.",
        muyGraves: "Ante cualquier falta MUY GRAVE, el Centro procederá a la cancelación de matrícula. El equipo de disciplina determinará el momento de cancelación según severidad del caso."
    }
};

// Función para cargar el contenido en el panel
function cargarContenidoRegimen() {
    const container = document.getElementById('regimenContent');
    if (!container) return;
    
    let html = '';
    
    // FALTAS LEVES
    html += `
        <div class="falta-seccion" data-tipo="leves">
            <h3 class="seccion-title leves">⚠️ FALTAS LEVES</h3>
            <p class="seccion-intro">Faltas que por su naturaleza no atentan contra los valores institucionales. Son fruto de la irreflexión del estudiante.</p>
    `;
    
    regimenData.leves.forEach(falta => {
        html += `
            <div class="falta-item">
                <div class="falta-nombre">${falta.nombre}</div>
                <div class="falta-medida">
                    <strong>Medida correctiva:</strong> ${falta.medida}
                    <button class="btn-copy" onclick="copiarTexto(this)" title="Copiar sanción">📋</button>
                </div>
            </div>
        `;
    });
    
    html += `
            <div class="falta-nota">
                <strong>⚠️ Nota Importante:</strong> ${regimenData.notasImportantes.leves}
            </div>
        </div>
    `;
    
    // FALTAS GRAVES
    html += `
        <div class="falta-seccion" data-tipo="graves">
            <h3 class="seccion-title graves">🔶 FALTAS GRAVES</h3>
            <p class="seccion-intro">Acciones que afectan significativamente al estudiante, compañeros o comunidad educativa. Atentan contra los valores institucionales.</p>
    `;
    
    regimenData.graves.forEach(falta => {
        html += `
            <div class="falta-item">
                <div class="falta-nombre">${falta.nombre}</div>
                <div class="falta-medida">
                    <strong>Sanción:</strong> ${falta.medida}
                    <button class="btn-copy" onclick="copiarTexto(this)" title="Copiar sanción">📋</button>
                </div>
            </div>
        `;
    });
    
    html += `
            <div class="sancion-lista">
                <h4>📋 Sanciones aplicables (Art. 43):</h4>
                <ul>
                    ${regimenData.sancionesGraves.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="falta-nota">
                <strong>⚠️ Nota Importante:</strong> ${regimenData.notasImportantes.graves}
            </div>
        </div>
    `;
    
    // FALTAS MUY GRAVES
    html += `
        <div class="falta-seccion" data-tipo="muy-graves">
            <h3 class="seccion-title muy-graves">🔴 FALTAS MUY GRAVES</h3>
            <p class="seccion-intro">Acciones que atentan contra la moral, buenas costumbres, conductas antisociales, pandillismo, agresiones o comportamientos reñidos con la ley.</p>
    `;
    
    regimenData.muyGraves.forEach(falta => {
        html += `
            <div class="falta-item">
                <div class="falta-nombre">${falta.nombre}</div>
                <div class="falta-medida">
                    <strong>Sanción:</strong> ${falta.medida}
                    <button class="btn-copy" onclick="copiarTexto(this)" title="Copiar sanción">📋</button>
                </div>
            </div>
        `;
    });
    
    html += `
            <div class="sancion-lista">
                <h4>📋 Sanciones aplicables (Art. 48):</h4>
                <ul>
                    ${regimenData.sancionesMuyGraves.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="falta-nota">
                <strong>🚨 Nota Crítica:</strong> ${regimenData.notasImportantes.muyGraves}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Cargar contenido cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarContenidoRegimen);
} else {
    cargarContenidoRegimen();
}
