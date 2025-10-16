// ==================================================================
// MODAL.JS - LÓGICA REUTILIZABLE PARA EL MODAL DE DETALLES
// ==================================================================

function initializeClientModal(db, submissions) {
    // Elementos del Modal
    const modal = document.getElementById('client-detail-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalClientName = document.getElementById('modal-client-name');
    const modalClientEmail = document.getElementById('modal-client-email');
    const modalClientPhone = document.getElementById('modal-client-phone'); // Nuevo
    const modalClientDate = document.getElementById('modal-client-date');
    const modalClientMessage = document.getElementById('modal-client-message');
    const modalClientNotes = document.getElementById('modal-client-notes');
    const saveNotesBtn = document.getElementById('save-notes-btn');

    let currentClientId = null;

    if (!modal) return; // Si no hay modal en la página, no hacer nada

    // Función para abrir el modal con los datos del cliente
    window.openClientModal = (clientId) => {
        const clientData = submissions.find(sub => sub.id === clientId);
        if (!clientData) return;

        currentClientId = clientId;
        modalClientName.textContent = clientData.name || 'N/A';
        modalClientEmail.textContent = clientData.email || 'N/A';
        modalClientPhone.textContent = clientData.phone || 'No proporcionado'; // Nuevo
        modalClientDate.textContent = clientData.timestamp ? clientData.timestamp.toDate().toLocaleString('es-ES') : 'N/A';
        modalClientMessage.textContent = clientData.message || 'Sin mensaje.';
        modalClientNotes.value = clientData.notes || '';

        modal.classList.add('visible');
    };

    // Función para cerrar el modal
    const closeClientModal = () => {
        modal.classList.remove('visible');
        currentClientId = null;
    };

    // Función para guardar las notas
    async function saveClientNotes() {
        if (!currentClientId) return;
        
        saveNotesBtn.textContent = 'Guardando...';
        saveNotesBtn.disabled = true;

        try {
            await db.collection('submissions').doc(currentClientId).update({
                notes: modalClientNotes.value
            });
            // Actualiza los datos locales para que no sea necesario recargar
            const subToUpdate = submissions.find(s => s.id === currentClientId);
            if (subToUpdate) subToUpdate.notes = modalClientNotes.value;
        } catch (error) {
            console.error("Error al guardar las notas:", error);
            alert("No se pudieron guardar las notas.");
        } finally {
            saveNotesBtn.textContent = 'Guardar Notas';
            saveNotesBtn.disabled = false;
            closeClientModal();
        }
    }

    // Asigna los eventos del modal
    closeModalBtn.addEventListener('click', closeClientModal);
    saveNotesBtn.addEventListener('click', saveClientNotes);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeClientModal();
    });
}
