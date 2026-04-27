import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

    // Tokeny brand z globals.css: --color-primary (#E60000), --color-primary-dark (#8B0000)
    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
      secondary:
        "bg-surface text-foreground border border-border hover:bg-background focus:ring-primary",
      outline:
        "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus:ring-primary",
      ghost:
        "text-foreground hover:bg-background focus:ring-primary",
      danger:
        "bg-primary-dark text-white hover:bg-primary focus:ring-primary",
      // "View Details" — tekstowy link z czerwonym podkreśleniem (style guide)
      link:
        "text-primary underline underline-offset-4 hover:text-primary-dark focus:ring-primary px-0 py-0 rounded-none",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    // Wariant link nie powinien mieć paddingu z `sizes` — używamy go tylko do skali tekstu
    const linkSizeOverride: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          variant === "link" ? linkSizeOverride[size] : sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Ładowanie...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
