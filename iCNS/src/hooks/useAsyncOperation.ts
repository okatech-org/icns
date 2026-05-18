import { useState, useCallback } from "react";

export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    success: boolean;
}

export interface UseAsyncOperationResult<T> {
    state: AsyncState<T>;
    execute: (operation: () => Promise<T>) => Promise<T | null>;
    reset: () => void;
    setData: (data: T | null) => void;
}

/**
 * Custom hook for managing async operations with loading, error, and success states
 * 
 * @example
 * const { state, execute } = useAsyncOperation<PrivateAudience>();
 * 
 * const handleCreate = async () => {
 *   await execute(async () => {
 *     return await privateCabinetService.createAudience(formData);
 *   });
 * };
 */
export function useAsyncOperation<T = any>(): UseAsyncOperationResult<T> {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: false,
        error: null,
        success: false,
    });

    const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
        setState({
            data: null,
            loading: true,
            error: null,
            success: false,
        });

        try {
            const result = await operation();
            setState({
                data: result,
                loading: false,
                error: null,
                success: true,
            });
            return result;
        } catch (error) {
            setState({
                data: null,
                loading: false,
                error: error as Error,
                success: false,
            });
            return null;
        }
    }, []);

    const reset = useCallback(() => {
        setState({
            data: null,
            loading: false,
            error: null,
            success: false,
        });
    }, []);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({
            ...prev,
            data,
        }));
    }, []);

    return { state, execute, reset, setData };
}

/**
 * Hook for form validation
 */
export function useFormValidation<T extends Record<string, any>>(
    validationRules: (data: T) => Record<string, string>
) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback((data: T): boolean => {
        const validationErrors = validationRules(data);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [validationRules]);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    const clearError = useCallback((field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    return {
        errors,
        validate,
        clearErrors,
        clearError,
        hasErrors: Object.keys(errors).length > 0,
    };
}
