import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

export default function Button({ children, href, className = "", onClick, type = "button" }: Props) {
  // Figma-style linear gradient (left -> center -> right)
  const gradient = 'linear-gradient(120deg, #FC4C96 0%, #FF99C0 50%, #FC509A 100%)';

  const style: React.CSSProperties = {
    backgroundImage: gradient,
    boxShadow: '0 8px 0 rgba(0,0,0,0.06), inset 0 -6px 0 rgba(0,0,0,0.06)',
  };

  const base = 'inline-block text-white text-sm font-medium px-6 py-3 rounded-full transition-transform';

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={`${base} ${className}`} style={style}>
      {children}
    </button>
  );
}
