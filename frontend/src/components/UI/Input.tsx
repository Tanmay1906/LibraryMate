
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', icon, leftIcon, helperText, ...props }) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-blue-900 mb-1">{label}</label>}
        <div className="relative">
          {(icon || leftIcon) && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {icon || leftIcon}
            </div>
          )}
          <input
            className={`bg-white/80 border border-slate-300 rounded-xl px-4 py-2 shadow focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all duration-200 ${
              (icon || leftIcon) ? 'pl-10' : ''
            } ${error ? 'border-red-500' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-sm text-red-600">{error}</span>}
        {helperText && !error && <span className="text-sm text-slate-500">{helperText}</span>}
      </div>
    );
};

export default Input;