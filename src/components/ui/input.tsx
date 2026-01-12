import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            'input',
                            leftIcon && 'pl-11',
                            (rightIcon || isPassword) && 'pr-11',
                            error && 'border-accent-300 focus:ring-accent-300',
                            className
                        )}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    )}
                    {rightIcon && !isPassword && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-accent-300">{error}</p>
                )}
                {hint && !error && (
                    <p className="mt-1.5 text-sm text-dark-500">{hint}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
