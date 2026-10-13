import { SlidersHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// The sheet's open state survives a filter click (same route, soft navigation), so
// several filters apply in a row before "Show results".
export function FilterSheet({ applied, children }: { applied: number; children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontalIcon data-icon="inline-start" />
          {applied > 0 ? `Filters (${applied} applied)` : "Filters"}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" aria-describedby={undefined} className="gap-0">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 scrollbar-thin overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>
        <SheetFooter className="border-t">
          <SheetClose asChild>
            <Button>Show results</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
