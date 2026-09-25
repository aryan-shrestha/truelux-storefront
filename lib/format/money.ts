import type { Money } from "@/lib/api/types";

/**
 * The only module in this repository permitted to parse an amount.
 *
 * Amounts are decimal strings from the API to the pixel (ADR 0003), and nothing
 * here computes one — this parses solely to group digits for display. The
 * currency is NPR and is implicit; the API never states it.
 */

const GROUPER = new Intl.NumberFormat("en-IN", { useGrouping: true });

export function formatPrice(amount: Money): string {
  const [rupees = "0", paisa] = amount.split(".");

  const whole = Number.parseInt(rupees, 10);
  if (Number.isNaN(whole)) {
    // A malformed amount is a contract break, not a customer-facing state. Show
    // it verbatim rather than rendering "Rs NaN".
    return amount;
  }

  const grouped = GROUPER.format(whole);

  // Paisa are shown only when there are any. Every price in the catalogue ends
  // in .00 today, and "Rs 2,400.00" reads as a receipt rather than a price tag.
  return paisa !== undefined && paisa !== "00" ? `Rs ${grouped}.${paisa}` : `Rs ${grouped}`;
}
