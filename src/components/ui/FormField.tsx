"use client";

import { Input } from "./Input";
import { Select } from "./Select";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "tel" | "select" | "number";
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  options?: { value: string; label: string }[];
  helperText?: string;
  autoComplete?: string;
  className?: string;
}

export const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  disabled,
  required,
  options,
  helperText,
  autoComplete,
  className,
}: FormFieldProps) => {
  if (type === "select" && options) {
    return (
      <Select
        label={`${label}${required ? " *" : ""}`}
        options={options}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <Input
      id={name}
      name={name}
      type={type}
      label={`${label}${required ? " *" : ""}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      error={error}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      helperText={helperText}
      autoComplete={autoComplete}
      className={className}
    />
  );
};
