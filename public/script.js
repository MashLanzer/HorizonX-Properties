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

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function() {

    // --- 1. SISTEMA GLOBAL DE ANIMACIÓN DE ENTRADA (SCROLL REVEAL) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Deja de observar una vez animado
            }
        });
    }, {
        threshold: 0.1 // Se activa cuando el 10% del elemento es visible
    });

    // Pone a observar todos los elementos con la clase .animate-on-scroll
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });

    // --- 2. SMOOTH SCROLLING PARA ENLACES DE NAVEGACIÓN ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            // Previene el salto brusco
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });

 // --- 3. MANEJO DEL FORMULARIO DE CONTACTO (FORMASPREE + FIREBASE) ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const formStatus = document.getElementById('form-status');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.button-text');

        async function handleSubmit(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());

            buttonText.textContent = 'Enviando...';
            submitButton.disabled = true;
            submitButton.classList.add('sending');

            try {
                // Promesa 1: Enviar a Formspree para recibir el email
                const formspreePromise = fetch(event.target.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                // Promesa 2: Guardar en Firebase Firestore
                const firestorePromise = db.collection("submissions").add({
                    name: data.Nombre,
                    email: data.Email,
                    message: data.Mensaje,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Esperar a que ambas promesas se completen
                const [formspreeResult] = await Promise.all([formspreePromise, firestorePromise]);

                if (formspreeResult.ok) {
                    formStatus.innerHTML = '<div class="form-message success"><i class="fas fa-check-circle"></i> ¡Mensaje enviado con éxito!</div>';
                    contactForm.reset();
                } else {
                    throw new Error('Hubo un problema con el envío a Formspree.');
                }
            } catch (error) {
                console.error("Error en el envío:", error);
                formStatus.innerHTML = `<div class="form-message error"><i class="fas fa-times-circle"></i> Oops! Hubo un problema.</div>`;
            } finally {
                setTimeout(() => {
                    buttonText.textContent = 'Enviar Mensaje';
                    submitButton.disabled = false;
                    submitButton.classList.remove('sending');
                }, 1500);
            }
        }
        contactForm.addEventListener("submit", handleSubmit);

        // Efecto de onda en el botón de envío
        submitButton.addEventListener("click", function(event) {
            const button = event.currentTarget;
            const oldRipple = button.getElementsByClassName("ripple")[0];
            if (oldRipple) { oldRipple.remove(); }
            
            const circle = document.createElement("span");
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - button.getBoundingClientRect().left - (diameter / 2)}px`;
            circle.style.top = `${event.clientY - button.getBoundingClientRect().top - (diameter / 2)}px`;
            circle.classList.add("ripple");
            button.appendChild(circle);
        });
    }

    // --- 4. EFECTO DE BRILLO DINÁMICO PARA TARJETAS "FEATURES" ---
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // --- 5. INTERACCIÓN 3D PARA TARJETAS "MODELS" ---
    document.querySelectorAll('.model-card').forEach(card => {
        const maxRotate = 15;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateY = maxRotate * ((x - width / 2) / (width / 2));
            const rotateX = -maxRotate * ((y - height / 2) / (height / 2));
            card.style.transform = `translateY(-5px) scale(1.03) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1) rotateX(0) rotateY(0)';
        });
    });

    // --- 6. CONFIGURACIÓN DE PARTICLES.JS (SI EXISTE) ---
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
                "move": { "enable": true, "speed": 2, "direction": "none", "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }
    
// --- 7. FUSIÓN FINAL: INCLINACIÓN 3D Y BORDE DE NEÓN PARA EL PANEL DE CONTACTO ---
const contactPanel = document.querySelector('.contact-panel-3d');
if (contactPanel) {
    contactPanel.addEventListener('mousemove', (e) => {
        const rect = contactPanel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { width, height } = rect;

        // 1. Calcula la rotación 3D
        const rotateY = 15 * ((x - width / 2) / (width / 2));
        const rotateX = -15 * ((y - height / 2) / (height / 2));

        // 2. Aplica la transformación 3D
        contactPanel.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // 3. Pasa la posición del ratón al CSS para el borde de neón
        contactPanel.style.setProperty('--mouse-x', `${x}px`);
        contactPanel.style.setProperty('--mouse-y', `${y}px`);
    });

    contactPanel.addEventListener('mouseleave', () => {
        // El CSS se encargará de la transición suave de regreso
        contactPanel.style.transform = 'perspective(1500px) rotateX(0) rotateY(0)';
    });
}


});

// --- 8. LÓGICA MEJORADA PARA BARRA FLOTANTE DE CTA (CON OCULTACIÓN AL FINAL) ---
const ctaBar = document.getElementById('floating-cta-bar');
const closeCtaBarBtn = document.getElementById('close-cta-bar');
const footer = document.querySelector('.footer'); // Obtenemos la sección del footer

if (ctaBar && closeCtaBarBtn && footer) {
    let isCtaVisible = false; // Para controlar el estado actual

    // Función principal que se ejecuta en cada scroll
    const handleCtaVisibility = () => {
        // No hacer nada si el usuario ya cerró la barra manualmente
        if (sessionStorage.getItem('ctaBarClosed')) {
            window.removeEventListener('scroll', handleCtaVisibility); // Optimización: deja de escuchar
            return;
        }

        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const footerPosition = footer.offsetTop;

        // Condición para OCULTAR la barra:
        // Si la parte inferior de la ventana está cerca o ha pasado el inicio del footer.
        const shouldHide = (scrollPosition + windowHeight) >= footerPosition;

        // Condición para MOSTRAR la barra:
        // Si hemos bajado más de 500px Y no estamos en la zona de ocultación.
        const shouldShow = scrollPosition > 500 && !shouldHide;

        // Aplicar los cambios solo si el estado ha cambiado, para evitar manipulaciones innecesarias del DOM
        if (shouldShow && !isCtaVisible) {
            ctaBar.classList.add('visible');
            isCtaVisible = true;
        } else if (!shouldShow && isCtaVisible) {
            ctaBar.classList.remove('visible');
            isCtaVisible = false;
        }
    };

    // Función para el botón de cerrar
    const closeCtaBar = () => {
        ctaBar.classList.remove('visible');
        sessionStorage.setItem('ctaBarClosed', 'true');
        // Una vez cerrada, ya no necesitamos escuchar el evento de scroll
        window.removeEventListener('scroll', handleCtaVisibility);
    };

    // Asigna los eventos
    window.addEventListener('scroll', handleCtaVisibility);
    closeCtaBarBtn.addEventListener('click', closeCtaBar);
}
