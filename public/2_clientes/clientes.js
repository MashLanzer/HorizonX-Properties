// ==================================================================
// CLIENTES.JS - LÓGICA PARA LA PÁGINA DE GESTIÓN DE CLIENTES
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

    // --- ELEMENTOS DEL DOM ---
    const logoutBtn = document.getElementById('logout-btn');
    const userAvatar = document.getElementById('user-avatar');
    const currentDateEl = document.getElementById('current-date');
    const submissionsBody = document.getElementById('submissions-body');
    const searchInput = document.getElementById('search-input');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterBtn = document.getElementById('filter-btn');
    const resetBtn = document.getElementById('reset-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');

    // --- ESTADO DE LA APLICACIÓN ---
    let allSubmissions = [];
    let filteredSubmissions = [];
    let currentPage = 1;
    const ROWS_PER_PAGE = 10;

    // --- LÓGICA DE AUTENTICACIÓN Y ARRANQUE ---
    auth.onAuthStateChanged(user => {
        if (user) {
            initializeClientsPage(user);
        } else {
            window.location.href = 'dashboard.html';
        }
    });

    if(logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

    function initializeClientsPage(user) {
        if(userAvatar) userAvatar.src = user.photoURL || 'default-avatar.png';
        if(currentDateEl) currentDateEl.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        loadAllSubmissions();
        setupEventListeners();
    }

    // --- LÓGICA DE DATOS Y FILTROS ---
    function loadAllSubmissions() {
        db.collection('submissions').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
            allSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // ¡LÍNEA CLAVE! Inicializa la lógica del modal con los datos cargados.
            if (typeof initializeClientModal === 'function') {
                initializeClientModal(db, allSubmissions);
            }
            
            applyFilters();
        }, error => console.error("Error al cargar datos:", error));
    }

    function setupEventListeners() {
        if(filterBtn) filterBtn.addEventListener('click', applyFilters);
        if(resetBtn) resetBtn.addEventListener('click', resetFilters);
        if(searchInput) searchInput.addEventListener('input', () => setTimeout(applyFilters, 300));
        if(exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCSV);
        if(prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if(nextPageBtn) nextPageBtn.addEventListener('click', () => { if ((currentPage * ROWS_PER_PAGE) < filteredSubmissions.length) { currentPage++; renderTable(); } });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        filteredSubmissions = allSubmissions.filter(sub => {
            const subDate = sub.timestamp?.toDate();
            const searchMatch = sub.name?.toLowerCase().includes(searchTerm) || sub.email?.toLowerCase().includes(searchTerm);
            const dateMatch = (!startDate || subDate >= startDate) && (!endDate || subDate <= endDate);
            return searchMatch && dateMatch;
        });
        currentPage = 1;
        renderTable();
    }

    function resetFilters() {
        if(searchInput) searchInput.value = '';
        if(startDateInput) startDateInput.value = '';
        if(endDateInput) endDateInput.value = '';
        applyFilters();
    }

    // --- LÓGICA DE RENDERIZADO ---
    function renderTable() {
        if(!submissionsBody) return;
        submissionsBody.innerHTML = '';
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        const end = start + ROWS_PER_PAGE;
        const paginatedItems = filteredSubmissions.slice(start, end);

        if (paginatedItems.length === 0) {
            submissionsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No se encontraron clientes.</td></tr>';
        } else {
            paginatedItems.forEach(data => {
                const date = data.timestamp ? data.timestamp.toDate().toLocaleString('es-ES') : 'N/A';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${escapeHtml(data.name)}</td>
                    <td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
                    <td class="message-cell">${escapeHtml(data.message || '-')}</td>
                    <td><button class="btn-secondary btn-small view-details-btn">Ver Detalles</button></td>
                `;
                // ¡LÍNEA CLAVE! Llama a la función global del modal.
                row.querySelector('.view-details-btn').addEventListener('click', () => {
                    if (typeof window.openClientModal === 'function') {
                        window.openClientModal(data.id);
                    }
                });
                submissionsBody.appendChild(row);
            });
        }
        updatePaginationControls();
    }

    function updatePaginationControls() {
        if(!pageInfo) return;
        const totalPages = Math.ceil(filteredSubmissions.length / ROWS_PER_PAGE) || 1;
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    // --- UTILIDADES ---
    function escapeHtml(unsafe) {
        return unsafe ? unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : '';
    }

    function exportToCSV() {
        const headers = ['Fecha', 'Nombre', 'Email', 'Teléfono', 'Mensaje', 'Notas'];
        const rows = filteredSubmissions.map(sub => [
            sub.timestamp ? sub.timestamp.toDate().toISOString() : '',
            sub.name,
            sub.email,
            sub.phone || '',
            (sub.message || '').replace(/"/g, '""'),
            (sub.notes || '').replace(/"/g, '""')
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => `"${e.join('","')}"`).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `export_clientes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
