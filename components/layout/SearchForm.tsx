import { SearchIcon } from "lucide-react";
import Form from "next/form";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

// next/form navigates client-side when JavaScript has loaded and is a plain GET form before.
export function SearchForm({ onSubmit }: { onSubmit?: () => void }) {
  return (
    <Form action="/products" role="search" onSubmit={onSubmit} className="flex gap-2">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="search"
          aria-label="Search products"
          placeholder="Search products"
          maxLength={100}
          required
        />
      </InputGroup>
      <Button type="submit">Search</Button>
    </Form>
  );
}
