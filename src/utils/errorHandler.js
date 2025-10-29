import { Alert } from 'react-native';

// Classe d'error personalitzada per API
export class ApiError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'ApiError';
    }
}

// Funció per manejar errors i retornar info formatada
export const handleApiError = (error) => {
    console.error('🔴 Error capturat:', error);

    // Error de xarxa (no hi ha connexió)
    if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        return {
            title: 'Error de connexió',
            message: 'No es pot connectar amb el servidor. Comprova la teva connexió a internet.',
            type: 'network'
        };
    }

    // Error de API amb resposta
    if (error instanceof ApiError) {
        switch (error.statusCode) {
            case 400:
                return {
                    title: 'Dades incorrectes',
                    message: error.message || 'Les dades enviades no són vàlides',
                    type: 'validation'
                };
            case 401:
                return {
                    title: 'Sessió expirada',
                    message: 'La teva sessió ha expirat. Si us plau, torna a iniciar sessió.',
                    type: 'auth'
                };
            case 403:
                return {
                    title: 'Accés denegat',
                    message: 'No tens permís per realitzar aquesta acció',
                    type: 'forbidden'
                };
            case 404:
                return {
                    title: 'No trobat',
                    message: error.message || 'El recurs sol·licitat no existeix',
                    type: 'notfound'
                };
            case 409:
                return {
                    title: 'Conflicte',
                    message: error.message || 'Aquest recurs ja existeix',
                    type: 'conflict'
                };
            case 500:
            default:
                return {
                    title: 'Error del servidor',
                    message: 'Hi ha hagut un error al servidor. Torna-ho a intentar més tard.',
                    type: 'server'
                };
        }
    }

    // Error genèric
    return {
        title: 'Error',
        message: error.message || 'Ha ocorregut un error inesperat',
        type: 'generic'
    };
};

// Hook opcional per usar en components
export const useErrorHandler = () => {
    const showError = (error) => {
        const errorInfo = handleApiError(error);
        Alert.alert(errorInfo.title, errorInfo.message);
        return errorInfo;
    };

    return { showError };
};