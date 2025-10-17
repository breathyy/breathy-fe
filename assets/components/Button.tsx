import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function Button({ children, href, className = "", onClick, type = "button", disabled }: Props) {
  // Figma-style linear gradient (left -> center -> right)
  const gradient = 'linear-gradient(120deg, #FC4C96 0%, #FF99C0 50%, #FC509A 100%)';

  const style: React.CSSProperties = {
    backgroundImage: gradient,
    boxShadow: '0 8px 0 rgba(0,0,0,0.06), inset 0 -6px 0 rgba(0,0,0,0.06)',
  };

  const base = [
    'inline-flex items-center justify-center text-white text-sm font-medium px-6 py-3 rounded-full',
    'transition-transform transition-shadow duration-200',
    'hover:-translate-y-0.5 hover:shadow-lg',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-200',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0'
  ].join(' ');

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={`${base} ${className}`} style={style} disabled={disabled}>
      {children}
    </button>
  );
}
