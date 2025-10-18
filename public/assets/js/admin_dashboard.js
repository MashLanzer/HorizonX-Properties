
document.addEventListener("DOMContentLoaded", function() {
    // ==================================================================
    // 1. CONFIGURACIÓN DE FIREBASE Y ELEMENTOS DEL DOM
    // ==================================================================
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
    const functions = firebase.functions(); // Mantener si se usa en otro lugar, aunque no en este fragmento
    const remoteConfig = firebase.remoteConfig();

    // --- Elementos del DOM (DASHBOARD) ---
    const loginView = document.getElementById("login-view");
    const adminDashboardView = document.getElementById("admin-dashboard-view");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const mainTitle = document.getElementById("main-title");
    
    // --- Elementos del DOM (MODAL) ---
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

    // --- Elementos de Filtros (Contabilidad) ---
    const transactionSearchInput = document.getElementById("transaction-search");
    const transactionTypeFilter = document.getElementById("transaction-type-filter");

    // --- ESTADO DE LA APLICACIÓN ---
    let allClients = [], allProperties = [], allProjects = [], allTransactions = [];
    let currentItem = null;
    let currentCollection = "";

    // ==================================================================
    // 2. DEFINICIÓN DE TODAS LAS FUNCIONES (ORDEN IMPORTA)
    //    Todas las funciones deben ser definidas antes de ser llamadas.
    // ==================================================================

    // --- Funciones de Utilidad --- 
    function showView(viewName) {
        if (loginView) loginView.style.display = viewName === "login" ? "flex" : "none";
        if (adminDashboardView) adminDashboardView.style.display = viewName === "dashboard" ? "grid" : "none";
    }

    function showToast(message, type = "success") {
        const backgroundColor = type === "success" ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)";
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: backgroundColor,
            stopOnFocus: true,
        }).showToast();
    }

    function escapeHtml(unsafe) {
        return unsafe ? String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\'/g, "&#039;") : "";
    }

    // --- Lógica del Modal (Añadir/Editar/Eliminar) ---
    const closeAdminModal = () => {
        modal.classList.remove("visible");
        currentItem = null;
        currentCollection = "";
    };

    function createFormFields(collectionName, data = {}) {
        let fieldsHtml = "";
        // MEJORA: Se asegura que las fechas se manejen como objetos Date para obtener el valor ISO correcto.
        const toISODateString = (dateStr) => {
            if (!dateStr) return ""; // Devuelve cadena vacía si no hay fecha para evitar errores en input type="date"
            // Si es un timestamp de Firestore, conviértelo
            if (dateStr.seconds) {
                return new Date(dateStr.seconds * 1000).toISOString().split("T")[0];
            }
            // Si ya es una cadena de fecha, úsala
            return new Date(dateStr).toISOString().split("T")[0];
        };
        
        switch (collectionName) {
            case "clients":
                fieldsHtml = `
                    <div class="form-group"><label for="client-name">Nombre</label><input type="text" id="client-name" name="name" value="${data.name || ""}" required></div>
                    <div class="form-group"><label for="client-email">Email</label><input type="email" id="client-email" name="email" value="${data.email || ""}" required></div>
                    <div class="form-group"><label for="client-phone">Teléfono</label><input type="tel" id="client-phone" name="phone" value="${data.phone || ""}"></div>
                    <div class="form-group"><label for="client-status">Estado</label><select id="client-status" name="status" required><option value="activo" ${data.status === "activo" ? "selected" : ""}>Activo</option><option value="potencial" ${data.status === "potencial" ? "selected" : ""}>Potencial</option><option value="inactivo" ${data.status === "inactivo" ? "selected" : ""}>Inactivo</option></select></div>
                    <div class="form-group"><label for="client-notes">Notas</label><textarea id="client-notes" name="notes">${data.notes || ""}</textarea></div>`;
                break;
            case "properties":
                fieldsHtml = `
                    <div class="form-group"><label for="property-name">Nombre/Modelo</label><input type="text" id="property-name" name="name" value="${data.name || ""}" required></div>
                    <div class="form-group"><label for="property-modules">Módulos</label><input type="number" id="property-modules" name="modules" value="${data.modules || 1}" min="1" required></div>
                    <div class="form-group"><label for="property-price">Precio</label><input type="number" id="property-price" name="price" value="${data.price || 0}" min="0" required></div>
                    <div class="form-group"><label for="property-status">Estado</label><select id="property-status" name="status" required><option value="disponible" ${data.status === "disponible" ? "selected" : ""}>Disponible</option><option value="vendida" ${data.status === "vendida" ? "selected" : ""}>Vendida</option><option value="en-construccion" ${data.status === "en-construccion" ? "selected" : ""}>En Construcción</option></select></div>
                    <div class="form-group"><label for="property-location">Ubicación</label><input type="text" id="property-location" name="location" value="${data.location || ""}"></div>
                    <div class="form-group"><label for="property-description">Descripción</label><textarea id="property-description" name="description">${data.description || ""}</textarea></div>`;
                break;
            case "projects":
                fieldsHtml = `
                    <div class="form-group"><label for="project-name">Nombre del Proyecto</label><input type="text" id="project-name" name="name" value="${data.name || ""}" required></div>
                    <div class="form-group"><label for="project-client-id">ID Cliente (Firebase)</label><input type="text" id="project-client-id" name="clientId" value="${data.clientId || ""}" placeholder="ID del cliente asociado" required></div>
                    <div class="form-group"><label for="project-start-date">Fecha Inicio</label><input type="date" id="project-start-date" name="startDate" value="${toISODateString(data.startDate)}" required></div>
                    <div class="form-group"><label for="project-end-date">Fecha Fin (Opcional)</label><input type="date" id="project-end-date" name="endDate" value="${toISODateString(data.endDate)}"></div>
                    <div class="form-group"><label for="project-budget">Presupuesto</label><input type="number" id="project-budget" name="budget" value="${data.budget || 0}" min="0"></div>
                    <div class="form-group"><label for="project-status">Estado</label><select id="project-status" name="status" required><option value="planificacion" ${data.status === "planificacion" ? "selected" : ""}>Planificación</option><option value="activo" ${data.status === "activo" ? "selected" : ""}>Activo</option><option value="completado" ${data.status === "completado" ? "selected" : ""}>Completado</option><option value="pausado" ${data.status === "pausado" ? "selected" : ""}>Pausado</option></select></div>
                    <div class="form-group"><label for="project-description">Descripción</label><textarea id="project-description" name="description">${data.description || ""}</textarea></div>`;
                break;
            case "accounting":
                fieldsHtml = `
                    <div class="form-group"><label for="transaction-description">Descripción</label><input type="text" id="transaction-description" name="description" value="${data.description || ""}" required></div>
                    <div class="form-group"><label for="transaction-amount">Monto</label><input type="number" id="transaction-amount" name="amount" value="${data.amount || 0}" step="0.01" required></div>
                    <div class="form-group"><label for="transaction-type">Tipo</label><select id="transaction-type" name="type" required><option value="ingreso" ${data.type === "ingreso" ? "selected" : ""}>Ingreso</option><option value="gasto" ${data.type === "gasto" ? "selected" : ""}>Gasto</option></select></div>
                    <div class="form-group"><label for="transaction-date">Fecha</label><input type="date" id="transaction-date" name="date" value="${toISODateString(data.date)}" required></div>
                    <div class="form-group"><label for="transaction-notes">Notas</label><textarea id="transaction-notes" name="notes">${data.notes || ""}</textarea></div>`;
                break;
            default:
                fieldsHtml = `<p>No hay campos definidos para esta sección.</p>`;
        }
        formFieldsContainer.innerHTML = fieldsHtml;
    }

    window.openAdminModal = (collectionName, item = null) => {
        currentCollection = collectionName;
        currentItem = item;
        modalForm.reset();
        formFieldsContainer.innerHTML = "";
        deleteConfirmation.style.display = "none";
        
        const singularNames = {
            clients: "Cliente",
            properties: "Propiedad",
            projects: "Proyecto",
            accounting: "Transacción"
        };
        const singularName = singularNames[collectionName] || "Elemento";

        if (item) {
            modalTitleEl.textContent = `Editar ${singularName}`;
            saveBtn.textContent = "Guardar Cambios";
            deleteBtn.style.display = "inline-block";
            createFormFields(collectionName, item);
        } else {
            modalTitleEl.textContent = `Añadir ${singularName}`;
            saveBtn.textContent = "Añadir";
            deleteBtn.style.display = "none";
            createFormFields(collectionName);
        }
        modal.classList.add("visible");
    };

    // --- Funciones de Renderizado de Tablas ---
    function renderClientsTable() {
        const tableBody = document.getElementById("clients-table-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        allClients.forEach(client => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(client.name)}</td>
                <td>${escapeHtml(client.email)}</td>
                <td>${escapeHtml(client.phone || "-")}</td>
                <td><span class="status status-${escapeHtml(client.status || "activo")}">${escapeHtml(client.status || "Activo")}</span></td>
                <td><button class="btn-secondary btn-small edit-btn"><i class="fas fa-edit"></i> Editar</button></td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => window.openAdminModal("clients", client));
            tableBody.appendChild(row);
        });
    }
    
    function renderPropertiesTable() {
        const tableBody = document.getElementById("properties-table-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        allProperties.forEach(prop => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(prop.id)}</td>
                <td>${escapeHtml(prop.name)}</td>
                <td>${escapeHtml(prop.modules)}</td>
                <td>$${(prop.price || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td><span class="status status-${escapeHtml(prop.status)}">${escapeHtml(prop.status)}</span></td>
                <td><button class="btn-secondary btn-small edit-btn"><i class="fas fa-edit"></i> Editar</button></td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => window.openAdminModal("properties", prop));
            tableBody.appendChild(row);
        });
    }

    function renderProjectsTable() {
        const tableBody = document.getElementById("projects-table-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        allProjects.forEach(project => {
            const row = document.createElement("tr");
            const client = allClients.find(c => c.id === project.clientId);
            const startDate = project.startDate ? project.startDate.toDate().toLocaleDateString("es-ES") : "-";
            const endDate = project.endDate ? project.endDate.toDate().toLocaleDateString("es-ES") : "-";
            row.innerHTML = `
                <td>${escapeHtml(project.id)}</td>
                <td>${escapeHtml(project.name)}</td>
                <td>${escapeHtml(client ? client.name : "N/A")}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>$${(project.budget || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td><span class="status status-${escapeHtml(project.status)}">${escapeHtml(project.status)}</span></td>
                <td><button class="btn-secondary btn-small edit-btn"><i class="fas fa-edit"></i> Editar</button></td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => window.openAdminModal("projects", project));
            tableBody.appendChild(row);
        });
    }

    function renderAccountingTable() {
        const tableBody = document.getElementById("transactions-table-body");
        if (!tableBody) return;

        const searchTerm = transactionSearchInput.value.toLowerCase();
        const typeFilter = transactionTypeFilter.value;

        const filteredTransactions = allTransactions.filter(trans => {
            const matchesSearch = trans.description.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || trans.type === typeFilter;
            return matchesSearch && matchesType;
        });

        tableBody.innerHTML = "";
        if (filteredTransactions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No se encontraron transacciones.</td></tr>`;
            return;
        }

        filteredTransactions.forEach(trans => {
            const row = document.createElement("tr");
            const amountClass = trans.type === "ingreso" ? "amount-income" : "amount-expense";
            const dateObject = trans.date ? trans.date.toDate() : new Date(); // Convierte timestamp a Date
            
            row.innerHTML = `
                <td>${dateObject.toLocaleDateString("es-ES")}</td>
                <td>${escapeHtml(trans.description)}</td>
                <td><span class="status status-${escapeHtml(trans.type)}">${escapeHtml(trans.type)}</span></td>
                <td class="${amountClass}">$${(trans.amount || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td><button class="btn-secondary btn-small edit-btn"><i class="fas fa-edit"></i> Editar</button></td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => window.openAdminModal("accounting", trans));
            tableBody.appendChild(row);
        });
    }

    // --- Funciones de Actualización de KPIs ---
    function updateKPIs() {
        // Resumen General
        document.getElementById("total-clients").textContent = allClients.length;
        document.getElementById("active-properties").textContent = allProperties.filter(p => p.status === "disponible" || p.status === "en-construccion").length;
        document.getElementById("ongoing-projects").textContent = allProjects.filter(p => p.status === "activo").length;
        
        const totalIncome = allTransactions.filter(t => t.type === "ingreso").reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = allTransactions.filter(t => t.type === "gasto").reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById("total-revenue").textContent = `$${totalIncome.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;

        // KPIs de Contabilidad
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyIncome = allTransactions
            .filter(t => t.type === "ingreso" && t.date && t.date.toDate() >= firstDayOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = allTransactions
            .filter(t => t.type === "gasto" && t.date && t.date.toDate() >= firstDayOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById("monthly-income").textContent = `$${monthlyIncome.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
        document.getElementById("monthly-expenses").textContent = `$${monthlyExpenses.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
        document.getElementById("current-balance").textContent = `$${(totalIncome - totalExpenses).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
    }

    // --- Lógica de Autenticación y Permisos ---
    async function checkAdminStatus(user) {
        try {
            await remoteConfig.fetchAndActivate();
            const adminEmails = JSON.parse(remoteConfig.getString("admin_emails")).emails;

            if (adminEmails.includes(user.email)) {
                showView("dashboard");
                initializeAdminDashboard(user);
            } else {
                showToast("Acceso denegado. No tienes permisos.", "error");
                auth.signOut();
                showView("login"); // Asegurarse de mostrar la vista de login si no es admin
            }
        } catch (error) {
            console.error("Error al verificar permisos:", error);
            showToast("Error al verificar permisos. Inténtalo de nuevo.", "error");
            auth.signOut();
            showView("login"); // Asegurarse de mostrar la vista de login en caso de error
        }
    }

    function initializeAdminDashboard(user) {
        document.getElementById("user-avatar").src = user.photoURL || "https://via.placeholder.com/40";
        document.getElementById("current-date").textContent = new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        loadAllData(); // Carga inicial de datos y sus listeners
        setupEventListeners(); // Configura los event listeners del dashboard
        renderSection("summary"); // Renderiza la sección de resumen por defecto
    }

    function loadAllData() {
        // Configura listeners en tiempo real para cada colección
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
        db.collection("accounting").orderBy("date", "desc").onSnapshot(snapshot => {
            allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAccountingTable();
            updateKPIs();
        });
    }

    // --- Configuración de Event Listeners del Dashboard ---
    function setupEventListeners() {
        // Navegación de la barra lateral
        document.querySelector(".sidebar-nav").addEventListener("click", (e) => {
            const navItem = e.target.closest(".nav-item");
            if (navItem) {
                e.preventDefault();
                const sectionId = navItem.getAttribute("data-section");
                document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => item.classList.remove("active"));
                navItem.classList.add("active");
                renderSection(sectionId);
            }
        });

        // Botones "Añadir Nuevo" en cada sección
        document.querySelectorAll(".add-new-btn").forEach(button => {
            button.addEventListener("click", () => {
                const sectionId = button.closest(".dashboard-section").id;
                window.openAdminModal(sectionId, null);
            });
        });

        // Listeners para los filtros de contabilidad
        if (transactionSearchInput) transactionSearchInput.addEventListener("input", () => renderAccountingTable());
        if (transactionTypeFilter) transactionTypeFilter.addEventListener("change", () => renderAccountingTable());

        // Botones de login/logout
        if (loginBtn) {
            loginBtn.addEventListener("click", () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(error => console.error("Error de inicio de sesión:", error));
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => auth.signOut());
        }

        // Cierre del modal
        if (closeModalBtn) closeModalBtn.addEventListener("click", closeAdminModal);
        if (modal) modal.addEventListener("click", (e) => {
            if (e.target === modal) closeAdminModal();
        });
    }

    function renderSection(sectionId) {
        document.querySelectorAll(".dashboard-section").forEach(section => section.classList.remove("active"));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add("active");
            mainTitle.textContent = targetSection.querySelector("h2")?.textContent || "Resumen del Administrador";
            // Aseguramos que la tabla o KPIs de la sección activa se rendericen al cambiar de sección
            switch (sectionId) {
                case "summary": updateKPIs(); break;
                case "clients": renderClientsTable(); break;
                case "properties": renderPropertiesTable(); break;
                case "projects": renderProjectsTable(); break;
                case "accounting": renderAccountingTable(); break;
            }
        }
    }

    // ==================================================================
    // 3. EVENT LISTENERS PRINCIPALES Y LÓGICA DE INICIALIZACIÓN
    //    Estos se ejecutan una vez que todas las funciones anteriores
    //    han sido definidas y están disponibles.
    // ==================================================================

    // Manejar el envío del formulario (Guardar)
    modalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

        const formData = new FormData(modalForm);
        const dataToSave = Object.fromEntries(formData.entries());

        // --- MEJORA 1: Conversión de tipos de datos más robusta ---
        const numericFields = ["price", "budget", "amount"];
        numericFields.forEach(field => {
            if (dataToSave[field]) {
                dataToSave[field] = parseFloat(dataToSave[field]);
            }
        });

        const integerFields = ["modules"];
        integerFields.forEach(field => {
            if (dataToSave[field]) {
                dataToSave[field] = parseInt(dataToSave[field], 10);
            }
        });

        // --- MEJORA 2: Manejo consistente de fechas ---
        const dateFields = ["date", "startDate", "endDate"];
        dateFields.forEach(field => {
            if (dataToSave[field]) {
                const date = new Date(dataToSave[field] + "T00:00:00"); // Asegura la interpretación correcta de la fecha
                dataToSave[field] = firebase.firestore.Timestamp.fromDate(date);
            }
        });

        try {
            if (currentItem) {
                // --- MODO EDICIÓN ---
                dataToSave.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(currentCollection).doc(currentItem.id).update(dataToSave);
                showToast("Elemento actualizado con éxito.");
            } else {
                // --- MODO CREACIÓN ---
                dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(currentCollection).add(dataToSave);
                showToast("Nuevo elemento añadido con éxito.");
            }
            
            closeAdminModal(); // Cierra el modal automáticamente tras el éxito

        } catch (error) {
            console.error("Error al guardar datos:", error);
            showToast(`Error al guardar: ${error.message || "Verifica la consola para más detalles."}`, "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = currentItem ? "Guardar Cambios" : "Añadir";
        }
    });

    // Manejar la eliminación de elementos
    deleteBtn.addEventListener("click", () => deleteConfirmation.style.display = "block");
    cancelDeleteBtn.addEventListener("click", () => deleteConfirmation.style.display = "none");
    confirmDeleteBtn.addEventListener("click", async () => {
        if (!currentItem) return;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Eliminando...`;

        try {
            await db.collection(currentCollection).doc(currentItem.id).delete();
            showToast("Elemento eliminado con éxito.");
            closeAdminModal();
        } catch (error) {
            console.error("Error al eliminar:", error);
            showToast(`Error al eliminar: ${error.message || "Verifica la consola para más detalles."}`, "error");
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = "Sí, Eliminar";
        }
    });

    // Listener de autenticación de Firebase (el punto de entrada principal)
    auth.onAuthStateChanged(user => {
        if (user) {
            checkAdminStatus(user);
        } else {
            showView("login");
        }
    });

});

