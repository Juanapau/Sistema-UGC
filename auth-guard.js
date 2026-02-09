// ==========================================
// SISTEMA DE AUTENTICACIÓN UGC - FINAL
// Versión 3.0 - Sin agregar elementos al header
// ==========================================

(function() {
'use strict';

console.log('🔐 Iniciando sistema de autenticación UGC v3.0...');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const CONFIG_AUTH = {
paginaLogin: 'index.html',
paginaAdmin: 'admin.html',
paginaConsulta: 'consulta.html',
sesionKey: 'usuarioUGC'
};

// ==========================================
// VERIFICAR AUTENTICACIÓN AL CARGAR
// ==========================================

function verificarAutenticacion() {
const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
const usuarioData = localStorage.getItem(CONFIG_AUTH.sesionKey);

console.log('📄 Página actual:', paginaActual);

// Si estamos en la página de login, no hacer nada más
if (paginaActual === CONFIG_AUTH.paginaLogin) {
console.log('✅ Página de login - No se requiere autenticación');
return null;
}

// Si no hay sesión activa
if (!usuarioData) {
console.log('❌ No hay sesión activa');
console.log('🔀 Redirigiendo a login...');
window.location.href = CONFIG_AUTH.paginaLogin;
return null;
}

// Parsear datos del usuario
const usuario = JSON.parse(usuarioData);
console.log('✅ Usuario autenticado:', usuario.nombre);
console.log('👤 Rol:', usuario.rol);

// Verificar acceso según rol y página
if (paginaActual === CONFIG_AUTH.paginaAdmin && usuario.rol !== 'administrador') {
console.log('⚠️ Acceso denegado a admin.html - Rol no autorizado');
window.location.href = CONFIG_AUTH.paginaConsulta;
return null;
}

if (paginaActual === CONFIG_AUTH.paginaConsulta && usuario.rol === 'administrador') {
console.log('ℹ️ Administrador accediendo a vista de consulta (permitido)');
}

return usuario;
}

// ==========================================
// CONFIGURAR INTERFAZ SEGÚN ROL
// ==========================================

function configurarInterfazSegunRol(usuario) {
if (!usuario) return;

console.log('🎨 Configurando interfaz para:', usuario.rol);

// Actualizar datos de usuario en elementos existentes
actualizarDatosUsuario(usuario);

// Si es usuario de consulta, deshabilitar controles
if (usuario.rol === 'consulta') {
console.log('🔒 Aplicando modo solo lectura...');
setTimeout(() => {
deshabilitarControlesEdicion();
}, 500);
}
}

// ==========================================
// ACTUALIZAR DATOS DE USUARIO
// ==========================================

function actualizarDatosUsuario(usuario) {
// Para admin.html
const userNameAdmin = document.getElementById('userNameAdmin');
const userCargoAdmin = document.getElementById('userCargoAdmin');

if (userNameAdmin) {
userNameAdmin.textContent = usuario.nombre;
console.log('✅ Nombre de usuario actualizado (admin)');
}

if (userCargoAdmin && usuario.cargo) {
userCargoAdmin.textContent = usuario.cargo;
console.log('✅ Cargo de usuario actualizado (admin)');
}

// Para consulta.html
const userName = document.getElementById('userName');
const userCargo = document.getElementById('userCargo');

if (userName) {
userName.textContent = usuario.nombre;
console.log('✅ Nombre de usuario actualizado (consulta)');
}

if (userCargo && usuario.cargo) {
userCargo.textContent = '💼 ' + usuario.cargo;
console.log('✅ Cargo de usuario actualizado (consulta)');
}
}

// ==========================================
// DESHABILITAR CONTROLES DE EDICIÓN
// ==========================================

function deshabilitarControlesEdicion() {
console.log('🔒 Deshabilitando controles de edición...');

// Deshabilitar todos los botones de acción
const selectoresBotones = [
'button[onclick*="guardar"]',
'button[onclick*="Guardar"]',
'button[onclick*="eliminar"]',
'button[onclick*="Eliminar"]',
'button[onclick*="editar"]',
'button[onclick*="Editar"]',
'button[onclick*="crear"]',
'button[onclick*="Crear"]',
'button[onclick*="registrar"]',
'button[onclick*="Registrar"]',
'button[type="submit"]',
'.btn-guardar',
'.btn-eliminar',
'.btn-editar',
'.btn-crear'
];

selectoresBotones.forEach(selector => {
document.querySelectorAll(selector).forEach(btn => {
btn.disabled = true;
btn.style.opacity = '0.4';
btn.style.cursor = 'not-allowed';
btn.title = '🔒 Acción no permitida - Usuario de solo consulta';

// Prevenir clics
btn.onclick = function(e) {
e.preventDefault();
e.stopPropagation();
mostrarAlertaPermisos();
return false;
};
});
});

// Deshabilitar inputs en formularios
const inputs = document.querySelectorAll('input:not([type="search"]), textarea, select');
inputs.forEach(input => {
// No deshabilitar inputs de búsqueda/filtro
if (input.id && (input.id.includes('buscar') || input.id.includes('filtro'))) {
return;
}

input.disabled = true;
input.style.cursor = 'not-allowed';
input.style.background = '#f3f4f6';
});

console.log('✅ Controles deshabilitados');
}

// ==========================================
// MOSTRAR ALERTA DE PERMISOS
// ==========================================

function mostrarAlertaPermisos() {
alert('🔒 Acción No Permitida\n\nNo tienes permisos para realizar esta acción.\n\nTu cuenta es de SOLO LECTURA.\n\nPara solicitar permisos de administrador, contacta a la Unidad de Gestión de Convivencia.');
}

// ==========================================
// FUNCIONES GLOBALES
// ==========================================

// Cerrar sesión
window.cerrarSesionUGC = function() {
const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');

if (confirmar) {
localStorage.removeItem(CONFIG_AUTH.sesionKey);
console.log('👋 Sesión cerrada');
window.location.href = 'index.html';
}
};

// Obtener usuario actual
window.obtenerUsuarioActualUGC = function() {
const usuarioData = localStorage.getItem(CONFIG_AUTH.sesionKey);
return usuarioData ? JSON.parse(usuarioData) : null;
};

// Verificar si es administrador
window.esAdministradorUGC = function() {
const usuario = window.obtenerUsuarioActualUGC();
return usuario && usuario.rol === 'administrador';
};

// Verificar si puede realizar acción
window.puedeRealizarAccionUGC = function(accion) {
const usuario = window.obtenerUsuarioActualUGC();

if (!usuario) {
alert('⚠️ Debes iniciar sesión para realizar esta acción.');
window.location.href = 'index.html';
return false;
}

if (usuario.rol === 'consulta') {
mostrarAlertaPermisos();
return false;
}

return true;
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

// Ejecutar al cargar DOM
document.addEventListener('DOMContentLoaded', function() {
console.log('📋 DOM cargado - Inicializando autenticación...');

const usuario = verificarAutenticacion();

if (usuario) {
configurarInterfazSegunRol(usuario);
}
});

// También ejecutar inmediatamente (por si DOMContentLoaded ya pasó)
if (document.readyState === 'loading') {
console.log('⏳ Esperando carga del DOM...');
} else {
console.log('⚡ DOM ya cargado - Ejecutando verificación inmediata...');
const usuario = verificarAutenticacion();
if (usuario) {
configurarInterfazSegunRol(usuario);
}
}

console.log('✅ Sistema de autenticación UGC v3.0 cargado');
console.log('📝 Configuración:');
console.log('  - Login:', CONFIG_AUTH.paginaLogin);
console.log('  - Admin:', CONFIG_AUTH.paginaAdmin);
console.log('  - Consulta:', CONFIG_AUTH.paginaConsulta);

})();
