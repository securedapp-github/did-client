/* Path :- did-client-frontend/src/components/FormInput.jsx */

// why :-  Reusable form input component.

import React from "react";

const FormInput = ({
  type = "text",
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error = "",
  helpText = "",
  className = "",
  ...props
}) => {
  const inputId = id || name || undefined;
  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border rounded-md bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#14B87D] focus:border-[#14B87D]
                    ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default FormInput;
