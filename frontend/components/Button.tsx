import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glow";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  icon: Icon,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none rounded-none";
  
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200 border border-transparent",
    secondary: "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800",
    outline: "bg-transparent hover:bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white",
    ghost: "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent",
    glow: "bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] border border-transparent"
  };

  const sizes = {
    sm: "h-9 px-4 text-xs uppercase tracking-wider",
    md: "h-12 px-8 text-sm uppercase tracking-wider",
    lg: "h-14 px-10 text-base uppercase tracking-wider",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon className="ml-2 h-4 w-4" />}
    </motion.button>
  );
};

export default Button;