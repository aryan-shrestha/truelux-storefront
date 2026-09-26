"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

import { DISTRICTS } from "@/components/checkout/districts";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DistrictPickerProps = {
  id: string;
  name: string;
  invalid: boolean;
  describedBy: string | undefined;
};

// Searchable, because 77 districts is too long to scroll; and constrained to the
// list, because a misspelt valley district is silently charged the outside rate.
export function DistrictPicker({ id, name, invalid, describedBy }: DistrictPickerProps) {
  const [open, setOpen] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="w-full justify-between font-normal"
        >
          {district ?? <span className="text-muted-foreground">Choose a district</span>}
          <ChevronsUpDownIcon data-icon="inline-end" className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <input type="hidden" name={name} value={district ?? ""} />
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search districts" aria-label="Search districts" />
          <CommandList>
            <CommandEmpty>No district matches.</CommandEmpty>
            <CommandGroup>
              {DISTRICTS.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  data-checked={option === district}
                  onSelect={() => {
                    setDistrict(option);
                    setOpen(false);
                  }}
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
