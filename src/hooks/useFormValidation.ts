"use client";

import { useCallback, useState, useMemo } from "react";

export interface ValidationRule<T> {
	required?: boolean | string;
	minLength?: number | string;
	maxLength?: number | string;
	pattern?: RegExp | string;
	custom?: (value: T, formData: Record<string, unknown>) => string | undefined;
	message?: string;
}

export interface FieldValidation<T = string> {
	[field: string]: ValidationRule<T> | ValidationRule<T>[];
}

export interface UseFormValidationOptions<T extends Record<string, unknown>> {
	initialValues: T;
	validationRules?: FieldValidation;
	validateOnChange?: boolean;
	validateOnBlur?: boolean;
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
	values: T;
	errors: Record<string, string>;
	touched: Record<string, boolean>;
	isSubmitting: boolean;
	isValid: boolean;
	handleChange: (field: keyof T, value: unknown) => void;
	handleBlur: (field: keyof T) => void;
	validateField: (field: keyof T) => boolean;
	validateForm: () => boolean;
	setFieldValue: (field: keyof T, value: unknown) => void;
	setFieldError: (field: keyof T, error: string) => void;
	clearFieldError: (field: keyof T) => void;
	resetForm: (newValues?: Partial<T>) => void;
	setValues: (values: T | ((prev: T) => T)) => void;
	setErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
	setSubmitting: (isSubmitting: boolean) => void;
}

function getErrorMessage<T>(
	value: T,
	rule: ValidationRule<T>,
	formData: Record<string, unknown>,
	fieldName: string
): string | undefined {
	if (rule.required && (value === undefined || value === null || value === "")) {
		return rule.message || `${fieldName} es requerido`;
	}

	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	const strValue = String(value);

	if (rule.minLength && strValue.length < Number(rule.minLength)) {
		return rule.message || `${fieldName} debe tener al menos ${rule.minLength} caracteres`;
	}

	if (rule.maxLength && strValue.length > Number(rule.maxLength)) {
		return rule.message || `${fieldName} no puede exceder ${rule.maxLength} caracteres`;
	}

	if (rule.pattern) {
		const regex = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
		if (!regex.test(strValue)) {
			return rule.message || `${fieldName} tiene un formato inválido`;
		}
	}

	if (rule.custom) {
		return rule.custom(value, formData);
	}

	return undefined;
}

function validateFieldValue<T>(
	fieldName: string,
	value: T,
	rules: ValidationRule<T> | ValidationRule<T>[],
	formData: Record<string, unknown>
): string | undefined {
	const ruleArray = Array.isArray(rules) ? rules : [rules];

	for (const rule of ruleArray) {
		const error = getErrorMessage(value, rule, formData, fieldName);
		if (error) {
			return error;
		}
	}
	return undefined;
}

export function useFormValidation<T extends Record<string, unknown>>(
	options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
	const {
		initialValues,
		validationRules = {},
		validateOnChange = true,
		validateOnBlur = true,
	} = options;

	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

	const handleChange = useCallback(
		(field: keyof T, value: unknown) => {
			setValues((prev) => ({ ...prev, [field]: value }));

			if (errors[field as string] && validateOnChange) {
				setErrors((prev) => ({ ...prev, [field as string]: "" }));
			}

			if (validateOnChange && validationRules[field as string]) {
				const error = validateFieldValue(
					field as string,
					value as T[keyof T],
					validationRules[field as string],
					values
				);
				if (error) {
					setErrors((prev) => ({ ...prev, [field as string]: error }));
				}
			}
		},
		[errors, validateOnChange, validationRules, values]
	);

	const handleBlur = useCallback(
		(field: keyof T) => {
			setTouched((prev) => ({ ...prev, [field as string]: true }));

			if (validateOnBlur && validationRules[field as string]) {
				const error = validateFieldValue(
					field as string,
					values[field],
					validationRules[field as string],
					values
				);
				if (error) {
					setErrors((prev) => ({ ...prev, [field as string]: error }));
				} else {
					setErrors((prev) => ({ ...prev, [field as string]: "" }));
				}
			}
		},
		[validateOnBlur, validationRules, values]
	);

	const validateField = useCallback(
		(field: keyof T): boolean => {
			if (!validationRules[field as string]) {
				return true;
			}
			const error = validateFieldValue(
				field as string,
				values[field],
				validationRules[field as string],
				values
			);
			if (error) {
				setErrors((prev) => ({ ...prev, [field as string]: error }));
				return false;
			}
			setErrors((prev) => ({ ...prev, [field as string]: "" }));
			return true;
		},
		[validationRules, values]
	);

	const validateForm = useCallback((): boolean => {
		const newErrors: Record<string, string> = {};
		let isValid = true;

		for (const fieldName of Object.keys(validationRules)) {
			const error = validateFieldValue(
				fieldName,
				values[fieldName as keyof T],
				validationRules[fieldName as keyof typeof validationRules],
				values
			);
			if (error) {
				newErrors[fieldName] = error;
				isValid = false;
			}
		}

		setErrors(newErrors);
		setTouched(
			Object.keys(validationRules).reduce(
				(acc, key) => ({ ...acc, [key]: true }),
				{} as Record<string, boolean>
			)
		);

		return isValid;
	}, [validationRules, values]);

	const setFieldValue = useCallback((field: keyof T, value: unknown) => {
		setValues((prev) => ({ ...prev, [field]: value }));
	}, []);

	const setFieldError = useCallback((field: keyof T, error: string) => {
		setErrors((prev) => ({ ...prev, [field as string]: error }));
	}, []);

	const clearFieldError = useCallback((field: keyof T) => {
		setErrors((prev) => ({ ...prev, [field as string]: "" }));
	}, []);

	const resetForm = useCallback((newValues?: Partial<T>) => {
		setValues((prev) => ({ ...prev, ...newValues }));
		setErrors({});
		setTouched({});
	}, []);

	return {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		validateField,
		validateForm,
		setFieldValue,
		setFieldError,
		clearFieldError,
		resetForm,
		setValues,
		setErrors,
		setSubmitting,
	};
}

// Helper to create common validation rules
export const validationRules = {
	required: (message?: string): ValidationRule<string> => ({
		required: true,
		message: message || "Este campo es requerido",
	}),

	email: (message?: string): ValidationRule<string> => ({
		required: true,
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		message: message || "Email inválido",
	}),

	phone: (message?: string, minDigits = 8): ValidationRule<string> => ({
		required: true,
		custom: (value) => {
			const digits = String(value).replace(/\D/g, "");
			if (digits.length < minDigits) {
				return message || `Ingresá un número de teléfono válido (mínimo ${minDigits} dígitos)`;
			}
			return undefined;
		},
	}),

	minLength: (min: number, message?: string): ValidationRule<string> => ({
		minLength: min,
		message: message || `Debe tener al menos ${min} caracteres`,
	}),

	maxLength: (max: number, message?: string): ValidationRule<string> => ({
		maxLength: max,
		message: message || `No puede exceder ${max} caracteres`,
	}),

	pattern: (regex: RegExp, message?: string): ValidationRule<string> => ({
		pattern: regex,
		message: message || "Formato inválido",
	}),

	cbu: (message?: string): ValidationRule<string> => ({
		required: false,
		custom: (value) => {
			const clean = String(value).replace(/\s/g, "");
			if (clean && !/^\d{22}$/.test(clean)) {
				return message || "El CBU/CVU debe tener exactamente 22 dígitos numéricos";
			}
			return undefined;
		},
	}),

	alias: (message?: string): ValidationRule<string> => ({
		required: false,
		custom: (value) => {
			const clean = String(value).trim();
			if (clean && !/^[a-zA-Z0-9.]{6,20}$/.test(clean)) {
				return message || "El alias debe tener entre 6 y 20 caracteres (letras, números y puntos)";
			}
			return undefined;
		},
	}),

	custom: <T>(validator: (value: T, formData: Record<string, unknown>) => string | undefined, message?: string): ValidationRule<T> => ({
		custom: validator,
		message,
	}),
};