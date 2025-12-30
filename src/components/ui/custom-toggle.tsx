import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface CustomToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}
export function CustomToggle({ checked, onCheckedChange, className }: CustomToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "w-14 h-8 rounded-full border-2 border-black relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black shrink-0",
        checked ? "bg-green-500" : "bg-gray-300",
        className
      )}
    >
      <motion.div
        initial={false}
        animate={{
          x: checked ? 24 : 2
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full border-2 border-black shadow-sm"
      />
    </button>
  );
}