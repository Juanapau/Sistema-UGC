// ==========================================
// SISTEMA DE AUTENTICACIÓN Y ROLES
// Agregar este script al inicio de index.html
// ==========================================

(function() {
'use strict';

// ==========================================
// VERIFICAR AUTENTICACIÓN
// ==========================================

function verificarAutenticacion() {
const usuarioData = localStorage.getItem('usuarioUGC');
const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

console.log('🔐 Verificando autenticación...');
console.log('📄 Página actual:', paginaActual);

// Si no hay sesión activa
if (!usuarioData) {
console.log('❌ No hay sesión activa');

// Permitir acceso solo a login
if (paginaActual !== 'login.html') {
console.log('🔀 Redirigiendo a login...');
window.location.href = 'login.html';
}
return null;
}

// Parsear datos del usuario
const usuario = JSON.parse(usuarioData);
console.log('✅ Usuario autenticado:', usuario.nombre, '(' + usuario.rol + ')');

// Verificar roles y páginas
if (paginaActual === 'index.html' && usuario.rol !== 'administrador') {
console.log('⚠️ Acceso denegado: requiere rol administrador');
window.location.href = 'consulta.html';
return null;
}

if (paginaActual === 'consulta.html' && usuario.rol !== 'consulta') {
console.log('⚠️ Usuario no es de consulta');
if (usuario.rol === 'administrador') {
// Los admin pueden ver consulta si quieren
console.log('✅ Permitido: es administrador');
}
}

return usuario;
}

// ==========================================
// CONFIGURAR INTERFAZ SEGÚN ROL
// ==========================================

function configurarInterfazSegunRol(usuario) {
if (!usuario) return;

console.log('🎨 Configurando interfaz para rol:', usuario.rol);

// Si es usuario de consulta, deshabilitar todos los botones de acción
if (usuario.rol === 'consulta') {
console.log('🔒 Deshabilitando controles de edición...');

// Deshabilitar botones de crear/editar/eliminar
setTimeout(() => {
// Deshabilitar todos los botones excepto los de ver/consultar
const botonesAccion = document.querySelectorAll(
'button[onclick*="guardar"], ' +
'button[onclick*="eliminar"], ' +
'button[onclick*="editar"], ' +
'button[onclick*="crear"], ' +
'button[type="submit"]'
);

botonesAccion.forEach(btn => {
btn.disabled = true;
btn.style.opacity = '0.5';
btn.style.cursor = 'not-allowed';
btn.title = '🔒 Acción no permitida - Usuario de solo consulta';
});

// Deshabilitar inputs en formularios
const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
input.disabled = true;
input.style.cursor = 'not-allowed';
});

// Mostrar banner de solo lectura
mostrarBannerSoloLectura();

console.log('✅ Controles deshabilitados');
}, 1000);
}

// Mostrar información del usuario en header
mostrarInfoUsuario(usuario);
}

// ==========================================
// MOSTRAR BANNER DE SOLO LECTURA
// ==========================================

function mostrarBannerSoloLectura() {
const banner = document.createElement('div');
banner.id = 'bannerSoloLectura';
banner.style.cssText = `
position: fixed;
top: 0;
left: 0;
right: 0;
background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
color: #78350f;
padding: 12px 20px;
text-align: center;
font-weight: bold;
z-index: 99999;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
animation: slideDown 0.5s ease-out;
`;

banner.innerHTML = `
🔒 <strong>MODO SOLO LECTURA</strong> - 
No puedes crear, editar ni eliminar registros. 
Para solicitar permisos de administrador, contacta a la UGC.
`;

document.body.insertBefore(banner, document.body.firstChild);

// Ajustar padding del body para el banner
document.body.style.paddingTop = '60px';
}

// ==========================================
// MOSTRAR INFO DE USUARIO EN HEADER
// ==========================================

function mostrarInfoUsuario(usuario) {
// Buscar el header o crear uno
let header = document.querySelector('header, .header, .navbar');

if (!header) {
console.log('⚠️ No se encontró header');
return;
}

// Crear elemento de info de usuario
const userInfo = document.createElement('div');
userInfo.style.cssText = `
display: inline-flex;
align-items: center;
gap: 10px;
background: rgba(255,255,255,0.1);
padding: 8px 15px;
border-radius: 20px;
margin-left: auto;
`;

const rolEmoji = usuario.rol === 'administrador' ? '👑' : '👤';
const rolColor = usuario.rol === 'administrador' ? '#fbbf24' : '#60a5fa';

userInfo.innerHTML = `
<span style="font-size: 1.2em;">${rolEmoji}</span>
<div style="text-align: left;">
<div style="font-size: 0.85em; font-weight: 600;">${usuario.nombre}</div>
<div style="font-size: 0.7em; color: ${rolColor};">${usuario.rol}</div>
</div>
<button onclick="cerrarSesion()" 
style="background: #dc2626; color: white; border: none; 
padding: 6px 12px; border-radius: 6px; cursor: pointer; 
font-size: 0.8em; font-weight: 600;">
🚪 Salir
</button>
`;

header.appendChild(userInfo);
}

// ==========================================
// FUNCIÓN DE CERRAR SESIÓN (GLOBAL)
// ==========================================

window.cerrarSesion = function() {
const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');

if (confirmar) {
localStorage.removeItem('usuarioUGC');
console.log('👋 Sesión cerrada');
window.location.href = 'login.html';
}
};

// ==========================================
// OBTENER USUARIO ACTUAL (GLOBAL)
// ==========================================

window.obtenerUsuarioActual = function() {
const usuarioData = localStorage.getItem('usuarioUGC');
return usuarioData ? JSON.parse(usuarioData) : null;
};

// ==========================================
// VERIFICAR SI ES ADMINISTRADOR (GLOBAL)
// ==========================================

window.esAdministrador = function() {
const usuario = window.obtenerUsuarioActual();
return usuario && usuario.rol === 'administrador';
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
console.log('🔐 Sistema de autenticación inicializado');

const usuario = verificarAutenticacion();

if (usuario) {
configurarInterfazSegunRol(usuario);
}
});

// Ejecutar inmediatamente también (por si DOMContentLoaded ya pasó)
const usuario = verificarAutenticacion();
if (usuario) {
configurarInterfazSegunRol(usuario);
}

})();

// ==========================================
// FUNCIONES AUXILIARES PARA USAR EN TU CÓDIGO
// ==========================================

// Verificar si el usuario puede hacer una acción
function puedeRealizarAccion(accion) {
const usuario = obtenerUsuarioActual();

if (!usuario) {
alert('⚠️ Debes iniciar sesión para realizar esta acción');
window.location.href = 'login.html';
return false;
}

if (usuario.rol === 'consulta') {
alert('🔒 No tienes permisos para realizar esta acción.\n\nSolo tienes acceso de lectura.');
return false;
}

return true;
}

// Ejemplo de uso en tus funciones:
// function guardarIncidencia() {
//     if (!puedeRealizarAccion('guardar')) return;
//     // ... resto del código
// }

console.log('✅ auth-guard.js cargado correctamente');
