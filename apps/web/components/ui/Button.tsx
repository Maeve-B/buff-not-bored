import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-700",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-6 text-base",
};

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
}
