import styles from './IconButton.module.css';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function IconButton({ label, children, size = 'md', className, ...props }: IconButtonProps) {
  return (
    <button aria-label={label} className={`${styles.iconButton} ${styles[size]} ${className ?? ''}`} {...props}>
      {children}
    </button>
  );
}
