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

    // --- 3. MANEJO DEL FORMULARIO DE CONTACTO CON AJAX ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const formStatus = document.getElementById('form-status');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.button-text');

        async function handleSubmit(event) {
            event.preventDefault();
            const data = new FormData(event.target);
            
            buttonText.textContent = 'Enviando...';
            submitButton.disabled = true;
            submitButton.classList.add('sending');

            try {
                const response = await fetch(event.target.action, {
                    method: contactForm.method,
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    formStatus.innerHTML = '<div class="form-message success"><i class="fas fa-check-circle"></i> ¡Mensaje enviado con éxito!</div>';
                    contactForm.reset();
                } else {
                    // Manejo de errores de Formspree
                    const responseData = await response.json();
                    if (Object.hasOwn(responseData, 'errors')) {
                        throw new Error(responseData.errors.map(e => e.message).join(', '));
                    } else {
                        throw new Error('Oops! Hubo un problema al enviar tu mensaje.');
                    }
                }
            } catch (error) {
                formStatus.innerHTML = `<div class="form-message error"><i class="fas fa-times-circle"></i> ${error.message}</div>`;
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
