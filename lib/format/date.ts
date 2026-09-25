/**
 * The shop is in Kathmandu and so are its customers, and an order placed late
 * at night should carry the date the customer placed it on. The zone is stated
 * rather than taken from the device, so the same order reads the same
 * everywhere.
 */
const ORDER_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "Asia/Kathmandu",
});

export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  // A malformed timestamp is a contract break; show it rather than "Invalid Date".
  return Number.isNaN(date.getTime()) ? iso : ORDER_DATE.format(date);
}
