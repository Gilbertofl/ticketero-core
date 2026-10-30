import { api } from './api.js';
const SESSION_STORAGE_KEY = 'ticketero_session';
export function getActiveSession() {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.id || !parsed.email || !parsed.role) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
export function saveSession(session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
export function clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}
function redirectToRoleView(role, fromLoginPage) {
    const prefix = fromLoginPage ? './views/' : './';
    switch (role) {
        case 'CLIENTE':
            window.location.assign(`${prefix}inicio.html`);
            break;
        case 'SOPORTE':
            window.location.assign(`${prefix}index.html`);
            break;
        default:
            window.location.assign(`${prefix}404.html`);
            break;
    }
}
function initLoginPage() {
    const existingSession = getActiveSession();
    if (existingSession) {
        redirectToRoleView(existingSession.role, true);
        return;
    }
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageBox = document.getElementById('text--message');
    // Chips de acceso rápido
    const demoClientBtn = document.getElementById('demoClientBtn');
    const demoSupportBtn = document.getElementById('demoSupportBtn');
    if (demoClientBtn && emailInput && passwordInput) {
        demoClientBtn.addEventListener('click', () => {
            emailInput.value = 'example1@live.com';
            passwordInput.value = '12345';
            if (messageBox)
                messageBox.textContent = '';
        });
    }
    if (demoSupportBtn && emailInput && passwordInput) {
        demoSupportBtn.addEventListener('click', () => {
            emailInput.value = 'example2@live.com';
            passwordInput.value = '5263';
            if (messageBox)
                messageBox.textContent = '';
        });
    }
    if (!loginForm || !emailInput || !passwordInput)
        return;
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (messageBox) {
            messageBox.textContent = '';
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        try {
            const result = await api.login(email, password);
            if (result.success && result.user) {
                saveSession(result.user);
                redirectToRoleView(result.user.role, true);
            }
            else if (messageBox) {
                messageBox.textContent = result.message || '*Credenciales incorrectas*';
            }
        }
        catch {
            if (messageBox) {
                messageBox.textContent = 'Error de conexión con el servidor.';
            }
        }
    });
}
function initProtectedView(requiredRole) {
    const session = getActiveSession();
    if (!session) {
        window.location.replace('../index.html');
        return;
    }
    if (session.role !== requiredRole) {
        redirectToRoleView(session.role, false);
        return;
    }
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) {
        emailDisplay.textContent = session.email;
    }
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.textContent = session.role;
    }
    const menuButton = document.getElementById('userMenuButton');
    const dropdownContent = document.getElementById('dropdownContent');
    const logoutButton = document.getElementById('logoutButton');
    if (menuButton && dropdownContent) {
        menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        window.addEventListener('click', () => {
            dropdownContent.classList.remove('show');
        });
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            clearSession();
            window.location.replace('../index.html');
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const viewRole = document.body.getAttribute('data-view');
    if (viewRole === 'CLIENTE' || viewRole === 'SOPORTE') {
        initProtectedView(viewRole);
    }
    else {
        initLoginPage();
    }
});
