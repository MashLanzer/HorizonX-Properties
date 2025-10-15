document.addEventListener("DOMContentLoaded", function() {
    const contactForm = document.getElementById("contactForm");
    const formMessage = document.getElementById("form-message");

    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevenir el envío por defecto del formulario

            // Aquí podrías añadir lógica para enviar los datos a un servidor
            // Por ahora, solo mostraremos un mensaje de éxito

            formMessage.classList.remove("hidden");
            contactForm.reset(); // Limpiar el formulario

            setTimeout(() => {
                formMessage.classList.add("hidden");
            }, 5000); // Ocultar el mensaje después de 5 segundos
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll("a[href^=\"#\"]").forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute("href")).scrollIntoView({
                behavior: "smooth"
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // --- MANEJO DEL FORMULARIO DE CONTACTO CON AJAX ---
    const form = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.button-text');

    async function handleSubmit(event) {
        event.preventDefault(); // Previene la recarga de la página
        const data = new FormData(event.target);

        // Cambia el estado del botón a "Enviando..."
        buttonText.textContent = 'Enviando...';
        submitButton.disabled = true;
        submitButton.classList.add('sending');

        try {
            const response = await fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Éxito en el envío
                formStatus.innerHTML = '<div class="form-message success"><i class="fas fa-check-circle"></i> ¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.</div>';
                form.reset(); // Limpia el formulario
            } else {
                // Error en el servidor de Formspree
                const responseData = await response.json();
                if (Object.hasOwn(responseData, 'errors')) {
                    const errorMessages = responseData.errors.map(error => error.message).join(', ');
                    throw new Error(errorMessages);
                } else {
                    throw new Error('Oops! Hubo un problema al enviar tu mensaje.');
                }
            }
        } catch (error) {
            // Error de red o del servidor
            formStatus.innerHTML = `<div class="form-message error"><i class="fas fa-times-circle"></i> ${error.message}</div>`;
        } finally {
            // Restaura el botón a su estado original
            buttonText.textContent = 'Enviar Mensaje';
            submitButton.disabled = false;
            submitButton.classList.remove('sending');
        }
    }

    form.addEventListener("submit", handleSubmit);

    // --- SMOOTH SCROLLING (lo mantenemos) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});


// --- EFECTO DE BRILLO DINÁMICO PARA TARJETAS ---
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});


// --- INTERACCIÓN 3D PARA TARJETAS DE MODELOS ---
document.querySelectorAll('.model-card').forEach(card => {
    const maxRotate = 15; // Grados máximos de rotación

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { width, height } = rect;

        // Calcular la rotación en los ejes X e Y
        const rotateY = maxRotate * ((x - width / 2) / (width / 2));
        const rotateX = -maxRotate * ((y - height / 2) / (height / 2));

        // Aplicar la transformación 3D y las variables para el brillo
        card.style.transform = `translateY(-5px) scale(1.03) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
        // Resetear la transformación al estado original
        card.style.transform = 'translateY(0) scale(1) rotateX(0) rotateY(0)';
    });
});


document.addEventListener("DOMContentLoaded", function() {
    // --- MANEJO DEL FORMULARIO DE CONTACTO CON AJAX ---
    const form = document.getElementById('contactForm');
    if (form) {
        const formStatus = document.getElementById('form-status');
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.button-text');

        async function handleSubmit(event) {
            event.preventDefault();
            const data = new FormData(event.target);
            
            buttonText.textContent = 'Enviando...';
            submitButton.disabled = true;
            submitButton.classList.add('sending');

            try {
                const response = await fetch(event.target.action, {
                    method: form.method, body: data, headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    formStatus.innerHTML = '<div class="form-message success"><i class="fas fa-check-circle"></i> ¡Mensaje enviado con éxito!</div>';
                    form.reset();
                } else {
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
                setTimeout(() => { // Pequeño retraso para que la animación de éxito/error se vea
                    buttonText.textContent = 'Enviar Mensaje';
                    submitButton.disabled = false;
                    submitButton.classList.remove('sending');
                }, 1000);
            }
        }
        form.addEventListener("submit", handleSubmit);

        // --- EFECTO ONDA EXPANSIVA EN BOTÓN ---
        submitButton.addEventListener("click", function(event) {
            const button = event.currentTarget;
            // Eliminar ondas previas
            const oldRipple = button.getElementsByClassName("ripple")[0];
            if (oldRipple) { oldRipple.remove(); }
            
            // Crear nueva onda
            const circle = document.createElement("span");
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            const radius = diameter / 2;
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
            circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
            circle.classList.add("ripple");
            button.appendChild(circle);
        });
    }

    // --- ANIMACIÓN DE ENTRADA AL HACER SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    const contactSection = document.querySelector('.contact-section');
    if (contactSection) { observer.observe(contactSection); }

    // --- SMOOTH SCROLLING ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
    });
});


// --- SISTEMA GLOBAL DE ANIMACIÓN DE ENTRADA AL HACER SCROLL ---
document.addEventListener("DOMContentLoaded", function() {
    // 1. Crear el observador
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Opcional: deja de observar el elemento una vez animado
            }
        });
    }, {
        threshold: 0.1 // La animación se activa cuando el 10% del elemento es visible
    });

    // 2. Seleccionar todos los elementos que quieres animar
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');

    // 3. Poner el observador a vigilar cada elemento
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
});
