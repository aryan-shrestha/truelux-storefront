"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";

import { SearchForm } from "@/components/layout/SearchForm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SearchSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search">
          <SearchIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="top">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-10 pb-12">
          <SheetHeader className="p-0">
            <SheetTitle className="font-heading text-title">Search</SheetTitle>
            <SheetDescription>Matches words in a product&apos;s name or description.</SheetDescription>
          </SheetHeader>
          <SearchForm onSubmit={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
