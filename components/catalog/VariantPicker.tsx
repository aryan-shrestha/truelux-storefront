"use client";

import { CheckIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Product } from "@/lib/api/types";
import { useCart } from "@/lib/cart/use-cart";
import {
  findVariant,
  hasShades,
  isEntirelySoldOut,
  onlyOption,
  shadeOptions,
  sizeOptions,
  statusOf,
  type ShadeOption,
  type SizeOption,
} from "@/lib/catalog/variants";

export function VariantPicker({ product }: { product: Product }) {
  const { add, full } = useCart();
  const { variants } = product;
  const shaded = hasShades(variants);

  const [size, setSize] = useState(() => onlyOption(sizeOptions(variants, null)));
  const [shade, setShade] = useState(() => onlyOption(shadeOptions(variants, null)));
  const [added, setAdded] = useState(false);

  if (variants.length === 0) {
    return <p>This product is not available to buy yet.</p>;
  }

  const sizes = sizeOptions(variants, shade);
  const shades = shadeOptions(variants, size);
  const selected = findVariant(variants, size, shade);

  function choose(setter: (value: string | null) => void) {
    return (value: string) => {
      setAdded(false);
      // Radix single toggle groups send "" when the chosen item is pressed again.
      setter(value === "" ? null : value);
    };
  }

  function handleAdd() {
    if (selected === undefined) return;
    add({
      variantId: selected.id,
      quantity: 1,
      productSlug: product.slug,
      productName: product.name,
      size: selected.size.name,
      shade: selected.shade?.name ?? null,
      unitPrice: selected.price,
      imageUrl: product.primaryImage?.url ?? null,
    });
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* The variant's own price once resolved: price overrides are real. */}
      <p aria-live="polite" className="text-2xl">
        <Price amount={selected?.price ?? product.basePrice} />
      </p>

      {shaded && <ShadeChoice options={shades} value={shade} onChange={choose(setShade)} />}
      <SizeChoice options={sizes} value={size} onChange={choose(setSize)} />

      {isEntirelySoldOut(variants) ? (
        <p>Sold out. There is no restock notification yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            disabled={selected === undefined || !selected.inStock || full}
            onClick={handleAdd}
          >
            {added && <CheckIcon data-icon="inline-start" />}
            {added ? "Added to bag" : "Add to bag"}
          </Button>
          <span aria-live="polite" className="sr-only">
            {added ? `${product.name} added to your bag` : ""}
          </span>
          <Hint missingSize={size === null} missingShade={shaded && shade === null} full={full} />
        </div>
      )}
    </div>
  );
}

function ShadeChoice({
  options,
  value,
  onChange,
}: {
  options: ShadeOption[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  const chosen = options.find((option) => option.slug === value);
  const [single] = options;

  if (options.length === 1 && single !== undefined) {
    return <ChoiceLabel label="Shade" value={single.name} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p id={labelId} className="text-sm">
        <span className="text-muted-foreground">Shade</span>
        {chosen !== undefined && <span className="ml-2 font-medium">{chosen.name}</span>}
      </p>
      <ToggleGroup
        type="single"
        aria-labelledby={labelId}
        value={value ?? ""}
        onValueChange={onChange}
        variant="swatch"
        size="swatch"
        className="flex-wrap"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.slug}
            value={option.slug}
            disabled={option.state !== "available"}
            aria-label={[option.name, statusOf(option.state)].filter(Boolean).join(", ")}
            title={option.name}
          >
            <span
              aria-hidden
              className="size-8 rounded-full"
              // The swatch colour is data from the API, not a design token.
              style={{ backgroundColor: option.hexCode }}
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function SizeChoice({
  options,
  value,
  onChange,
}: {
  options: SizeOption[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  const [single] = options;

  if (options.length === 1 && single !== undefined) {
    return <ChoiceLabel label="Size" value={single.name} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p id={labelId} className="text-muted-foreground text-sm">
        Size
      </p>
      <ToggleGroup
        type="single"
        aria-labelledby={labelId}
        value={value ?? ""}
        onValueChange={onChange}
        variant="outline"
        className="flex-wrap"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.slug}
            value={option.slug}
            disabled={option.state !== "available"}
            aria-label={[option.name, statusOf(option.state)].filter(Boolean).join(", ")}
          >
            {option.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function ChoiceLabel({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-medium">{value}</span>
    </p>
  );
}

function Hint({
  missingSize,
  missingShade,
  full,
}: {
  missingSize: boolean;
  missingShade: boolean;
  full: boolean;
}) {
  if (full) {
    return (
      <p className="text-muted-foreground text-sm">
        Your bag is full. Remove something to add more.
      </p>
    );
  }
  if (!missingSize && !missingShade) return null;

  const missing =
    missingSize && missingShade ? "a shade and a size" : missingShade ? "a shade" : "a size";
  return <p className="text-muted-foreground text-sm">Choose {missing} to add this to your bag.</p>;
}
