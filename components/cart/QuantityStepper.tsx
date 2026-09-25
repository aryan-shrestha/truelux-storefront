"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QuantityStepperProps = {
  itemName: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ itemName, value, min, max, onChange }: QuantityStepperProps) {
  const inputId = useId();

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="icon"
        aria-label={`Decrease quantity of ${itemName}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <Label htmlFor={inputId} className="sr-only">
        Quantity of {itemName}
      </Label>
      <Input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          // Typing a 0 on the way to "10" must not delete the line; Remove does that.
          if (!Number.isNaN(next) && next >= min) onChange(next);
        }}
        className="w-14 [appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        variant="outline"
        size="icon"
        aria-label={`Increase quantity of ${itemName}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </ButtonGroup>
  );
}
