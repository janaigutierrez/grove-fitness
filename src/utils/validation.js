import { ValidationError } from './errorHandler';

/**
 * Comprehensive form validation utilities
 * Provides consistent validation across all forms
 */

// ============ EMAIL VALIDATION ============
export const validateEmail = (email) => {
  const trimmed = email?.trim();

  if (!trimmed) {
    throw new ValidationError('El email es obligatorio', 'email');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    throw new ValidationError('El formato del email no es válido', 'email');
  }

  return trimmed.toLowerCase();
};

// ============ PASSWORD VALIDATION ============
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireNumber = false,
    requireSpecialChar = false,
    fieldName = 'password'
  } = options;

  if (!password) {
    throw new ValidationError('La contraseña es obligatoria', fieldName);
  }

  if (password.length < minLength) {
    throw new ValidationError(
      `La contraseña debe tener al menos ${minLength} caracteres`,
      fieldName
    );
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    throw new ValidationError(
      'La contraseña debe contener al menos una mayúscula',
      fieldName
    );
  }

  if (requireNumber && !/\d/.test(password)) {
    throw new ValidationError(
      'La contraseña debe contener al menos un número',
      fieldName
    );
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new ValidationError(
      'La contraseña debe contener al menos un carácter especial',
      fieldName
    );
  }

  return password;
};

// ============ PASSWORD CONFIRMATION ============
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    throw new ValidationError('Debes confirmar la contraseña', 'confirmPassword');
  }

  if (password !== confirmPassword) {
    throw new ValidationError('Las contraseñas no coinciden', 'confirmPassword');
  }

  return true;
};

// ============ USERNAME VALIDATION ============
export const validateUsername = (username, options = {}) => {
  const { minLength = 3, maxLength = 30 } = options;
  const trimmed = username?.trim();

  if (!trimmed) {
    throw new ValidationError('El nombre de usuario es obligatorio', 'username');
  }

  if (trimmed.length < minLength) {
    throw new ValidationError(
      `El nombre de usuario debe tener al menos ${minLength} caracteres`,
      'username'
    );
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `El nombre de usuario no puede tener más de ${maxLength} caracteres`,
      'username'
    );
  }

  // Solo permite letras, números, guiones y guiones bajos
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    throw new ValidationError(
      'El nombre de usuario solo puede contener letras, números, guiones (-) y guiones bajos (_)',
      'username'
    );
  }

  return trimmed.toLowerCase();
};

// ============ NAME VALIDATION ============
export const validateName = (name, fieldName = 'name') => {
  const trimmed = name?.trim();

  if (!trimmed) {
    throw new ValidationError('El nombre es obligatorio', fieldName);
  }

  if (trimmed.length < 2) {
    throw new ValidationError('El nombre debe tener al menos 2 caracteres', fieldName);
  }

  return trimmed;
};

// ============ NUMERIC VALIDATION ============
export const validateNumber = (value, options = {}) => {
  const {
    min,
    max,
    fieldName = 'value',
    required = true
  } = options;

  if (!value && value !== 0) {
    if (required) {
      throw new ValidationError(`${fieldName} es obligatorio`, fieldName);
    }
    return null;
  }

  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} debe ser un número válido`, fieldName);
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} debe ser al menos ${min}`, fieldName);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} no puede ser mayor a ${max}`, fieldName);
  }

  return num;
};

// ============ WEIGHT VALIDATION ============
export const validateWeight = (weight) => {
  return validateNumber(weight, {
    min: 0,
    max: 500,
    fieldName: 'peso',
    required: true
  });
};

// ============ REQUIRED FIELD VALIDATION ============
export const validateRequired = (value, fieldName = 'campo') => {
  const trimmed = typeof value === 'string' ? value.trim() : value;

  if (!trimmed && trimmed !== 0) {
    throw new ValidationError(`${fieldName} es obligatorio`, fieldName);
  }

  return trimmed;
};

// ============ ARRAY VALIDATION ============
export const validateArray = (array, options = {}) => {
  const {
    minLength = 1,
    maxLength,
    fieldName = 'lista',
    required = true
  } = options;

  if (!array || !Array.isArray(array)) {
    if (required) {
      throw new ValidationError(`${fieldName} es obligatorio`, fieldName);
    }
    return [];
  }

  if (array.length < minLength) {
    throw new ValidationError(
      `${fieldName} debe tener al menos ${minLength} elemento${minLength > 1 ? 's' : ''}`,
      fieldName
    );
  }

  if (maxLength && array.length > maxLength) {
    throw new ValidationError(
      `${fieldName} no puede tener más de ${maxLength} elementos`,
      fieldName
    );
  }

  return array;
};

// ============ FORM VALIDATION HELPER ============
/**
 * Validates multiple fields and returns first error found
 * @param {Object} validations - Object with field validators
 * @returns {null|ValidationError} - Returns null if all valid, or first error found
 *
 * @example
 * const error = validateForm({
 *   email: () => validateEmail(formData.email),
 *   password: () => validatePassword(formData.password),
 *   username: () => validateUsername(formData.username)
 * });
 *
 * if (error) {
 *   // Show error modal
 *   return;
 * }
 */
export const validateForm = (validations) => {
  for (const [key, validator] of Object.entries(validations)) {
    try {
      validator();
    } catch (error) {
      if (error instanceof ValidationError) {
        return error;
      }
      throw error;
    }
  }
  return null;
};

// ============ EXPORTS ============
export default {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  validateName,
  validateNumber,
  validateWeight,
  validateRequired,
  validateArray,
  validateForm
};
