// Custom API Error class
export class ApiError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'ApiError';
    }
}

// Validation Error class
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}

// Centralized error handler - returns formatted error info
export const handleApiError = (error) => {
    console.error('🔴 Error captured:', error);

    // Network error (no connection)
    if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        return {
            title: 'Error de conexión',
            message: 'No se puede conectar con el servidor. Comprueba tu conexión a internet.',
            type: 'network',
            icon: 'cloud-offline'
        };
    }

    // API error with response
    if (error instanceof ApiError) {
        switch (error.statusCode) {
            case 400:
                return {
                    title: 'Datos incorrectos',
                    message: error.message || 'Los datos enviados no son válidos',
                    type: 'validation',
                    icon: 'alert-circle'
                };
            case 401:
                return {
                    title: 'Sesión expirada',
                    message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    type: 'auth',
                    icon: 'lock-closed'
                };
            case 403:
                return {
                    title: 'Acceso denegado',
                    message: 'No tienes permiso para realizar esta acción',
                    type: 'forbidden',
                    icon: 'ban'
                };
            case 404:
                return {
                    title: 'No encontrado',
                    message: error.message || 'El recurso solicitado no existe',
                    type: 'notfound',
                    icon: 'search'
                };
            case 409:
                return {
                    title: 'Conflicto',
                    message: error.message || 'Este recurso ya existe',
                    type: 'conflict',
                    icon: 'alert-circle'
                };
            case 500:
            default:
                return {
                    title: 'Error del servidor',
                    message: 'Ha habido un error en el servidor. Inténtalo más tarde.',
                    type: 'server',
                    icon: 'server'
                };
        }
    }

    // Validation error
    if (error instanceof ValidationError) {
        return {
            title: 'Error de validación',
            message: error.message,
            type: 'validation',
            field: error.field,
            icon: 'alert-circle'
        };
    }

    // Generic error
    return {
        title: 'Error',
        message: error.message || 'Ha ocurrido un error inesperado',
        type: 'generic',
        icon: 'close-circle'
    };
};

// Success message formatter
export const formatSuccessMessage = (message, type = 'success') => {
    const config = {
        success: {
            title: 'Éxito',
            icon: 'checkmark-circle',
        },
        info: {
            title: 'Información',
            icon: 'information-circle',
        },
        warning: {
            title: 'Aviso',
            icon: 'alert-circle',
        },
    };

    return {
        title: config[type]?.title || 'Éxito',
        message,
        icon: config[type]?.icon || 'checkmark-circle',
    };
};