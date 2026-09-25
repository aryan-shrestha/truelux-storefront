import { SearchIcon } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/products" role="search" className={className}>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="search"
          aria-label="Search products"
          placeholder="Search"
          maxLength={100}
        />
      </InputGroup>
    </form>
  );
}
