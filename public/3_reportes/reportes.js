document.addEventListener("DOMContentLoaded", function() {
    // --- CONFIGURACIÓN DE FIREBASE (Reutilizada) ---
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

    // --- LÓGICA DE AUTENTICACIÓN Y ARRANQUE ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // Si el usuario está logueado, inicializamos la página
            initializeReportsPage(user);
        } else {
            // Si no, lo redirigimos a la página de login (dashboard.html)
            window.location.href = 'dashboard.html';
        }
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }

    function initializeReportsPage(user) {
        if(userAvatar) userAvatar.src = user.photoURL || 'default-avatar.png';
        if(currentDateEl) currentDateEl.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        loadSubmissionsAndCreateCharts();
    }

    // --- LÓGICA PARA CREAR GRÁFICOS ---
    async function loadSubmissionsAndCreateCharts() {
        try {
            const snapshot = await db.collection('submissions').orderBy('timestamp', 'desc').get();
            const submissions = snapshot.docs.map(doc => doc.data());

            createMonthlyChart(submissions);
            createServicesChart(submissions);

        } catch (error) {
            console.error("Error al cargar datos para los gráficos:", error);
            alert("No se pudieron generar los reportes.");
        }
    }

    function createMonthlyChart(submissions) {
        const ctx = document.getElementById('monthlySubmissionsChart').getContext('2d');
        
        // Agrupamos los envíos por mes
        const monthlyCounts = submissions.reduce((acc, sub) => {
            if (sub.timestamp) {
                const month = sub.timestamp.toDate().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                acc[month] = (acc[month] || 0) + 1;
            }
            return acc;
        }, {});

        const labels = Object.keys(monthlyCounts).reverse(); // Meses en orden cronológico
        const data = Object.values(monthlyCounts).reverse();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nº de Consultas',
                    data: data,
                    backgroundColor: 'rgba(37, 99, 235, 0.6)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    function createServicesChart(submissions) {
        const ctx = document.getElementById('servicesDistributionChart').getContext('2d');

        // Agrupamos por servicio (asumiendo que tienes un campo 'service' en tus datos)
        const serviceCounts = submissions.reduce((acc, sub) => {
            const service = sub.service || 'No especificado'; // Usamos un valor por defecto
            acc[service] = (acc[service] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(serviceCounts);
        const data = Object.values(serviceCounts);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Distribución de Servicios',
                    data: data,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.7)',
                        'rgba(147, 51, 234, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
});
