import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import type { ProductQuery } from "@/lib/api/types";
import { hrefWith, PAGE_SIZE } from "@/lib/catalog/query";

type PaginationProps = {
  count: number;
  query: ProductQuery;
  pathname: string;
};

// Computed from count and offset, never from the API's `next`, which carries
// the server-side request's internal host.
export function Pagination({ count, query, pathname }: PaginationProps) {
  const pages = Math.ceil(count / PAGE_SIZE);
  if (pages <= 1) return null;

  const current = Math.floor((query.offset ?? 0) / PAGE_SIZE) + 1;

  return (
    <PaginationRoot aria-label="Pages" className="mt-16">
      <PaginationContent>
        {Array.from({ length: pages }, (_, index) => index + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={hrefWith(
                query,
                { offset: page === 1 ? undefined : (page - 1) * PAGE_SIZE },
                { keepOffset: true, pathname },
              )}
              isActive={page === current}
              aria-label={`Page ${page}`}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </PaginationRoot>
  );
}
