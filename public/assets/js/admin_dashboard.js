// ==================================================================
// ADMIN_DASHBOARD.JS - LÓGICA UNIFICADA PARA DASHBOARD Y MODAL
// ==================================================================

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
    const db = firebase.firestore();
    const functions = firebase.functions();
    const remoteConfig = firebase.remoteConfig();

    // --- ELEMENTOS DEL DOM (DASHBOARD) ---
    // ... (la mayoría de tus selectores existentes están bien)
    const loginView = document.getElementById("login-view");
    const adminDashboardView = document.getElementById("admin-dashboard-view");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const mainTitle = document.getElementById("main-title");
    
    // --- ELEMENTOS DEL DOM (MODAL) ---
    const modal = document.getElementById("admin-data-modal");
    const closeModalBtn = document.getElementById("close-admin-modal-btn");
    const modalTitleEl = document.getElementById("admin-modal-title");
    const modalForm = document.getElementById("admin-modal-form");
    const saveBtn = document.getElementById("admin-modal-save-btn");
    const deleteBtn = document.getElementById("admin-modal-delete-btn");
    const formFieldsContainer = document.getElementById("admin-modal-form-fields");
    const deleteConfirmation = document.getElementById("admin-modal-delete-confirmation");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

    // --- ESTADO DE LA APLICACIÓN ---
    let allClients = [], allProperties = [], allProjects = [], allTransactions = [];
    let currentItem = null;
    let currentCollection = '';

    // ==================================================================
    // INICIALIZACIÓN Y AUTENTICACIÓN
    // ==================================================================
    auth.onAuthStateChanged(user => {
        if (user) {
            checkAdminStatus(user);
        } else {
            showView("login");
        }
    });

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(error => console.error("Error de inicio de sesión:", error));
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => auth.signOut());
    }

    async function checkAdminStatus(user) {
        try {
            await remoteConfig.fetchAndActivate();
            const adminEmails = JSON.parse(remoteConfig.getString("admin_emails")).emails;
            if (adminEmails.includes(user.email)) {
                showView("dashboard");
                initializeAdminDashboard(user);
            } else {
                alert("Acceso denegado. Tu cuenta no tiene permisos de administrador.");
                auth.signOut();
            }
        } catch (error) {
            console.error("Error al verificar permisos:", error);
            alert("Error al verificar permisos. Por favor, inténtalo de nuevo.");
            auth.signOut();
        }
    }

    function initializeAdminDashboard(user) {
        document.getElementById("user-avatar").src = user.photoURL || "https://via.placeholder.com/40";
        document.getElementById("current-date" ).textContent = new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        loadAllData();
        setupEventListeners();
        renderSection("summary");
    }

    // ==================================================================
    // LÓGICA DEL MODAL (Añadir/Editar/Eliminar)
    // ==================================================================

    // Función para abrir el modal
    window.openAdminModal = (collectionName, item = null) => {
        currentCollection = collectionName;
        currentItem = item;
        modalForm.reset();
        formFieldsContainer.innerHTML = '';
        deleteConfirmation.style.display = 'none';
        
        const singularName = collectionName === 'accounting' ? 'Transacción' : collectionName.slice(0, -1);

        if (item) {
            modalTitleEl.textContent = `Editar ${singularName}`;
            saveBtn.textContent = 'Guardar Cambios';
            deleteBtn.style.display = 'inline-block';
            createFormFields(collectionName, item);
        } else {
            modalTitleEl.textContent = `Añadir Nueva ${singularName}`;
            saveBtn.textContent = 'Añadir';
            deleteBtn.style.display = 'none';
            createFormFields(collectionName);
        }
        modal.classList.add('visible');
    };

    // Función para cerrar el modal
    const closeAdminModal = () => {
        modal.classList.remove('visible');
        currentItem = null;
        currentCollection = '';
    };

    // Crear campos del formulario dinámicamente
    function createFormFields(collectionName, data = {}) {
        let fieldsHtml = '';
        switch (collectionName) {
            case 'clients':
                fieldsHtml = `
                    <div class="form-group"><label for="client-name">Nombre</label><input type="text" id="client-name" name="name" value="${data.name || ''}" required></div>
                    <div class="form-group"><label for="client-email">Email</label><input type="email" id="client-email" name="email" value="${data.email || ''}" required></div>
                    <div class="form-group"><label for="client-phone">Teléfono</label><input type="tel" id="client-phone" name="phone" value="${data.phone || ''}"></div>
                    <div class="form-group"><label for="client-status">Estado</label><select id="client-status" name="status" required><option value="activo" ${data.status === 'activo' ? 'selected' : ''}>Activo</option><option value="potencial" ${data.status === 'potencial' ? 'selected' : ''}>Potencial</option><option value="inactivo" ${data.status === 'inactivo' ? 'selected' : ''}>Inactivo</option></select></div>
                    <div class="form-group"><label for="client-notes">Notas</label><textarea id="client-notes" name="notes">${data.notes || ''}</textarea></div>`;
                break;
            case 'properties':
                fieldsHtml = `
                    <div class="form-group"><label for="property-name">Nombre/Modelo</label><input type="text" id="property-name" name="name" value="${data.name || ''}" required></div>
                    <div class="form-group"><label for="property-modules">Módulos</label><input type="number" id="property-modules" name="modules" value="${data.modules || 1}" min="1" required></div>
                    <div class="form-group"><label for="property-price">Precio</label><input type="number" id="property-price" name="price" value="${data.price || 0}" min="0" required></div>
                    <div class="form-group"><label for="property-status">Estado</label><select id="property-status" name="status" required><option value="disponible" ${data.status === 'disponible' ? 'selected' : ''}>Disponible</option><option value="vendida" ${data.status === 'vendida' ? 'selected' : ''}>Vendida</option><option value="en-construccion" ${data.status === 'en-construccion' ? 'selected' : ''}>En Construcción</option></select></div>
                    <div class="form-group"><label for="property-location">Ubicación</label><input type="text" id="property-location" name="location" value="${data.location || ''}"></div>
                    <div class="form-group"><label for="property-description">Descripción</label><textarea id="property-description" name="description">${data.description || ''}</textarea></div>`;
                break;
            case 'projects':
                fieldsHtml = `
                    <div class="form-group"><label for="project-name">Nombre del Proyecto</label><input type="text" id="project-name" name="name" value="${data.name || ''}" required></div>
                    <div class="form-group"><label for="project-client-id">ID Cliente (Firebase)</label><input type="text" id="project-client-id" name="clientId" value="${data.clientId || ''}" placeholder="ID del cliente asociado" required></div>
                    <div class="form-group"><label for="project-start-date">Fecha Inicio</label><input type="date" id="project-start-date" name="startDate" value="${data.startDate || ''}" required></div>
                    <div class="form-group"><label for="project-status">Estado</label><select id="project-status" name="status" required><option value="planificacion" ${data.status === 'planificacion' ? 'selected' : ''}>Planificación</option><option value="activo" ${data.status === 'activo' ? 'selected' : ''}>Activo</option><option value="completado" ${data.status === 'completado' ? 'selected' : ''}>Completado</option><option value="pausado" ${data.status === 'pausado' ? 'selected' : ''}>Pausado</option></select></div>
                    <div class="form-group"><label for="project-description">Descripción</label><textarea id="project-description" name="description">${data.description || ''}</textarea></div>`;
                break;
            case 'accounting':
                fieldsHtml = `
                    <div class="form-group"><label for="transaction-description">Descripción</label><input type="text" id="transaction-description" name="description" value="${data.description || ''}" required></div>
                    <div class="form-group"><label for="transaction-amount">Monto</label><input type="number" id="transaction-amount" name="amount" value="${data.amount || 0}" step="0.01" required></div>
                    <div class="form-group"><label for="transaction-type">Tipo</label><select id="transaction-type" name="type" required><option value="ingreso" ${data.type === 'ingreso' ? 'selected' : ''}>Ingreso</option><option value="gasto" ${data.type === 'gasto' ? 'selected' : ''}>Gasto</option></select></div>
                    <div class="form-group"><label for="transaction-date">Fecha</label><input type="date" id="transaction-date" name="date" value="${data.date || new Date().toISOString().split('T')[0]}" required></div>
                    <div class="form-group"><label for="transaction-notes">Notas</label><textarea id="transaction-notes" name="notes">${data.notes || ''}</textarea></div>`;
                break;
            default:
                fieldsHtml = `<p>No hay campos definidos para esta sección.</p>`;
        }
        formFieldsContainer.innerHTML = fieldsHtml;
    }

    // Manejar el envío del formulario (Guardar)
    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

        const formData = new FormData(modalForm);
        let dataToSave = Object.fromEntries(formData.entries());

        // Convertir tipos de datos
        ['price', 'budget', 'amount'].forEach(field => {
            if (dataToSave[field]) dataToSave[field] = parseFloat(dataToSave[field]);
        });
        if (dataToSave.modules) dataToSave.modules = parseInt(dataToSave.modules);

        try {
            if (currentItem) {
                await db.collection(currentCollection).doc(currentItem.id).update(dataToSave);
                alert('Elemento actualizado con éxito.');
            } else {
                dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(currentCollection).add(dataToSave);
                alert('Nuevo elemento añadido con éxito.');
            }
            closeAdminModal();
        } catch (error) {
            console.error("Error al guardar datos:", error);
            alert("Error al guardar los datos.");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = currentItem ? 'Guardar Cambios' : 'Añadir';
        }
    });

    // Manejar la eliminación
    deleteBtn.addEventListener('click', () => deleteConfirmation.style.display = 'block');
    cancelDeleteBtn.addEventListener('click', () => deleteConfirmation.style.display = 'none');
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!currentItem) return;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Eliminando...`;

        try {
            await db.collection(currentCollection).doc(currentItem.id).delete();
            alert('Elemento eliminado con éxito.');
            closeAdminModal();
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar el elemento.");
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Sí, Eliminar';
        }
    });

    // Asignar eventos de cierre del modal
    closeModalBtn.addEventListener('click', closeAdminModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAdminModal();
    });

    // ==================================================================
    // CARGA DE DATOS Y RENDERIZADO DEL DASHBOARD
    // (Esta parte es mayormente tu código original, con pequeñas correcciones)
    // ==================================================================
    
    function setupEventListeners() {
        // Navegación del Sidebar
        document.querySelector(".sidebar-nav").addEventListener("click", (e) => {
            const navItem = e.target.closest(".nav-item");
            if (navItem) {
                e.preventDefault();
                const sectionId = navItem.getAttribute("data-section");
                renderSection(sectionId);
                document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => item.classList.remove("active"));
                navItem.classList.add("active");
            }
        });

        // Botones "Añadir Nuevo"
        document.querySelectorAll(".add-new-btn").forEach(button => {
            button.addEventListener("click", () => {
                // Determina la colección a partir del ID de la sección padre
                const sectionId = button.closest(".dashboard-section").id;
                let collectionName = sectionId;
                // Caso especial para la sección de contabilidad
                if (sectionId === 'accounting') {
                    collectionName = 'accounting'; // El nombre de la colección es 'accounting'
                }
                window.openAdminModal(collectionName, null);
            });
        });
        
        // Listeners para filtros y búsquedas
        // (Tu código original para esto está bien)
    }

    function renderSection(sectionId) {
        document.querySelectorAll(".dashboard-section").forEach(section => section.classList.remove("active"));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add("active");
            mainTitle.textContent = targetSection.querySelector("h2")?.textContent || "Resumen del Administrador";
            // Llama a la función de renderizado de tabla correspondiente
            switch (sectionId) {
                case "clients": renderClientsTable(); break;
                case "properties": renderPropertiesTable(); break;
                case "projects": renderProjectsTable(); break;
                case "accounting": renderAccountingTable(); break;
                // case "settings": loadAdminList(); break; // Si tienes esta función
            }
        }
    }
    
    function loadAllData() {
        db.collection("clients").onSnapshot(snapshot => {
            allClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderClientsTable();
            updateKPIs();
        });
        db.collection("properties").onSnapshot(snapshot => {
            allProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderPropertiesTable();
            updateKPIs();
        });
        db.collection("projects").onSnapshot(snapshot => {
            allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProjectsTable();
            updateKPIs();
        });
        db.collection("accounting").onSnapshot(snapshot => {
            allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAccountingTable();
            updateKPIs();
        });
    }

    // --- Funciones de renderizado de tablas (renderClientsTable, etc.) ---
    // Tu código original para estas funciones está bien. Solo asegúrate de que los botones
    // de editar llamen a `window.openAdminModal` correctamente.

    function renderClientsTable() {
        const tableBody = document.getElementById("clients-table-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        // Lógica de filtrado...
        allClients.forEach(client => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(client.name)}</td>
                <td>${escapeHtml(client.email)}</td>
                <td>${escapeHtml(client.phone || '-')}
                <td><span>${escapeHtml(client.status || 'Activo')}</span></td>
                <td><button class="btn-secondary btn-small edit-btn" data-id="${client.id}"><i class="fas fa-edit"></i> Editar</button></td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => {
                window.openAdminModal("clients", client);
            });
            tableBody.appendChild(row);
        });
    }
    
    // Repite un patrón similar para renderPropertiesTable, renderProjectsTable, y renderAccountingTable,
    // asegurándote que el botón de editar llame a `window.openAdminModal` con los parámetros correctos.
    // Ejemplo para propiedades:
    function renderPropertiesTable() {
        const tableBody = document.getElementById("properties-table-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        allProperties.forEach(prop => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(prop.name)}</td>
                <td>${escapeHtml(prop.modules)}</td>
                <td>$${prop.price.toLocaleString()}</td>
                <td><span>${escapeHtml(prop.status)}</span></td>
                <td><button class="btn-secondary btn-small edit-btn" data-id="${prop.id}"><i class="fas fa-edit"></i> Editar</button></td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => {
                window.openAdminModal("properties", prop);
            });
            tableBody.appendChild(row);
        });
    }
    
    // ... y así sucesivamente para las otras tablas.

    // --- El resto de tus funciones (updateKPIs, renderActivityChart, showView, escapeHtml, etc.) ---
    // Tu código original para estas funciones es correcto y puede permanecer como está.
    
    function showView(viewName) {
        if (loginView) loginView.style.display = viewName === "login" ? "flex" : "none";
        if (adminDashboardView) adminDashboardView.style.display = viewName === "dashboard" ? "grid" : "none";
    }

    function escapeHtml(unsafe) {
        return unsafe ? unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
    }
    
    // Placeholder para las funciones que faltan para que no den error
    function updateKPIs() { /* Tu lógica de KPIs aquí */ }
    function renderProjectsTable() { /* Tu lógica de renderizado aquí */ }
    function renderAccountingTable() { /* Tu lógica de renderizado aquí */ }

});