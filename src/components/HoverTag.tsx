'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HoverTagProps {
  tag: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  position?: 'top-left' | 'top-right' | 'top-center';
}

/**
 * Wraps any component with a floating hover tag that reveals on mouseover.
 * Shows a small label indicating what the section/component is.
 */
export default function HoverTag({ tag, children, className = '', style, position = 'top-left' }: HoverTagProps) {
  const [hovered, setHovered] = useState(false);

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 6, left: 6 },
    'top-right': { top: 6, right: 6 },
    'top-center': { top: 6, left: '50%', transform: 'translateX(-50%)' },
  };

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 pointer-events-none"
            style={positionStyles[position]}
          >
            <div
              className="px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)',
                background: 'rgba(10, 18, 32, 0.9)',
                border: '1px solid rgba(56, 217, 200, 0.2)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3), 0 0 8px rgba(56, 217, 200, 0.08)',
              }}
            >
              {tag}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
