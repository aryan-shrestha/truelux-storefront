import type { ReactNode } from "react";

export function PageShell({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="max-w-page mx-auto w-full px-4 pt-12 md:px-8 md:pt-16">
      <h1 className="font-heading text-title mb-10 md:mb-14">{title}</h1>
      {children}
    </section>
  );
}
