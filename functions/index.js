const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function para AÑADIR un administrador
exports.addAdminEmail = functions.https.onCall(async (data, context ) => {
    // 1. Verifica que el usuario que llama está autenticado
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado para realizar esta acción." );
    }

    const newEmail = data.email.toLowerCase();
    const callerEmail = context.auth.token.email;

    try {
        // 2. Obtiene la plantilla actual de Remote Config
        const template = await admin.remoteConfig().getTemplate();
        const adminEmailsParam = template.parameters.admin_emails;
        const currentConfig = JSON.parse(adminEmailsParam.defaultValue.value);
        const currentEmails = currentConfig.emails || [];

        // 3. Verifica si el que llama es un administrador
        if (!currentEmails.includes(callerEmail)) {
            throw new functions.https.HttpsError("permission-denied", "No tienes permisos para añadir administradores." );
        }

        // 4. Verifica que el nuevo email no exista ya
        if (currentEmails.includes(newEmail)) {
            throw new functions.https.HttpsError("already-exists", "Este correo ya es un administrador." );
        }

        // 5. Añade el nuevo email y actualiza la plantilla
        currentEmails.push(newEmail);
        currentConfig.emails = currentEmails;
        adminEmailsParam.defaultValue.value = JSON.stringify(currentConfig);

        // 6. Publica la nueva plantilla
        await admin.remoteConfig().publishTemplate(template);

        return { success: true, message: `¡Éxito! ${newEmail} ha sido añadido como administrador.` };

    } catch (error) {
        console.error("Error en addAdminEmail:", error);
        throw new functions.https.HttpsError("internal", error.message );
    }
});

// Cloud Function para ELIMINAR un administrador
exports.removeAdminEmail = functions.https.onCall(async (data, context ) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado." );
    }

    const emailToRemove = data.email.toLowerCase();
    const callerEmail = context.auth.token.email;

    try {
        const template = await admin.remoteConfig().getTemplate();
        const adminEmailsParam = template.parameters.admin_emails;
        const currentConfig = JSON.parse(adminEmailsParam.defaultValue.value);
        let currentEmails = currentConfig.emails || [];

        if (!currentEmails.includes(callerEmail)) {
            throw new functions.https.HttpsError("permission-denied", "No tienes permisos para eliminar administradores." );
        }

        if (emailToRemove === callerEmail && currentEmails.length === 1) {
            throw new functions.https.HttpsError("invalid-argument", "No puedes eliminarte a ti mismo si eres el único administrador." );
        }

        const updatedEmails = currentEmails.filter(email => email !== emailToRemove);
        currentConfig.emails = updatedEmails;
        adminEmailsParam.defaultValue.value = JSON.stringify(currentConfig);

        await admin.remoteConfig().publishTemplate(template);

        return { success: true, message: `¡Éxito! ${emailToRemove} ha sido eliminado.` };

    } catch (error) {
        console.error("Error en removeAdminEmail:", error);
        throw new functions.https.HttpsError("internal", error.message );
    }
});
