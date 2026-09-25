"use client";

import { BanknoteIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { EmptyBag } from "@/components/cart/EmptyBag";
import { DistrictPicker } from "@/components/checkout/DistrictPicker";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { isApiError } from "@/lib/api/errors";
import { submitCheckout } from "@/lib/api/orders";
import type { CartLine } from "@/lib/cart/storage";
import { useCart } from "@/lib/cart/use-cart";
import { describeVariant } from "@/lib/catalog/variants";
import { recordOrder } from "@/lib/orders/record";

// Input names are the API's field names, so a 400's `details` maps straight onto them.
const FIELD_NAMES = [
  "full_name",
  "email",
  "phone",
  "address_line",
  "city",
  "district",
  "note",
] as const;

type FieldName = (typeof FIELD_NAMES)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

type Problem =
  | { kind: "unavailable"; variantIds: string[] }
  | { kind: "insufficient"; variantId: string }
  | { kind: "throttled" }
  | { kind: "rejected"; requestId: string | null }
  | { kind: "uncertain"; requestId: string | null };

function toFieldErrors(details: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};
  for (const name of FIELD_NAMES) {
    const messages = details[name];
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      errors[name] = messages[0];
    }
  }
  return errors;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function lineLabel(line: CartLine): string {
  return `${line.productName} (${describeVariant(line.size, line.shade)})`;
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, ready, remove, clear } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function showFieldErrors(errors: FieldErrors) {
    // Synchronously, so the invalid fields exist before focus moves to the first.
    flushSync(() => setFieldErrors(errors));
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The button stays focusable while busy, so the guard against a second order lives here.
    if (submitting) return;

    const data = new FormData(event.currentTarget);
    const text = (name: FieldName) => String(data.get(name) ?? "");

    setProblem(null);
    if (text("district") === "") {
      showFieldErrors({ district: "Choose a district from the list." });
      return;
    }

    const email = text("email");
    setSubmitting(true);
    setFieldErrors({});

    try {
      const result = await submitCheckout({
        items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        email,
        phone: text("phone"),
        fullName: text("full_name"),
        addressLine: text("address_line"),
        city: text("city"),
        district: text("district"),
        note: text("note"),
      });

      recordOrder({
        orderNumber: result.orderNumber,
        email,
        recordedAt: new Date().toISOString(),
        paymentMethod: "cod",
        amounts: {
          subtotal: result.subtotal,
          shippingFee: result.shippingFee,
          total: result.total,
        },
      });

      // The form goes first, so the empty-bag state never flashes before navigation.
      flushSync(() => setPlaced(true));
      clear();
      router.push(`/checkout/confirmation?order=${encodeURIComponent(result.orderNumber)}`);
    } catch (error) {
      setSubmitting(false);

      // Never reached the API, or a 201 could not be read: the order may exist.
      if (!isApiError(error)) {
        setProblem({ kind: "uncertain", requestId: null });
        return;
      }

      switch (error.code) {
        case "validation_error": {
          const errors = toFieldErrors(error.details);
          if (Object.keys(errors).length > 0) showFieldErrors(errors);
          else setProblem({ kind: "rejected", requestId: error.requestId });
          return;
        }
        case "variant_unavailable":
          setProblem({ kind: "unavailable", variantIds: stringList(error.details.variant_ids) });
          return;
        case "insufficient_stock":
          setProblem({ kind: "insufficient", variantId: String(error.details.variant_id ?? "") });
          return;
        case "throttled":
          setProblem({ kind: "throttled" });
          return;
        default:
          // A server error may have come after the order committed.
          setProblem({ kind: "uncertain", requestId: error.requestId });
      }
    }
  }

  if (placed) {
    return <p role="status">Order placed. Taking you to your confirmation…</p>;
  }

  if (!ready) return <CheckoutSkeleton />;

  if (lines.length === 0) {
    return <EmptyBag description="There is nothing to check out yet." />;
  }

  const invalidCount = Object.keys(fieldErrors).length;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-12 lg:flex-row lg:gap-16"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-10">
        <FieldSet>
          <FieldLegend>Contact</FieldLegend>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <TextField name="full_name" label="Full name" error={fieldErrors.full_name}>
              {(control) => (
                <Input {...control} autoComplete="name" required maxLength={200} />
              )}
            </TextField>
            <TextField
              name="email"
              label="Email"
              hint="Your order confirmation is sent here."
              error={fieldErrors.email}
            >
              {(control) => (
                <Input {...control} type="email" autoComplete="email" spellCheck={false} required />
              )}
            </TextField>
            <TextField
              name="phone"
              label="Phone"
              hint="The shop calls this number to confirm your order."
              error={fieldErrors.phone}
            >
              {(control) => (
                <Input {...control} type="tel" autoComplete="tel" required maxLength={32} />
              )}
            </TextField>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Delivery</FieldLegend>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField name="address_line" label="Address" error={fieldErrors.address_line}>
                {(control) => (
                  <Input {...control} autoComplete="street-address" required maxLength={255} />
                )}
              </TextField>
            </div>
            <TextField name="city" label="City" error={fieldErrors.city}>
              {(control) => (
                <Input {...control} autoComplete="address-level2" required maxLength={100} />
              )}
            </TextField>
            <TextField
              name="district"
              label="District"
              hint="Delivery inside the Kathmandu valley costs less."
              error={fieldErrors.district}
            >
              {(control) => (
                <DistrictPicker
                  id={control.id}
                  name="district"
                  invalid={control["aria-invalid"] === true}
                  describedBy={control["aria-describedby"]}
                />
              )}
            </TextField>
            <div className="sm:col-span-2">
              <TextField name="note" label="Note for the shop (optional)" error={fieldErrors.note}>
                {(control) => <Textarea {...control} rows={2} maxLength={1000} />}
              </TextField>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Payment</FieldLegend>
          <Alert>
            <BanknoteIcon />
            <AlertTitle>Cash on delivery</AlertTitle>
            <AlertDescription>
              You pay in cash when your order arrives. Nothing is charged now.
            </AlertDescription>
          </Alert>
        </FieldSet>
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-offset)+1.5rem)] lg:w-96 lg:shrink-0 lg:self-start">
        <OrderSummary lines={lines} />

        {invalidCount > 0 && (
          <p role="status" className="font-medium">
            {invalidCount === 1
              ? "One field needs your attention."
              : `${invalidCount} fields need your attention.`}
          </p>
        )}
        {problem !== null && (
          <ProblemNotice
            problem={problem}
            lines={lines}
            onRemove={(variantIds) => {
              for (const variantId of variantIds) remove(variantId);
              setProblem(null);
            }}
          />
        )}

        <Button type="submit" size="lg" aria-disabled={submitting || undefined} className="w-full">
          {submitting && <Spinner data-icon="inline-start" aria-hidden />}
          {submitting ? "Placing your order…" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}

type ControlProps = {
  id: string;
  name: FieldName;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

function TextField({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: FieldName;
  label: string;
  hint?: string;
  error?: string;
  children: (control: ControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <Field data-invalid={error !== undefined || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children({
        id,
        name,
        "aria-describedby": describedBy,
        "aria-invalid": error === undefined ? undefined : true,
      })}
      {hint !== undefined && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      {error !== undefined && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
}

function ProblemNotice({
  problem,
  lines,
  onRemove,
}: {
  problem: Problem;
  lines: CartLine[];
  onRemove: (variantIds: string[]) => void;
}) {
  const bagLink = (
    <Link href="/cart" className="underline underline-offset-4">
      Back to your bag
    </Link>
  );

  let title: string;
  let body: ReactNode;

  switch (problem.kind) {
    case "unavailable": {
      const affected = lines.filter((line) => problem.variantIds.includes(line.variantId));
      title =
        affected.length === 1
          ? "Something in your bag is no longer available. Nothing was ordered."
          : "Some things in your bag are no longer available. Nothing was ordered.";
      body = (
        <>
          {affected.length > 0 && (
            <ul className="list-disc pl-5">
              {affected.map((line) => (
                <li key={line.variantId}>{lineLabel(line)}</li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {affected.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(affected.map((line) => line.variantId))}
              >
                {affected.length === 1 ? "Remove it from your bag" : "Remove them from your bag"}
              </Button>
            )}
            {bagLink}
          </div>
        </>
      );
      break;
    }
    case "insufficient": {
      const line = lines.find((candidate) => candidate.variantId === problem.variantId);
      // No count: the API does not publish how many are left.
      title =
        line === undefined
          ? "There is not enough stock for one of the things in your bag. Nothing was ordered."
          : `There is not enough stock of ${lineLabel(line)} for the quantity in your bag. Nothing was ordered.`;
      body = (
        <>
          <p>Lower the quantity or remove it, then place your order again.</p>
          <p>{bagLink}</p>
        </>
      );
      break;
    }
    case "throttled":
      title = "The shop is busy right now and your order was not placed.";
      body = <p>Please wait a few minutes, then place it again.</p>;
      break;
    case "rejected":
      title = "The shop could not accept your bag as it is. Nothing was ordered.";
      body = (
        <>
          <p>{bagLink}</p>
          {problem.requestId !== null && <p>Reference: {problem.requestId}</p>}
        </>
      );
      break;
    case "uncertain":
      title = "We could not confirm your order, so it may or may not have been placed.";
      body = (
        <>
          <p>
            Check your email for a confirmation before placing it again. If you have one, you can{" "}
            <Link href="/orders/lookup" className="underline underline-offset-4">
              look your order up
            </Link>
            .
          </p>
          {problem.requestId !== null && <p>Reference: {problem.requestId}</p>}
        </>
      );
      break;
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{body}</AlertDescription>
    </Alert>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-10 lg:flex-row lg:gap-16">
      <span className="sr-only" role="status">
        Loading your bag
      </span>
      <div className="grid flex-1 content-start gap-5 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, field) => (
          <div key={field} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:w-96 lg:shrink-0">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
