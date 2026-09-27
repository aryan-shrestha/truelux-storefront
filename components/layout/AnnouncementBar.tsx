import { shippingNote } from "@/lib/shipping/note";

export async function AnnouncementBar() {
  return (
    <p className="bg-ink text-ink-foreground px-4 py-3 text-center text-sm">
      {await shippingNote()}
    </p>
  );
}
