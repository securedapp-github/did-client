/* Path :- did-client-frontend/src/components/Button.jsx */

// why :-  Reusable button component.

import React from "react";

const Button = ({ children, onClick, className = "", type = "button", disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md
                  bg-blue-600 text-white hover:bg-blue-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;