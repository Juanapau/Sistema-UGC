// CONTENIDO DEL RÉGIMEN DISCIPLINARIO CENSA
// Este archivo contiene todas las faltas y sus sanciones

const regimenData = {
    leves: [
        {
            nombre: "1. Los estudiantes que acumulen tres tardanzas en un mes",
            medida: "Cuando el estudiante llegue después de las 7:45 deberá permanecer en la recepción hasta que culmine el acto cívico, luego se dirigen a un espacio donde se registre la tardanza y se realiza el acto cívico, se canta el himno nacional, se realiza la oración y reciben las orientaciones del día, después se dirigen al aula en la segunda hora de clases, quedando ausente en la primera hora. Cuando acumule tres tardanzas en un mes, se citará a los padres, haciendo acuerdos y compromisos, puntualizando que la reincidencia de la tardanza se evaluará al final del año escolar para tomar las medidas necesarias y considerar la reinscripción del estudiante en el siguiente año. NOTA: Todo este proceso deberá ser escrito y firmado por ambas partes para tener todas las evidencias registradas."
        },
        {
            nombre: "2. Realizar actividades no permitidas en áreas administrativas (jugar, comer, hablar a gritos, corretear, etc…)",
            medida: "Se anotarán el nombre del estudiante en el Registro de disciplina, con su consecuente falta. Deberá dirigirse a lugares de recreo y esparcimientos permitidos."
        },
        {
            nombre: "3. En alguna ocasión estar fuera del aula cuando se esté registrando la asistencia del día",
            medida: "El estudiante quedará ausente en la asignatura correspondiente, y perderá el derecho de entregar trabajos, revisión de tareas y participación en esa asignatura."
        },
        {
            nombre: "4. Esconderse en algún lugar de la escuela para no ingresar al aula de clases",
            medida: "Se hará al estudiante un reporte de disciplina con la falta cometida y deberá permanecer fuera del aula realizando trabajos de ornato y limpieza, asignados por la Unidad de Gestión de la Convivencia. Será supervisado por el personal de mayordomía."
        },
        {
            nombre: "5. El ausentarse durante la primera semana de clases, después de cada período de vacaciones, sin la debida excusa",
            medida: "Quedará ausente en el registro de grado, absteniéndose a las consecuencias de la inasistencia a clases al final del período. Se anotará la falta en el registro de disciplina y deberá realizar una labor social en el plantel, supervisada por la mayordomía."
        },
        {
            nombre: "6. Salir del aula en ausencia del maestro, o aprovechando los cambios de clase",
            medida: "Se le retirará el carnet de identificación, se anotará su nombre y la falta cometida en el registro de disciplina. Si corresponde tomar la asistencia, quedará ausente en esta hora de clases."
        },
        {
            nombre: "7. Llevar con respeto y dignidad el uniforme institucional, evitando hacerle alteraciones",
            medida: "Conversar con el interesado … en caso de no ser aceptables sus excusas; se avisará de inmediato a sus padres para que procure al estudiante el uniforme aprobado por el centro educativo. Deberá permanecer fuera del aula de clases hasta tanto pueda portar el uniforme correctamente."
        },
        {
            nombre: "8. Ingresar al Centro Educativo con prendas o accesorios no aprobados: adornos, collares, joyas, pucas, pulseras, aretes largos o argollas, gorras, cachuchas, pañoletas, gafas, suéteres, mallas, fajas encima del uniforme",
            medida: "Al estudiante se le retirarán las prendas o accesorios no aprobados y se mantendrán en la Unidad de Gestión de la Convivencia por un período escolar, no pudiendo ser entregadas antes de ese tiempo. Se anotará al estudiante en el registro de disciplina, así como también la falta cometida."
        },
        {
            nombre: "9. Utilizar, o presentarse al centro educativo con chancletas, crocs, zapatillas, balerinas, tacones, etc.",
            medida: "Se informará a los padres y se les solicitará traer el calzado correspondiente antes de ingresar al aula. Se anotará la falta y el nombre del estudiante en el registro de disciplina."
        },
        {
            nombre: "10. Usar el suéter por fuera del pantalón y utilizar correas llamativas o que constituyan un peligro para el propio estudiante o sus compañeros",
            medida: "Se solicitará al estudiante usar el uniforme correctamente y se le retirará la correa. Se anotará su nombre y la falta en el registro de disciplina."
        },
        {
            nombre: "11. Traer el pelo desarreglado, o sin peinar, o peinados elaborados (las hembras). Traer cortes inadecuados, barba desarreglada o exagerada, pelo despeinado, (Los varones)",
            medida: "Se solicitará a las/los estudiantes arreglarse y recogerse o peinarse el pelo y se anotará el nombre del o la estudiante y la falta en la Unidad de Gestión de Convivencia, y recibirá acompañamiento del departamento de psicología."
        },
        {
            nombre: "12. Hacerse mechones de colores tintes o combinados de pelo. (Hembras y Varones)",
            medida: "Se informará de inmediato a los padres y se solicitará retirarle el tinte para poder ingresar al aula de clases. Tanto la falta, como el nombre del estudiante serán registrados en el anecdotario de disciplina."
        },
        {
            nombre: "13. Traer las uñas largas, pintadas, postizas y con diseños",
            medida: "Se solicitará a la estudiante recortarse las uñas y retirarse el color. En el caso de uñas postizas se llamará a los padres para que gestionen la normalización en este aspecto. Se anotará el nombre de la estudiante en el registro de disciplina, así como la falta cometida."
        },
        {
            nombre: "14. Poner sobrenombres, apodos, o hacerles bromas de mal gusto a los compañeros",
            medida: "Se llamará al estudiante y se dialogará sobre su conducta; deberá disculparse con el compañero y con el curso. Su comportamiento será registrado en el anecdotario de conducta, así como también su nombre y se acompañará por la Unidad de Orientación y Psicología."
        },
        {
            nombre: "15. Utilizar expresiones vulgares, ordinarias o de doble sentido",
            medida: "Se llamará al estudiante y se dialogará sobre su conducta; deberá disculparse con los compañeros del curso. Según el caso deberá realizar un trabajo reflexivo y su comportamiento se asentará en el registro del departamento de gestión de la convivencia, así como también su nombre."
        },
        {
            nombre: "16. Traer celulares, IPod o similares, aparatos electrónicos de sonido o video, software y demás materiales sin la debida autorización",
            medida: "Se retendrán los objetos distractores (celulares, tabletas electrónicas, otros) hasta que finalice la actividad o jornada escolar. Las computadoras, celulares, tabletas y otros dispositivos electrónicos podrán utilizarse para actividades académicas dentro del aula, solo cuando el profesor o profesora lo autorice y se deberán entregar a gestión de la Convivencia debidamente identificados. Estas medidas, también aplican para las actividades dentro y fuera del centro educativo, tales como: excursiones, convivencias y otras actividades cocurriculares. Si un estudiante es sorprendido utilizando estos aparatos sin el debido permiso se le retirará y se mantendrán en el Departamento de gestión de la convivencia, por un período escolar, no pudiendo ser entregadas antes de tiempo. Se anotará al estudiante en el registro de Gestión de Convivencia, así como también la falta cometida. NOTA: tomando en consideración la circunstancia en la que fue retirado y solo se entregará a los padres."
        },
        {
            nombre: "17. Provocar chistes en medio de una clase, a costa y en perjuicio de los demás compañeros",
            medida: "El estudiante será corregido en público, y si el caso lo amerita podría ser separado del aula de clases por un determinado tiempo a realizar labores a favor del centro educativo al mismo tiempo que reflexiona sobre su conducta. La falta será registrada en el anecdotario de disciplina."
        },
        {
            nombre: "18. Escribir, rayar, hacer ejercicios sobre la mesa o cualquier mobiliario que haya en el aula, utilizando tinta, corrector u otro material",
            medida: "Se solicitará al estudiante reparar el daño y si éste necesita reparación, será comunicado a los padres para su restauración. Se anotará la falta en el registro de disciplina."
        },
        {
            nombre: "19. Desprender, rayar, romper llevarse informaciones colocadas en el mural del aula, pasillos o mobiliarios de la escuela",
            medida: "El estudiante deberá reponer lo rayado, desprendido o violentado, debiéndose disculparse con sus compañeros de curso y con su maestro guía. La falta será anotada en el registro de disciplina."
        },
        {
            nombre: "20. Realizar celebraciones en las aulas de clase, en perjuicio de los demás compañeros y afectando su proceso de aprendizaje",
            medida: "La Unidad de Gestión de la Convivencia suspenderá cualquier actividad dentro del aula que interrumpa la labor docente. Se establecerá una sanción disciplinaria al curso completo."
        },
        {
            nombre: "21. Sabotear las clases o propiciar situaciones que afectan la organización de las mismas",
            medida: "El estudiante será corregido en público, y si el caso lo amerita podría ser separado del aula de clases. La falta será registrada en el anecdotario de disciplina."
        },
        {
            nombre: "22. Salir en las clases siguientes o anteriores a descansos, sin la autorización del maestro encargado de la hora de clase",
            medida: "Se hará al estudiante un reporte de disciplina con la falta cometida y deberá permanecer fuera del aula realizando trabajos de ornato y limpieza asignados por la Unidad de Gestión de la Convivencia."
        }
    ],
    
    graves: [
        {
            nombre: "1. Mostrar desinterés y negligencia en su propia formación o proceso de aprendizaje",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "2. Usar el uniforme de la Institución en lugares de dudosa moralidad",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "3. Tomarse fotos o exhibirse de forma provocativa e inadecuada, vistiendo el uniforme de la Institución",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "4. Colgar fotos en internet (redes sociales, correos, chat, etc.…) con el uniforme del Centro Educativo, sin la debida autorización",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "5. Utilizar el espacio virtual (redes sociales, correo electrónico, blogs) para hacer comentarios irrespetuosos sobre el Centro Educativo, el personal o los compañeros",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "6. Participar en guiones, anuncios, portadas, invitaciones, llevando el uniforme de la Institución sin la debida autorización",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "7. Mostrar rebeldía, rechazo, displicencia ante las políticas y filosofía de la Institución",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "8. Mostrar desprecio e irrespeto a los símbolos de la Institución: bandera, escudo, uniforme",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "9. Mostrar conducta irrespetuosa frente a cualquier directivo, docente, administrativo o personal de apoyo del Centro, ya sea a su persona o a sus pertenencias, dentro o fuera del plantel escolar y a través de cualquier medio (oral, escrito, telefónico, virtual, entre otros)",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "10. Afectar, con comentarios inapropiados e injustos, el nombre de la Institución y de su personal",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "11. Rayar, arrancar, alterar informaciones, pinturas, fotos colocadas en carteleras, murales o pizarrones, tanto de aulas como de pasillos u otras dependencias del Centro Educativo",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "12. Ingresar a oficinas directivas, administrativas o de archivo de documentos sin la debida autorización",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "13. Las ausencias reiteradas a clase, sin la excusa pertinente, en más de un 5% del calendario mensual",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "14. La ausencia en actividades de aprendizaje o formativas que organice el Centro Educativo, sin la debida autorización. Estas actividades pueden ser, secciones de reforzamiento académico, talleres del área técnica, oraciones, retiros, convivencias, excursiones que tengan que ver con contenidos de aprendizaje, competencias modulares o acciones formativas",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "15. Exhibir una conducta descontrolada, altanera y burlona frente a compañeros",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "16. Realizar crítica negativa de los compañeros, incurrir en chismes o comentarios inapropiados de los demás miembros de la comunidad educativa",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "17. Ingresar a un aula que no sea la suya, de manera particular si en ésta hay pertenencias de otros estudiantes apoderándose u ocasionando daños a las mismas",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "18. Hacer negocios dentro del Centro Educativo (venta de objetos o productos, rifas, sanes, etc.)",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "19. Traer revistas o material pornográfico al centro educativo",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "20. El uso inadecuado de los recursos tecnológicos, mensajes, videos o recursos contrarios a la moral y la filosofía institucional",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "21. Ingresar a la red de internet de la institución para modificar claves u otras configuraciones vulnerando la seguridad del Centro Educativo",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "22. Dar abrazos y besos, tomarse la manos, sentarse en la piernas de los/las compañeros/as y realizar juegos de manos entre otras acciones",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "23. Hacer fraude de cualquier tipo en los exámenes",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "24. Burlarse o humillar al compañero que comete un error o a quien se le dificulta comprender un tema",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "25. Mostrar negligencia en el estudio, de manera sistemática",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "26. Posponer el estudio a otra acción (dormir, ver TV, chatear, usar el internet) en detrimento de su proceso de aprendizaje",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "27. Desaprovechar el tiempo de estudio, invirtiéndolo en otras actividades no favorables al aprendizaje",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "28. Copiar las tareas de otros compañeros, presentar trabajos, cuadernos o carpetas ajenas haciéndolas pasar por suyas",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "29. Dañar el material, muebles, pupitres, paredes, puertas, juegos, equipos o los elementos ubicados en las diferentes dependencias del plantel",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "30. Dañar, rayar, agregar o suprimir palabras en las carteleras o comunicaciones ubicadas en los diferentes lugares asignados para publicar información",
            medida: "Se aplicarán las sanciones del Art. 43"
        },
        {
            nombre: "31. Agregar o suprimir palabras en las circulares",
            medida: "Se aplicarán las sanciones del Art. 43"
        }
    ],
    
    muyGraves: [
        {
            nombre: "1. Acoso y agresión de cualquier tipo, entre compañeros o a miembros de la comunidad educativa, dentro o fuera de la Institución",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "2. Desafío o agresión a las autoridades del Centro (personal directivo, docente, administrativo o de apoyo)",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "3. Agredir física, verbalmente o sexualmente a cualquier compañero o miembro de la comunidad educativa",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "4. Diseñar sitios Web y videos con contenido pornográfico y/u ofensivo; subir fotos inapropiadas, enviar correos electrónicos insultantes de sí mismo o de compañeros, utilizar las redes sociales para atacar, ridiculizar, acosar, difamar a otros",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "5. Falsificar la firma de los padres o hacer sus veces a través de las vías telefónicas o virtuales",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "6. Ingresar al Centro Educativo y/o en actividades desarrolladas fuera del plantel licores, cigarrillos, tabacos, drogas o sustancias psicoactivas u objetos cortopunzantes y cualquier tipo de armas",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "7. Incumplimiento de las leyes o ser hallado culpable en procesos penales o investigaciones de carácter civil o penal, incluso en primera instancia",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "8. Fumar, consumir alcohol, bebidas energéticas o sustancias controladas en el Centro Educativo y/o en actividades que éste promueve",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "9. Participar en bandas, pandillas o en cualquier grupo cuyo objetivo sea hacer daño a terceros",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "10. Salir del Centro Educativo sin el debido permiso o utilizando el engaño",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "11. El engaño, el fraude y la trampa, cualquiera que sea su modalidad",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "12. Imitar firmas de cualquiera de los Directivos o Docentes de la Institución, o utilizar su nombre para lograr permisos, autorizaciones u otro tipo de concesiones",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "13. Plagiar el sello físico o digital de la Institución, o utilizarlo sin autorización, para fines personales o grupales",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "E14. l sustraer sin autorización material de la Institución, evaluaciones, planillas de notas, registros u otros",
            medida: "Se aplicarán las sanciones del Art. 48"
        },
        {
            nombre: "15. Incurrir en robo de identidad (real, virtual); intentar o hacer hackeos de claves, correos, u otras acciones que correspondan a violación de la privacidad, tanto de la propiedad del Centro Educativo, como de sus directivos, profesores o administrativos",
            medida: "Se aplicarán las sanciones del Art. 48"
        }
    ],
    
    sancionesGraves: [
        "Enviar al estudiante a un espacio donde este supervisado, acordado previamente con el Equipo de Gestión, con un máximo de tiempo de dos (2) días para trabajar su situación. El o la estudiantes tendrán tareas específicas y se compromete a rendir los avances cada día bajo la supervisión del maestro y la familia. Los padres, madres o tutores deberán revisar y firmar las tareas asignadas a los estudiantes.",
        "Matrícula condicional, hasta superar la falta bajo evaluación del equipo disciplinario, al final del período.",
        "Asignación de labores de ayuda y servicio a la comunidad educativa, en la forma y momento indicado por la Dirección del Centro Educativo, fuera del horario escolar, siempre y cuando se presente el consentimiento informado y firmado por los padres.",
        "Asignación de trabajos extras: investigaciones, elaboración de cartelera, exposición de un tema relacionado con el valor al cual se faltó.",
        "Excusa pública del estudiante, o grupo de estudiantes, si la falta lo amerita.",
        "Resarcir la falta (reponer, devolver, arreglar, entre otros)."
    ],
    
    sancionesMuyGraves: [
        "Suspensión de asistencia a clases por un período escolar, o la mitad del mismo, debiendo realizar las tareas indicadas por los docentes, con el compromiso de rendir avance y presentarse a evaluaciones cada quince (15) días, y al final del período.",
        "Retiro definitivo del Centro Educativo cuando la severidad de la falta cometida así lo amerite.",
        "Puesta en marcha de procedimientos de intervención judicial o legales, de acuerdo con las transgresiones de menores estipuladas en la ley 136-03 y otras normativas nacionales."
    ],
    
    notasImportantes: {

     leves: `
        <p><strong>Art. 39:</strong> Cuando las faltas leves son reiterativas se convierten en faltas graves porque una falta cometida de manera sistemática afecta el clima escolar, el ambiente de aprendizaje y la disciplina general del centro. Si un estudiante no logra adaptarse a la disciplina general, violando reiteradamente el Manual de Convivencia con faltas leves podría tener consecuencias en el logro de los aprendizajes y en su permanencia en el Centro Educativo.</p>
        
        <p><strong>Art. 40:</strong> Si un estudiante acumula más de dos faltas leves el Departamento de disciplina convocará a los padres del mismo y se tomarán las medidas de lugar, a fin de que las mismas no se conviertan en faltas graves. Se seguirá el siguiente procedimiento:</p>
        <ul style="margin-left: 40px; padding-left: 20px;">
            <li>Se convocara a los padres o tutores del estudiante.</li>
            <li>Se sostendrá un dialogo reflexivo con el estudiante y sus padres o representantes.</li>
            <li>Se tomaran acuerdos y compromisos de mejora. (Entre ellos labores en el centro).</li>
            <li>Se firmara la asistencia de ambos y los acuerdos correspondientes.</li>
        </ul>
    `,
    
        graves: `
           <p><strong>Art. 42:</strong> Las FALTAS GRAVES son plausibles de sanción, lo cual implica una privación temporal de alguno de los beneficios que tiene el estudiante como miembro de la comunidad educativa de los Centros Educativos de las Hijas de María Auxiliadora, Salesianas.</p>
        
           <p><strong>Párrafo:</strong> La sanción aplicada a un estudiante constará en su expediente académico personal desde la primera vez en que incurra en falta grave.</p>
        
           <p><strong>Art. 44:</strong> Las faltas graves la reincidencia en ellas, así como también el incumplimiento de sanciones, serán motivos para inscripción condicional en el Centro Educativo. El estudiante y su familia deberán solicitar nuevamente y por escrito la inscripción, si se le concede será bajo acuerdos y compromisos que deberán ser evaluados al final de cada periodo.</p>
        
           <p><strong>Art. 45:</strong> Las FALTAS GRAVES pueden considerarse faltas MUY GRAVES cuando estas sean cometidas de forma reiterativa y/o con intenciones de hacer daño.</p>
    `,
    
       muyGraves: `
           <p><strong>Art. 47:</strong> Además de las anteriores, serán faltas gravísimas otras situaciones que surjan, perjudicando a la Comunidad Educativa y que sean evaluadas como tales por el equipo de disciplina del Centro Educativo.</p>
        
           <p><strong>Art. 49:</strong> Ante cualquier falta MUY GRAVE, el Centro procederá a la cancelación de la matrícula al estudiante. El equipo de disciplina del Centro Educativo se reserva el derecho de determinar el momento de la cancelación de matrícula, después de analizar la severidad del caso.</p>
    `
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
            <p class="seccion-intro"> <strong>ART. 38: Las FALTAS LEVES</strong> son aquellas que por la naturaleza de la acción no atentan contra los valores y principios éticos / morales o filosóficos de la Institución. Estas faltas se consideran como tales porque son fruto de la irreflexión del estudiante, en una palabra, como decía Don Bosco, de la inmadurez propia de la edad, aunque no por esto son justificables. En los Centros Educativos de las Hijas de María Auxiliadora, Salesianas, cada falta leve tiene su consecuencia, convirtiéndose la misma en <strong>FALTA GRAVE</strong> cuando es realizada de manera reiterada por el estudiante (esto quiere decir más de dos veces). A continuación, se enumeran las faltas leves y su consecuente medida correctiva:</p>
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
            <p class="seccion-intro"><strong>Art. 41:</strong> Se describen como <strong>FALTAS GRAVES</strong> aquellas acciones que por su naturaleza afectan de manera significativa al propio estudiante, a los compañeros o a cualquier miembro de la comunidad educativa. También son consideradas faltas graves aquellas acciones que atentan contra los valores declarados de la Institución, a saber, honestidad, disciplina, tolerancia, justicia, solidaridad, paz, responsabilidad, espíritu de familia, alegría, amor a la vida, respeto, patriotismo, por considerarse el marco de referencia del Manual de Convivencia, de cuyo cumplimiento o no depende el clima del centro. Se consideran faltas graves las siguientes:</p>
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
            <p class="seccion-intro"><strong>Art. 47:</strong> Son consideradas <strong>FALTAS MUY GRAVES</strong> en los Centros Educativos de las Hijas de María Auxiliadora,  Salesianas, todas las acciones que, por su naturaleza, atenten contra la moral y las buenas costumbres, además de aquellas que involucren conductas antisociales, pandillismo, agresiones, o comportamientos reñidos con la ley. Dentro de estas se encuentran:</p>
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
