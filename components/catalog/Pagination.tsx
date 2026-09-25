import Link from "next/link";

import { hrefWith, PAGE_SIZE } from "@/lib/catalog/query";
import type { ProductQuery } from "@/lib/api/types";

/**
 * Numbered links, computed from `count` and `offset`.
 *
 * Never from the API's own `next`/`previous`: those are absolute URLs built
 * from the request's host, which for a server-rendered call is the internal one.
 *
 * Not infinite scroll, which would need fetching from the browser and would
 * forfeit the server render, the data cache and ADR 0001's budget in one move.
 */
export function Pagination({ count, query }: { count: number; query: ProductQuery }) {
  const pages = Math.ceil(count / PAGE_SIZE);
  if (pages <= 1) return null;

  const current = Math.floor((query.offset ?? 0) / PAGE_SIZE) + 1;

  return (
    <nav aria-label="Pages" className="mt-16 flex justify-center">
      <ul className="flex items-center gap-1">
        {Array.from({ length: pages }, (_, index) => index + 1).map((page) => {
          const active = page === current;
          return (
            <li key={page}>
              <Link
                href={hrefWith(
                  query,
                  { offset: page === 1 ? undefined : (page - 1) * PAGE_SIZE },
                  { keepOffset: true },
                )}
                aria-current={active ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={[
                  "text-ui inline-flex min-h-11 min-w-11 items-center justify-center rounded-[2px] px-2",
                  active ? "bg-ink text-paper" : "text-slate hover:bg-ink/5",
                ].join(" ")}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
