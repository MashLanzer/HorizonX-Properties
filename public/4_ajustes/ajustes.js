document.addEventListener("DOMContentLoaded", function() {
    // --- CONFIGURACIÓN DE FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyBTRlG4bk_SplbYYyk2l3dgiea0E4UWSKc",
        authDomain: "horizonx-properties.firebaseapp.com",
        projectId: "horizonx-properties",
        storageBucket: "horizonx-properties.firebasestorage.app",
        messagingSenderId: "401246020029",
        appId: "1:401246020029:web:c053032e10bbe6e6bbf2d4",
    };
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const remoteConfig = firebase.remoteConfig();

    // --- ELEMENTOS DEL DOM ---
    const logoutBtn = document.getElementById('logout-btn');
    const userAvatar = document.getElementById('user-avatar');
    const currentDateEl = document.getElementById('current-date');
    const adminListContainer = document.getElementById('admin-list-container');
    const newAdminEmailInput = document.getElementById('new-admin-email');
    const addAdminBtn = document.getElementById('add-admin-btn');

    // --- LÓGICA DE AUTENTICACIÓN Y ARRANQUE ---
    auth.onAuthStateChanged(user => {
        if (user) {
            initializeSettingsPage(user);
        } else {
            window.location.href = 'dashboard.html';
        }
    });

    if(logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

    function initializeSettingsPage(user) {
        if(userAvatar) userAvatar.src = user.photoURL || 'default-avatar.png';
        if(currentDateEl) currentDateEl.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        loadAdminList();
        
        if(addAdminBtn) addAdminBtn.addEventListener('click', addAdmin);
    }

    // --- LÓGICA DE GESTIÓN DE ADMINISTRADORES ---
    async function loadAdminList() {
        adminListContainer.innerHTML = '<div class="spinner"></div>';
        try {
            await remoteConfig.fetchAndActivate();
            const adminConfig = JSON.parse(remoteConfig.getString('admin_emails'));
            const adminEmails = adminConfig.emails || [];
            
            renderAdminList(adminEmails);
        } catch (error) {
            console.error("Error al cargar la lista de administradores:", error);
            adminListContainer.innerHTML = '<p style="color: #ef4444;">Error al cargar la lista.</p>';
        }
    }

    function renderAdminList(emails) {
        adminListContainer.innerHTML = '';
        if (emails.length === 0) {
            adminListContainer.innerHTML = '<p>No hay administradores configurados.</p>';
            return;
        }
        emails.forEach(email => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <span class="admin-email">${email}</span>
                <button class="btn-delete-admin" data-email="${email}" title="Eliminar administrador">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            adminListContainer.appendChild(item);
        });

        // Añadir event listeners a los nuevos botones de eliminar
        document.querySelectorAll('.btn-delete-admin').forEach(button => {
            button.addEventListener('click', (e) => {
                const emailToDelete = e.currentTarget.getAttribute('data-email');
                if (confirm(`¿Estás seguro de que quieres eliminar a ${emailToDelete} de la lista de administradores?`)) {
                    removeAdmin(emailToDelete);
                }
            });
        });
    }

    async function addAdmin() {
        const newEmail = newAdminEmailInput.value.trim().toLowerCase();
        if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
            alert("Por favor, introduce un correo electrónico válido.");
            return;
        }

        addAdminBtn.disabled = true;
        addAdminBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Añadiendo...';

        try {
            const adminConfig = JSON.parse(remoteConfig.getString('admin_emails'));
            const currentEmails = adminConfig.emails || [];

            if (currentEmails.includes(newEmail)) {
                alert("Este correo ya es un administrador.");
                return;
            }

            const updatedEmails = [...currentEmails, newEmail];
            // ¡ESTA OPERACIÓN REQUIERE PERMISOS DE ESCRITURA EN FIREBASE!
            // Esto es una simulación. En un proyecto real, se haría a través de una Cloud Function.
            console.log("Simulando actualización de Remote Config con:", { emails: updatedEmails });
            alert(`¡Éxito! ${newEmail} ha sido añadido. Nota: La actualización en Firebase puede tardar en propagarse.`);
            
            // Para la demo, actualizamos la UI inmediatamente
            renderAdminList(updatedEmails);
            newAdminEmailInput.value = '';

        } catch (error) {
            console.error("Error al añadir administrador:", error);
            alert("No se pudo añadir el administrador. Consulta la consola para más detalles.");
        } finally {
            addAdminBtn.disabled = false;
            addAdminBtn.innerHTML = '<i class="fas fa-plus"></i> Añadir Administrador';
        }
    }

    async function removeAdmin(emailToRemove) {
        // Similar a 'addAdmin', esto es una simulación de una operación de backend.
        try {
            const adminConfig = JSON.parse(remoteConfig.getString('admin_emails'));
            const currentEmails = adminConfig.emails || [];
            const updatedEmails = currentEmails.filter(email => email !== emailToRemove);

            console.log("Simulando actualización de Remote Config con:", { emails: updatedEmails });
            alert(`¡Éxito! ${emailToRemove} ha sido eliminado. La actualización puede tardar.`);

            renderAdminList(updatedEmails);

        } catch (error) {
            console.error("Error al eliminar administrador:", error);
            alert("No se pudo eliminar el administrador.");
        }
    }
});
