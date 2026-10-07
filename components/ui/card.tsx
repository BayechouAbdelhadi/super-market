import * as React from "react"
import { cn } from "cn"

export interface CardProps extends React.ComponentProps<"div"> {
  interactive?: boolean
  padded?: boolean | "sm" | "md" | "lg"
}

function Card({
  className,
  interactive = false,
  padded,
  ...props
}: CardProps) {
  const paddingClasses = padded !== undefined
    ? {
        false: "",
        true: "p-6",
        sm: "p-4 sm:p-5",
        md: "p-6 sm:p-7",
        lg: "p-8 sm:p-10",
      }[typeof padded === "boolean" ? (padded ? "md" : "false") : padded]
    : ""

  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,16px)] shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_4px_14px_0_rgba(0,0,0,0.03)] text-sm text-[var(--color-text)] transition-all duration-200",
        interactive &&
          "hover:border-[var(--color-border-hover)] hover:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.08),0_16px_32px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] cursor-pointer active:scale-[0.995] active:translate-y-0",
        paddingClasses,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 px-6 py-5 sm:px-7", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-lg font-bold text-[var(--color-text)] tracking-tight", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs text-[var(--color-text-muted)]", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 sm:px-7", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 py-4 sm:px-7 border-t border-[var(--color-border)]", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
