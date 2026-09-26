import { DropletsIcon, FlaskConicalIcon, PlusIcon, SunMediumIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Static copy: the API has no routine data, and these three steps hold for any skin.
const STEPS = [
  { icon: DropletsIcon, label: "Cleanse" },
  { icon: FlaskConicalIcon, label: "Treat" },
  { icon: SunMediumIcon, label: "Protect" },
];

export function SkinRoutine() {
  return (
    <section aria-labelledby="routine-heading" className="bg-muted px-4 py-20 md:py-28">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm">Skin routine</p>
        <h2 id="routine-heading" className="text-heading">
          Three steps to every morning
        </h2>
      </div>
      <ol className="mt-14 flex items-center justify-center gap-3 sm:gap-8">
        {STEPS.map(({ icon: Icon, label }, index) => (
          <li key={label} className="flex items-center gap-3 sm:gap-8">
            {index > 0 && <PlusIcon aria-hidden className="text-muted-foreground" />}
            <div className="bg-card relative flex h-28 w-24 flex-col items-center justify-end gap-3 rounded-md pb-4 sm:w-26">
              <Badge aria-hidden className="absolute -top-3.5 size-7 rounded-full tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </Badge>
              <Icon aria-hidden strokeWidth={1.25} className="size-7" />
              <span className="text-sm">{label}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
