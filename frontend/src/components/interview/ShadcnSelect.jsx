import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShadcnSelect({ value, onChange, options, disabled, className }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        className={`w-full justify-between font-normal text-sm h-10 px-3 cursor-pointer border-input bg-background ${className}`}
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 duration-100 min-w-[200px]">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-left"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.value === value && (
                  <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </span>
                )}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
