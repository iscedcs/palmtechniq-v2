import React from "react";
import { BootcampHero } from "@/components/bootcamp/bootcamp-hero";
import { BootcampTracks } from "@/components/bootcamp/bootcamp-tracks";
import { BootcampBattlefield } from "@/components/bootcamp/bootcamp-battlefield";
import { BootcampTiers } from "@/components/bootcamp/bootcamp-tiers";
import { BootcampAdvisorCta } from "@/components/bootcamp/bootcamp-advisor-cta";

export default function BootcampPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <BootcampHero />
      <BootcampTracks />
      <BootcampBattlefield />
      <BootcampTiers />
      <BootcampAdvisorCta />
    </div>
  );
}
