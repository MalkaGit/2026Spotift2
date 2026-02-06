import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input className="input" {...props} />
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
