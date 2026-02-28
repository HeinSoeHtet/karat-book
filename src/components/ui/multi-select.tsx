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
          className={`w-full justify-between bg-muted/50 border-border text-foreground h-11 hover:bg-muted/80 hover:text-foreground rounded-xl transition-all ${className}`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 items-center">
            {selected.length === 0 ? (
              <span className="text-foreground/40 font-medium  text-sm">{placeholder}</span>
            ) : (
              selected.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold text-[11px] px-2 py-0.5 rounded-md"
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
      <PopoverContent className="w-[300px] p-0 bg-card border-border shadow-2xl rounded-2xl overflow-hidden" align="start">
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search..."
            className="h-10 border-b-0 text-foreground font-medium"
          />
          <CommandEmpty className="text-foreground/40 py-8 text-center text-sm  font-medium">
            No results found.
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto p-2">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                className="text-foreground hover:bg-muted aria-selected:bg-muted cursor-pointer rounded-lg p-2.5 transition-all mb-1 last:mb-0"
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`size-4.5 rounded-md border-2 flex items-center justify-center transition-all ${selected.includes(option.value)
                      ? "bg-primary border-primary shadow-sm"
                      : "border-border bg-muted/30"
                      }`}
                  >
                    {selected.includes(option.value) && (
                      <div className="size-2 bg-primary-foreground rounded-[2px]" />
                    )}
                  </div>
                  <span className="font-bold text-sm tracking-tight">{option.label}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}