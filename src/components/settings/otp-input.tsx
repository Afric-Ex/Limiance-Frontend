import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import clsx from 'clsx';

interface OtpInputProps {
  digits?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export const OtpInput = ({ digits = 6, value, onChange, error = false }: OtpInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;

    // Take the last char if multiple entered
    const char = val.slice(-1);
    
    const newValue = value.split('');
    newValue[index] = char;
    
    // Fill array up to digits
    while (newValue.length < digits) newValue.push('');
    
    const finalValue = newValue.join('').slice(0, digits);
    onChange(finalValue);

    // Auto-advance
    if (char && index < digits - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Empty box backspace: move to prev box and clear it
        inputsRef.current[index - 1]?.focus();
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join('').slice(0, digits));
      } else {
        // Has value: just clear it
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join('').slice(0, digits));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < digits - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    if (!/^[0-9]+$/.test(pastedData)) return;

    const chars = pastedData.slice(0, digits);
    onChange(chars);
    
    // Focus last filled or empty
    const focusIndex = Math.min(chars.length, digits - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center gap-2 justify-center w-full">
      {Array.from({ length: digits }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className={clsx(
            "w-12 h-14 text-center text-xl font-bold rounded-xl transition-all",
            "bg-[#1e1f26] border outline-none text-white",
            error 
              ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_8px_rgba(246,70,93,0.3)]" 
              : "border-white/[0.04] focus:border-[#3B82F6] focus:bg-[#252730]"
          )}
        />
      ))}
    </div>
  );
};
