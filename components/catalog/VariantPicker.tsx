"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { RadioGroup, type RadioOption } from "@/components/ui/Radio";
import type { Product } from "@/lib/api/types";
import {
  colorOptions,
  findVariant,
  isEntirelySoldOut,
  onlyOption,
  sizeOptions,
  statusOf,
  type VariantOption,
} from "@/lib/catalog/variants";
import { useCart } from "@/lib/cart/use-cart";

/**
 * The only client component on the product page.
 *
 * Every state comes from the variant list, which is a sparse set of pairings
 * rather than a grid — see `lib/catalog/variants.ts`. A picker built from
 * independent size and colour lists looks right against a well-formed product
 * and lies about a sparse one.
 */
export function VariantPicker({ product }: { product: Product }) {
  const { add, full } = useCart();

  const initialSize = onlyOption(sizeOptions(product.variants, null));
  const initialColor = onlyOption(colorOptions(product.variants, null));

  const [size, setSize] = useState<string | null>(initialSize);
  const [color, setColor] = useState<string | null>(initialColor);
  const [added, setAdded] = useState(false);

  const sizes = sizeOptions(product.variants, color);
  const colors = colorOptions(product.variants, size);
  const selected = findVariant(product.variants, size, color);

  const soldOut = isEntirelySoldOut(product.variants);
  const unfinished = product.variants.length === 0;

  function choose(setter: (value: string) => void) {
    return (value: string) => {
      setAdded(false);
      setter(value);
    };
  }

  if (unfinished) {
    // A merchant can create a product and not finish it. That is "not set up",
    // not "sold out", and treating it as an error would be wrong too.
    return <Unavailable message="This piece is not available to buy yet." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* The price follows the selection: price_override is real, and showing
          the base price while charging the override is the kind of surprise
          that ends at a support message. */}
      <p aria-live="polite" className="text-heading font-display font-semibold">
        <Price amount={selected?.price ?? product.basePrice} />
      </p>

      <Choice label="Size" name="size" options={sizes} value={size} onChange={choose(setSize)} />
      <Choice
        label="Colour"
        name="color"
        options={colors}
        value={color}
        onChange={choose(setColor)}
      />

      {soldOut ? (
        <Unavailable message="Sold out. There is no restock notification yet." />
      ) : (
        <>
          <Button
            disabled={selected === undefined || !selected.inStock || full}
            onClick={() => {
              if (selected === undefined) return;
              add({
                variantId: selected.id,
                quantity: 1,
                productSlug: product.slug,
                productName: product.name,
                size: selected.size.name,
                color: selected.color.name,
                unitPrice: selected.price,
                imageUrl: product.primaryImage?.url ?? null,
              });
              setAdded(true);
            }}
          >
            {added && (
              // The bag is browser state (ADR 0002): adding makes no request,
              // so there is nothing to wait on and no spinner. The feedback is
              // the change itself — a check that draws in, and the header's
              // count popping.
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 8.5 3.2 3L13 4.5" pathLength={1} className="animate-draw" />
              </svg>
            )}
            {added ? "Added to bag" : "Add to bag"}
          </Button>

          {/* The button's label changing is not enough on its own. */}
          <span aria-live="polite" className="sr-only">
            {added ? `${product.name} added to your bag` : ""}
          </span>

          <Hint selected={selected !== undefined} size={size} color={color} full={full} />
        </>
      )}
    </div>
  );
}

/** A group of one is a decision already made: render it as a label, not a picker. */
function Choice({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: VariantOption[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  const single = options[0];
  if (options.length === 1 && single !== undefined) {
    return (
      <p className="text-ui">
        <span className="text-detail text-slate">{label} </span>
        {single.name}
      </p>
    );
  }

  const radioOptions: RadioOption[] = options.map((option) => ({
    value: option.slug,
    label: option.name,
    status: statusOf(option.state),
  }));

  return (
    <RadioGroup
      label={label}
      name={name}
      options={radioOptions}
      value={value}
      onChange={onChange}
    />
  );
}

function Hint({
  selected,
  size,
  color,
  full,
}: {
  selected: boolean;
  size: string | null;
  color: string | null;
  full: boolean;
}) {
  if (full) {
    return (
      <p className="text-detail text-slate">Your bag is full. Remove something to add more.</p>
    );
  }
  if (selected) return null;

  const missing =
    size === null && color === null ? "a size and a colour" : size === null ? "a size" : "a colour";

  return <p className="text-detail text-slate">Choose {missing} to add this to your bag.</p>;
}

function Unavailable({ message }: { message: string }) {
  return <p className="text-ui">{message}</p>;
}
