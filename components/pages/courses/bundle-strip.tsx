import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { formatToNaira } from "@/lib/utils";

type PublicBundle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  listSum: number;
  savings: number;
  savingsPercent: number;
  tutorName: string;
  courseCount: number;
  thumbnails: string[];
};

/**
 * Bundles on the course listing.
 *
 * Deliberately restrained: text-forward, no imagery, sitting inside the
 * catalogue's own rhythm rather than above the hero. A bundle is an
 * alternative way to buy what is already on this page, so it should read as
 * part of the catalogue, not as an advertisement in front of it.
 *
 * There is also no featured or sponsored placement — see getPublicBundles.
 */
export function BundleStrip({ bundles }: { bundles: PublicBundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto mb-8">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
        <Package className="h-4 w-4" />
        <span className="font-medium text-white">Bundles</span>
        <span>· buy several courses together for less</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {bundles.slice(0, 4).map((bundle) => (
          <Link
            key={bundle.id}
            href={`/bundles/${bundle.slug}`}
            className="group flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-neon-blue/40 hover:bg-white/[0.06]">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{bundle.title}</p>
              <p className="text-xs text-gray-400">
                {bundle.courseCount} courses · {bundle.tutorName}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-white">
                  {formatToNaira(bundle.price)}
                </p>
                {bundle.savings > 0 && (
                  <p className="text-xs text-neon-green">
                    save {bundle.savingsPercent}%
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-neon-blue" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
