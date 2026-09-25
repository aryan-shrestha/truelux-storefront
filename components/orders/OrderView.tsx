import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderStatus } from "@/lib/api/types";
import { describeVariant } from "@/lib/catalog/variants";
import { formatOrderDate } from "@/lib/format/date";

type StatusCopy = { label: string; detail: string };

const ORDER_STATUS_COPY: Record<OrderStatus, StatusCopy> = {
  pending: {
    label: "Placed",
    detail: "Your order is placed. The shop will call you to confirm it before it ships.",
  },
  confirmed: {
    label: "Confirmed",
    detail: "The shop has confirmed your order and is preparing it. You pay in cash on delivery.",
  },
  shipped: { label: "Shipped", detail: "Your order is on its way. Have the cash ready on delivery." },
  delivered: { label: "Delivered", detail: "Your order has been delivered." },
  cancelled: { label: "Cancelled", detail: "This order was cancelled." },
};

// Nothing here is computed: line prices are the purchase-time snapshots and the
// three figures at the foot are the API's (ADR 0003).
export function OrderView({ order }: { order: Order }) {
  const status = ORDER_STATUS_COPY[order.status];

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Order number</p>
          <p className="font-heading text-4xl tabular-nums select-all">{order.orderNumber}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-8 gap-y-2">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <Badge variant={order.status === "cancelled" ? "outline" : "secondary"}>
              {status.label}
            </Badge>
          </dd>
          <dt className="text-muted-foreground">Ordered</dt>
          <dd>{formatOrderDate(order.placedAt)}</dd>
        </dl>
        <p className="leading-relaxed">{status.detail}</p>
      </div>

      <section aria-labelledby="order-items-heading" className="flex flex-col gap-4">
        <h2 id="order-items-heading" className="text-2xl">
          Items
        </h2>
        <ul className="border-t">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between gap-4 border-b py-3">
              <div className="flex min-w-0 flex-col gap-0.5 break-words">
                <span className="font-medium">{item.productName}</span>
                <span className="text-sm text-muted-foreground">
                  {describeVariant(item.variantSize, item.variantShade)}
                </span>
              </div>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {item.quantity} × <Price amount={item.unitPrice} />
              </span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 tabular-nums">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right">
            <Price amount={order.subtotal} />
          </dd>
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-right">
            <Price amount={order.shippingFee} />
          </dd>
          <Separator className="col-span-2 my-1" />
          <dt className="font-medium">Total</dt>
          <dd className="text-right font-medium">
            <Price amount={order.total} />
          </dd>
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="text-right">Cash on delivery</dd>
        </dl>
      </section>

      <section aria-labelledby="order-delivery-heading" className="flex flex-col gap-4">
        <h2 id="order-delivery-heading" className="text-2xl">
          Delivery
        </h2>
        <address className="flex flex-col break-words not-italic">
          <span className="font-medium">{order.shipping.fullName}</span>
          <span>{order.shipping.addressLine}</span>
          <span>
            {order.shipping.city}, {order.shipping.district}
          </span>
          <span className="mt-2 text-muted-foreground">{order.phone}</span>
          <span className="text-muted-foreground">{order.email}</span>
        </address>
      </section>
    </div>
  );
}
