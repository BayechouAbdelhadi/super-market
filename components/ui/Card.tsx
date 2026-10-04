import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean | "sm" | "md" | "lg";
}

export function Card({
  interactive = false,
  padded = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const paddingClasses = {
    false: "",
    true: "p-6",
    sm: "p-4 sm:p-5",
    md: "p-6 sm:p-7",
    lg: "p-8 sm:p-10",
  }[typeof padded === "boolean" ? (padded ? "md" : "false") : padded];

  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,16px)] shadow-xs transition-all duration-150 ${
        interactive
          ? "hover:border-[var(--color-border-hover)] hover:shadow-sm cursor-pointer active:scale-[0.998]"
          : ""
      } ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
