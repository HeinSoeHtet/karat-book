import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between bg-slate-900/50 border-amber-500/20 text-amber-50 h-11 hover:bg-slate-900/50 hover:text-amber-50 ${className}`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selected.length === 0 ? (
              <span className="text-amber-200/60">{placeholder}</span>
            ) : (
              selected.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(value);
                    }}
                  >
                    {option?.label}
                    <X className="ml-1 size-3" />
                  </Badge>
                );
              })
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-slate-900 border-amber-500/20" align="start">
        <Command className="bg-slate-900">
          <CommandInput 
            placeholder="Search..." 
            className="h-9 border-b border-amber-500/20 text-amber-50"
          />
          <CommandEmpty className="text-amber-200/60 py-6 text-center">
            No results found.
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                className="text-amber-50 hover:bg-slate-800 aria-selected:bg-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className={`size-4 rounded border-2 flex items-center justify-center ${
                      selected.includes(option.value)
                        ? "bg-amber-500 border-amber-500"
                        : "border-amber-500/30"
                    }`}
                  >
                    {selected.includes(option.value) && (
                      <div className="size-2 bg-white rounded-sm" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}