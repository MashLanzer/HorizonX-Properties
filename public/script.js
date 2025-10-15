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

