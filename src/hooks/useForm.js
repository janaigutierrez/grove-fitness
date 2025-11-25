import { useState, useCallback } from 'react';

/**
 * Hook for form state management
 *
 * Usage:
 * const { values, errors, handleChange, handleSubmit, reset } = useForm({
 *   initialValues: { name: '', email: '' },
 *   validate: (values) => ({ email: !values.email ? 'Required' : null }),
 *   onSubmit: (values) => console.log(values)
 * });
 */
export default function useForm({ initialValues = {}, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    if (!validate) return true;

    const validationErrors = validate(values);
    const hasErrors = Object.values(validationErrors).some(error => error !== null);

    if (hasErrors) {
      setErrors(validationErrors);
      return false;
    }

    return true;
  }, [validate, values]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      await onSubmit(values);
    } catch (error) {
      // Handle submission error
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, values, validateForm]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setFieldError,
    setValues,
  };
}
