"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";

import { DISTRICTS } from "@/components/checkout/districts";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Field, controlClass } from "@/components/ui/Field";
import { RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { isApiError } from "@/lib/api/errors";
import { submitCheckout } from "@/lib/api/orders";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/api/types";
import type { CartLine } from "@/lib/cart/storage";
import { useCart } from "@/lib/cart/use-cart";
import { markHandoff } from "@/lib/orders/handoff";
import { recordOrder } from "@/lib/orders/record";

/**
 * The one write in the storefront, made from the customer's browser (ADR 0001).
 *
 * Five failures reach this submit button and two of them leave a real order
 * behind, so every branch below keys on the API's error `code` (ADR 0005) and
 * none of them retries: a retry against checkout is a second order.
 *
 * The form is never unmounted by a failure that placed nothing — a customer who
 * typed an address and hit a 422 must not type it again. It is replaced only
 * once an order exists, because leaving it there invites placing another.
 */

// Input names are the API's field names, so a 400's `details` maps straight
// onto the field it is about.
const FIELD_NAMES = [
  "full_name",
  "email",
  "phone",
  "address_line",
  "city",
  "district",
  "note",
  "payment_method",
] as const;

type FieldName = (typeof FIELD_NAMES)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

type Problem =
  | { kind: "unavailable"; variantIds: string[] }
  | { kind: "insufficient"; variantId: string }
  | { kind: "throttled" }
  | { kind: "rejected"; requestId: string | null }
  | { kind: "uncertain"; requestId: string | null };

type Placed = { kind: "cod" } | { kind: "unpaid"; orderNumber: string };

const LEGEND = "font-display mb-4 text-[1.0625rem] font-semibold uppercase tracking-[0.06em]";

const PAYMENT_OPTIONS = [
  { value: "cod", label: "Cash on delivery" },
  { value: "khalti", label: "Khalti" },
];

function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

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
  return `${line.productName} (${line.size}, ${line.color})`;
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, ready, remove, clear } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const placedHeadingRef = useRef<HTMLHeadingElement>(null);

  function showFieldErrors(errors: FieldErrors) {
    // Synchronously, so the invalid fields exist in the DOM before focus moves.
    flushSync(() => setFieldErrors(errors));
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    // A radio group is not itself focusable; its first radio is.
    const target =
      first?.getAttribute("role") === "radiogroup" ? first.querySelector("input") : first;
    target?.focus();
  }

  // The order exists from here on. The form goes, so nothing invites a second
  // one, and the cart is cleared *after* this renders so the empty-bag state
  // never flashes in between.
  function settle(next: Placed) {
    flushSync(() => setPlaced(next));
    placedHeadingRef.current?.focus();
    clear();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // aria-disabled rather than disabled keeps focus on the button while the
    // request is in flight, so the guard lives here. State is enough: React
    // flushes a discrete event's updates before it handles the next one, and
    // `submitting` is set before the first await.
    if (submitting) return;

    if (paymentMethod === null) {
      setProblem(null);
      showFieldErrors({ payment_method: "Choose how you would like to pay." });
      return;
    }

    const data = new FormData(event.currentTarget);
    const text = (name: FieldName) => String(data.get(name) ?? "");
    const email = text("email");

    setSubmitting(true);
    setFieldErrors({});
    setProblem(null);

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
        paymentMethod,
      });

      // Written before anything navigates: after `location.assign` this page
      // is gone.
      recordOrder({
        orderNumber: result.orderNumber,
        email,
        recordedAt: new Date().toISOString(),
        paymentMethod,
        amounts: {
          subtotal: result.subtotal,
          shippingFee: result.shippingFee,
          total: result.total,
        },
      });

      if (paymentMethod === "cod") {
        settle({ kind: "cod" });
        router.push(`/checkout/confirmation?order=${encodeURIComponent(result.orderNumber)}`);
        return;
      }

      if (result.paymentUrl !== undefined) {
        // The bag stays: a customer who abandons Khalti's page comes back to
        // something they can act on. The marker lets the landing clear it for
        // this order only, and never from an email link opened later.
        markHandoff(result.orderNumber);
        window.location.assign(result.paymentUrl);
        return;
      }

      // A Khalti order with no payment URL is a contract violation, and the
      // order exists all the same — the same position as a gateway failure.
      settle({ kind: "unpaid", orderNumber: result.orderNumber });
    } catch (error) {
      setSubmitting(false);

      // Not an ApiError means it never reached the API, or a 201 came back
      // with a body that could not be read. In both the order may exist.
      if (!isApiError(error)) {
        setProblem({ kind: "uncertain", requestId: null });
        return;
      }

      switch (error.code) {
        case "payment_gateway_unavailable": {
          // A failure response describing a success: the order was placed.
          const orderNumber = String(error.details.order_number ?? "");
          recordOrder({
            orderNumber,
            email,
            recordedAt: new Date().toISOString(),
            paymentMethod,
            amounts: null,
          });
          settle({ kind: "unpaid", orderNumber });
          return;
        }
        case "validation_error": {
          const errors = toFieldErrors(error.details);
          if (Object.keys(errors).length > 0) {
            showFieldErrors(errors);
          } else {
            // About the items rather than a field: nothing typed can fix it.
            setProblem({ kind: "rejected", requestId: error.requestId });
          }
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
          // A server error may have happened after the order committed, so it
          // is reported as unknown rather than as a failure.
          setProblem({ kind: "uncertain", requestId: error.requestId });
      }
    }
  }

  if (placed?.kind === "cod") {
    return (
      <p role="status" className="text-ui">
        Order placed. Taking you to your confirmation…
      </p>
    );
  }

  if (placed?.kind === "unpaid") {
    return <UnpaidOrder orderNumber={placed.orderNumber} headingRef={placedHeadingRef} />;
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        <span className="sr-only" role="status">
          Loading your bag
        </span>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="grid flex-1 content-start gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, field) => (
              <div key={field} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 lg:w-96 lg:shrink-0">
            {[0, 1].map((line) => (
              <div key={line} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <Skeleton className="mt-4 h-11 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border-wash flex flex-col gap-4 border-t py-16">
        <h2 className="text-heading font-display font-semibold">Your bag is empty</h2>
        <p className="prose-body text-slate">There is nothing to check out yet.</p>
        <p>
          <Link href="/products" className="decoration-indigo underline underline-offset-4">
            Shop everything
          </Link>
        </p>
      </div>
    );
  }

  const invalidCount = Object.keys(fieldErrors).length;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-12 lg:flex-row lg:gap-16"
    >
      {/* Short fields share a row — three from xl, two from sm — so the form
          reads as a compact sheet rather than a column of full-width bars.
          Rows align to the bottom, so a field with a hint above its control
          (Email, District) still lines its box up with its neighbours. */}
      <div className="flex min-w-0 flex-1 flex-col gap-9">
        <fieldset>
          <legend className={LEGEND}>Contact</legend>
          <div className="grid items-end gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Full name" error={fieldErrors.full_name}>
              {(control) => (
                <input
                  {...control}
                  name="full_name"
                  autoComplete="name"
                  required
                  maxLength={200}
                  className={controlClass}
                />
              )}
            </Field>
            <Field
              label="Email"
              hint="Your order confirmation is sent here."
              error={fieldErrors.email}
            >
              {(control) => (
                <input
                  {...control}
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  className={controlClass}
                />
              )}
            </Field>
            <Field label="Phone" error={fieldErrors.phone}>
              {(control) => (
                <input
                  {...control}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={32}
                  className={controlClass}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className={LEGEND}>Delivery</legend>
          <div className="grid items-end gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Address" error={fieldErrors.address_line}>
                {(control) => (
                  <input
                    {...control}
                    name="address_line"
                    autoComplete="street-address"
                    required
                    maxLength={255}
                    className={controlClass}
                  />
                )}
              </Field>
            </div>
            <Field label="City" error={fieldErrors.city}>
              {(control) => (
                <input
                  {...control}
                  name="city"
                  autoComplete="address-level2"
                  required
                  maxLength={100}
                  className={controlClass}
                />
              )}
            </Field>
            <Field
              label="District"
              hint="Delivery inside the Kathmandu valley costs less."
              error={fieldErrors.district}
            >
              {(control) => (
                // Searchable: 77 districts is too long a list to scroll, and
                // the list still constrains the value, which decides the
                // shipping band (see districts.ts).
                <Combobox
                  {...control}
                  name="district"
                  options={DISTRICTS}
                  placeholder="Choose a district"
                  invalidMessage="Choose a district from the list."
                  required
                />
              )}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Note for the shop (optional)" error={fieldErrors.note}>
                {(control) => (
                  <textarea
                    {...control}
                    name="note"
                    rows={2}
                    maxLength={1000}
                    className={controlClass}
                  />
                )}
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={LEGEND}>Payment</legend>
          <RadioGroup
            label="How would you like to pay?"
            name="payment_method"
            options={PAYMENT_OPTIONS}
            value={paymentMethod}
            onChange={(value) => {
              if (isPaymentMethod(value)) setPaymentMethod(value);
            }}
            error={fieldErrors.payment_method}
          />
          {paymentMethod === "khalti" && (
            <p className="text-detail text-slate">
              You will pay on Khalti&rsquo;s page, then come back here. The payment link expires
              after an hour.
            </p>
          )}
        </fieldset>
      </div>

      {/*
        Inside the form, after the fields and before the button, so a screen
        reader meets the lines and the shipping note before the action they
        describe.
      */}
      <aside className="flex flex-col gap-6 transition-[top] duration-450 ease-(--ease-settle) lg:sticky lg:top-[calc(var(--header-offset)+1.5rem)] lg:w-96 lg:shrink-0 lg:self-start">
        <OrderSummary lines={lines} />

        {invalidCount > 0 && (
          <p role="alert" className="text-ui font-medium">
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

        <Button type="submit" pending={submitting} className="w-full">
          {submitting
            ? "Placing your order…"
            : paymentMethod === "khalti"
              ? "Place order and pay with Khalti"
              : "Place order"}
        </Button>
      </aside>
    </form>
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
    <Link href="/cart" className="decoration-indigo underline underline-offset-4">
      Back to your bag
    </Link>
  );

  let body: ReactNode;

  switch (problem.kind) {
    case "unavailable": {
      const affected = lines.filter((line) => problem.variantIds.includes(line.variantId));
      body = (
        <>
          <p className="font-medium">
            {affected.length === 1
              ? "Something in your bag is no longer available."
              : "Some things in your bag are no longer available."}{" "}
            Nothing was ordered.
          </p>
          {affected.length > 0 && (
            <ul className="list-disc pl-5">
              {affected.map((line) => (
                <li key={line.variantId}>{lineLabel(line)}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-4">
            {affected.length > 0 && (
              <Button
                variant="ghost"
                className="border-ink border"
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
      // No count, deliberately: the API does not say how many are left, and
      // a number here would publish what the backend refuses to.
      body = (
        <>
          <p className="font-medium">
            {line === undefined
              ? "There is not enough stock for one of the things in your bag."
              : `There is not enough stock of ${lineLabel(line)} for the quantity in your bag.`}{" "}
            Nothing was ordered.
          </p>
          <p>Lower the quantity or remove it, then place your order again.</p>
          <p>{bagLink}</p>
        </>
      );
      break;
    }
    case "throttled":
      // Per IP, and a phone network can put a whole neighbourhood behind one,
      // so this does not suggest the customer did anything wrong.
      body = (
        <p className="font-medium">
          The shop is busy right now and your order was not placed. Please wait a few minutes, then
          place it again.
        </p>
      );
      break;
    case "rejected":
      body = (
        <>
          <p className="font-medium">
            The shop could not accept your bag as it is. Nothing was ordered.
          </p>
          <p>{bagLink}</p>
          {problem.requestId !== null && (
            <p className="text-detail text-slate">Reference: {problem.requestId}</p>
          )}
        </>
      );
      break;
    case "uncertain":
      // The one failure where the outcome is unknown: the order may exist.
      // Nothing here may say that it failed.
      body = (
        <>
          <p className="font-medium">
            We could not confirm your order, so it may or may not have been placed.
          </p>
          <p>
            Check your email for a confirmation before placing it again. If you have one, you can{" "}
            <Link href="/orders/lookup" className="decoration-indigo underline underline-offset-4">
              look your order up
            </Link>
            .
          </p>
          {problem.requestId !== null && (
            <p className="text-detail text-slate">Reference: {problem.requestId}</p>
          )}
        </>
      );
      break;
  }

  return (
    <div role="alert" className="border-ink text-ui flex flex-col gap-3 border-l-2 pl-4">
      {body}
    </div>
  );
}

function UnpaidOrder({
  orderNumber,
  headingRef,
}: {
  orderNumber: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  // No retry, and no way to make one: there is no retry-payment endpoint, so
  // a second attempt could only place a second order for the same goods.
  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <h2 ref={headingRef} tabIndex={-1} className="text-heading font-display font-semibold">
        Your order is placed, but payment could not start
      </h2>
      <div className="flex flex-col gap-1">
        <p className="text-detail text-slate">Order number</p>
        <p className="text-title font-display font-semibold select-all">{orderNumber}</p>
      </div>
      <p className="prose-body">
        Khalti could not be reached, so nothing was charged. Your items are reserved under this
        order, and the shop will be in touch to arrange payment. Keep your order number — it is how
        the shop will find your order.
      </p>
      <p>
        <Link href="/products" className="decoration-indigo underline underline-offset-4">
          Continue shopping
        </Link>
      </p>
    </section>
  );
}
