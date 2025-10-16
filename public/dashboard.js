// --- CONFIGURACIÓN INICIAL ---
const firebaseConfig = {
  apiKey: "AIzaSyBTRlG4bk_SplbYYyk2l3dgiea0E4UWSKc",
  authDomain: "horizonx-properties.firebaseapp.com",
  projectId: "horizonx-properties",
  storageBucket: "horizonx-properties.firebasestorage.app",
  messagingSenderId: "401246020029",
  appId: "1:401246020029:web:c053032e10bbe6e6bbf2d4",
  measurementId: "G-12PDYXDFM7"
};

firebase.initializeApp(firebaseConfig );
const auth = firebase.auth();
const db = firebase.firestore();
const remoteConfig = firebase.remoteConfig();

// --- ELEMENTOS DEL DOM ---
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const submissionsBody = document.getElementById('submissions-body');

// KPIs
const totalSubmissionsEl = document.getElementById('total-submissions');
const weeklySubmissionsEl = document.getElementById('weekly-submissions');
const monthlySubmissionsEl = document.getElementById('monthly-submissions');

// Controles
const searchInput = document.getElementById('search-input');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const filterBtn = document.getElementById('filter-btn');
const resetBtn = document.getElementById('reset-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Paginación
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfo = document.getElementById('page-info');

// --- ESTADO DE LA APLICACIÓN ---
let allSubmissions = [];
let filteredSubmissions = [];
let currentPage = 1;
const ROWS_PER_PAGE = 10;

// --- LÓGICA DE AUTENTICACIÓN Y ARRANQUE ---
remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
remoteConfig.defaultConfig = { 'admin_emails': '{"emails":[]}' };

auth.onAuthStateChanged(user => {
    if (user) {
        checkAdminStatus(user);
    } else {
        showView('login');
    }
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Error de inicio de sesión:", error);
        alert("No se pudo iniciar sesión.");
    });
});

logoutBtn.addEventListener('click', () => auth.signOut());

// --- LÓGICA DE DATOS Y FILTROS ---
async function checkAdminStatus(user) {
    try {
        await remoteConfig.fetchAndActivate();
        const adminEmailsConfig = remoteConfig.getString('admin_emails');
        const adminEmails = JSON.parse(adminEmailsConfig).emails;

        if (adminEmails.includes(user.email)) {
            showView('dashboard');
            initializeDashboard();
        } else {
            alert("Acceso denegado. Esta cuenta no tiene permisos.");
            auth.signOut();
        }
    } catch (error) {
        console.error("Error al verificar permisos:", error);
        alert("No se pudo verificar los permisos.");
        auth.signOut();
    }
}

function initializeDashboard() {
    loadAllSubmissions();
    setupEventListeners();
}

function loadAllSubmissions() {
    db.collection('submissions').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        allSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateKPIs();
        applyFilters();
    }, error => {
        console.error("Error al cargar datos:", error);
        alert("No se pudieron cargar los datos de los clientes.");
    });
}

function setupEventListeners() {
    filterBtn.addEventListener('click', applyFilters);
    resetBtn.addEventListener('click', resetFilters);
    searchInput.addEventListener('input', () => setTimeout(applyFilters, 300)); // Búsqueda en tiempo real con debounce
    exportCsvBtn.addEventListener('click', exportToCSV);
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if ((currentPage * ROWS_PER_PAGE) < filteredSubmissions.length) {
            currentPage++;
            renderTable();
        }
    });
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

    if(startDate) startDate.setHours(0, 0, 0, 0);
    if(endDate) endDate.setHours(23, 59, 59, 999);

    filteredSubmissions = allSubmissions.filter(sub => {
        const subDate = sub.timestamp?.toDate();
        const nameMatch = sub.name?.toLowerCase().includes(searchTerm);
        const emailMatch = sub.email?.toLowerCase().includes(searchTerm);
        const dateMatch = (!startDate || subDate >= startDate) && (!endDate || subDate <= endDate);
        
        return (nameMatch || emailMatch) && dateMatch;
    });

    currentPage = 1;
    renderTable();
}

function resetFilters() {
    searchInput.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
    applyFilters();
}

// --- LÓGICA DE RENDERIZADO ---
function renderTable() {
    submissionsBody.innerHTML = '';
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedItems = filteredSubmissions.slice(start, end);

    if (paginatedItems.length === 0) {
        submissionsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron resultados.</td></tr>';
    } else {
        paginatedItems.forEach(data => {
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString('es-ES') : 'N/A';
            const row = `
                <tr>
                    <td>${date}</td>
                    <td>${escapeHtml(data.name)}</td>
                    <td>${escapeHtml(data.email)}</td>
                    <td>${escapeHtml(data.phone || '-')}</td>
                    <td>${escapeHtml(data.service)}</td>
                    <td class="message-cell">${escapeHtml(data.message || '-')}</td>
                </tr>
            `;
            submissionsBody.innerHTML += row;
        });
    }
    updatePaginationControls();
}

function updateKPIs() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyCount = allSubmissions.filter(s => s.timestamp?.toDate() >= oneWeekAgo).length;
    const monthlyCount = allSubmissions.filter(s => s.timestamp?.toDate() >= startOfMonth).length;

    totalSubmissionsEl.textContent = allSubmissions.length;
    weeklySubmissionsEl.textContent = weeklyCount;
    monthlySubmissionsEl.textContent = monthlyCount;
}

function updatePaginationControls() {
    pageInfo.textContent = `Página ${currentPage}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = (currentPage * ROWS_PER_PAGE) >= filteredSubmissions.length;
}

function showView(viewName) {
    loginView.style.display = viewName === 'login' ? 'block' : 'none';
    dashboardView.style.display = viewName === 'dashboard' ? 'block' : 'none';
}

// --- UTILIDADES ---
function escapeHtml(unsafe) {
    return unsafe ? unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : '';
}

function exportToCSV() {
    const headers = ['Fecha', 'Nombre', 'Email', 'Teléfono', 'Servicio', 'Mensaje'];
    const rows = filteredSubmissions.map(sub => [
        sub.timestamp ? sub.timestamp.toDate().toLocaleString('es-ES') : 'N/A',
        sub.name,
        sub.email,
        sub.phone || '',
        sub.service,
        (sub.message || '').replace(/"/g, '""') // Escapar comillas dobles
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => `"${e.join('","')}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_ares_credit_capital.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
