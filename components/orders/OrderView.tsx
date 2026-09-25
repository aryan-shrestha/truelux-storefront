import { Price } from "@/components/ui/Price";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/api/types";
import { formatOrderDate } from "@/lib/format/date";

/**
 * An order as the API returned it, for both the token route and the lookup.
 *
 * Nothing here is computed: the line prices are the snapshots taken at
 * purchase, and the three figures at the foot are the API's (ADR 0003). The
 * lines do not link anywhere — the response has no variant id, and a product
 * renamed since shows the name it was bought under, which is correct.
 */

type StatusCopy = { label: string; detail: string };

const STATUS: Record<Exclude<OrderStatus, "pending">, StatusCopy> = {
  paid: {
    label: "Paid",
    detail: "Your payment is confirmed and the shop is preparing your order.",
  },
  shipped: { label: "Shipped", detail: "Your order is on its way." },
  delivered: { label: "Delivered", detail: "Your order has been delivered." },
  cancelled: { label: "Cancelled", detail: "This order was cancelled." },
};

// `pending` is the one status whose meaning depends on how the order is paid.
// After a Khalti redirect it means the payment was *not* confirmed, and it must
// never read as though it were.
const PENDING: Record<PaymentMethod, StatusCopy> = {
  cod: {
    label: "Placed",
    detail: "Your order is placed. You pay in cash when it arrives.",
  },
  khalti: {
    label: "Awaiting payment",
    detail:
      "Khalti has not confirmed a payment for this order, so it is not paid yet. If you were charged, keep your order number: it is how the shop will find the payment.",
  },
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  khalti: "Khalti",
};

export function OrderView({ order }: { order: Order }) {
  const status = order.status === "pending" ? PENDING[order.paymentMethod] : STATUS[order.status];

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-detail text-slate">Order number</p>
          {/* Selectable text, never an image: it is read aloud over the phone. */}
          <p className="text-title font-display font-semibold tabular-nums select-all">
            {order.orderNumber}
          </p>
        </div>
        <dl className="text-ui grid grid-cols-[auto_1fr] gap-x-8 gap-y-1">
          <dt className="text-slate">Status</dt>
          <dd className="font-medium">{status.label}</dd>
          <dt className="text-slate">Placed</dt>
          <dd>{formatOrderDate(order.placedAt)}</dd>
        </dl>
        <p className="prose-body">{status.detail}</p>
      </div>

      <section aria-labelledby="order-items-heading" className="flex flex-col gap-4">
        <h2 id="order-items-heading" className="text-heading font-display font-semibold">
          Items
        </h2>
        <ul className="border-wash border-t">
          {order.items.map((item) => (
            <li key={item.sku} className="border-wash flex justify-between gap-4 border-b py-3">
              <div className="flex min-w-0 flex-col gap-0.5 break-words">
                <span className="text-ui font-medium">{item.productName}</span>
                <span className="text-detail text-slate">
                  {item.variantSize} · {item.variantColor}
                </span>
              </div>
              {/* Quantity and unit price side by side, never multiplied (ADR 0003). */}
              <span className="text-ui text-slate shrink-0 tabular-nums">
                {item.quantity} × <Price amount={item.unitPrice} />
              </span>
            </li>
          ))}
        </ul>
        <dl className="text-ui grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 tabular-nums">
          <dt className="text-slate">Subtotal</dt>
          <dd className="text-right">
            <Price amount={order.subtotal} />
          </dd>
          <dt className="text-slate">Shipping</dt>
          <dd className="text-right">
            <Price amount={order.shippingFee} />
          </dd>
          <dt className="font-medium">Total</dt>
          <dd className="text-right font-medium">
            <Price amount={order.total} />
          </dd>
          <dt className="text-slate">Payment</dt>
          <dd className="text-right">{PAYMENT_LABEL[order.paymentMethod]}</dd>
        </dl>
      </section>

      <section aria-labelledby="order-delivery-heading" className="flex flex-col gap-4">
        <h2 id="order-delivery-heading" className="text-heading font-display font-semibold">
          Delivery
        </h2>
        <address className="text-ui flex flex-col break-words not-italic">
          <span className="font-medium">{order.shipping.fullName}</span>
          <span>{order.shipping.addressLine}</span>
          <span>
            {order.shipping.city}, {order.shipping.district}
          </span>
          <span className="text-slate mt-2">{order.phone}</span>
          <span className="text-slate">{order.email}</span>
        </address>
      </section>
    </div>
  );
}
