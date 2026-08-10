import Link from "next/link";
import Image from "next/image";
import { BookOpen, Package } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
 * Ordered by recency only — there is deliberately no featured or sponsored
 * placement for bundles. See getPublicBundles for why.
 */
export function BundleStrip({ bundles }: { bundles: PublicBundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Course bundles</h2>
        <span className="text-sm text-muted-foreground">
          Several courses, one price
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <Link key={bundle.id} href={`/bundles/${bundle.slug}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent className="space-y-3 p-4">
                <div className="flex -space-x-3">
                  {bundle.thumbnails.length > 0 ? (
                    bundle.thumbnails.map((src, i) => (
                      <div
                        key={i}
                        className="relative h-14 w-20 overflow-hidden rounded-md border-2 border-background bg-muted">
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center rounded-md bg-muted">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="line-clamp-2 font-semibold">{bundle.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {bundle.courseCount} courses · {bundle.tutorName}
                  </p>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground line-through">
                      {formatToNaira(bundle.listSum)}
                    </p>
                    <p className="text-lg font-bold">
                      {formatToNaira(bundle.price)}
                    </p>
                  </div>
                  {bundle.savings > 0 && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      Save {bundle.savingsPercent}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
