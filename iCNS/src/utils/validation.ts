/**
 * Validation utilities for Private Cabinet forms
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (accepts international formats)
const PHONE_REGEX = /^[\d\s\+\-\(\)]+$/;

export const validationUtils = {
    /**
     * Check if a string is empty or whitespace only
     */
    isEmpty(value: string | null | undefined): boolean {
        return !value || value.trim().length === 0;
    },

    /**
     * Check if email is valid
     */
    isValidEmail(email: string): boolean {
        return EMAIL_REGEX.test(email);
    },

    /**
     * Check if phone is valid
     */
    isValidPhone(phone: string): boolean {
        return PHONE_REGEX.test(phone);
    },

    /**
     * Check if date is in the future
     */
    isFutureDate(dateString: string): boolean {
        const date = new Date(dateString);
        return date > new Date();
    },

    /**
     * Check if end date is after start date
     */
    isValidDateRange(startDate: string, endDate: string): boolean {
        return new Date(endDate) >= new Date(startDate);
    },

    /**
     * Check if string meets minimum length
     */
    meetsMinLength(value: string, minLength: number): boolean {
        return value.trim().length >= minLength;
    },

    /**
     * Check if file size is within limit (bytes)
     */
    isValidFileSize(file: File | null, maxSizeBytes: number): boolean {
        if (!file) return true;
        return file.size <= maxSizeBytes;
    },
};

/**
 * Common error messages
 */
export const errorMessages = {
    required: (fieldName: string) => `${fieldName} est requis`,
    invalidEmail: "Adresse email invalide",
    invalidPhone: "Numéro de téléphone invalide",
    pastDate: "La date doit être dans le futur",
    invalidDateRange: "La date de fin doit être après la date de début",
    minLength: (fieldName: string, minLength: number) =>
        `${fieldName} doit contenir au moins ${minLength} caractères`,
    maxFileSize: (maxSizeMB: number) =>
        `La taille du fichier ne doit pas dépasser ${maxSizeMB} Mo`,
};
