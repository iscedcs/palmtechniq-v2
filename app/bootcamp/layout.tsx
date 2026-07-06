import React from "react";
import type { Metadata } from "next";
import { BootcampNavbar } from "@/components/bootcamp/bootcamp-navbar";
import { BootcampFooter } from "@/components/bootcamp/bootcamp-footer";

export const metadata: Metadata = {
  title: "Summer Bootcamp 2026 | PalmTechnIQ",
  description:
    "An immersive 12-week paid software engineering, AI, and UI/UX bootcamp for high-conviction builders. Inspired by Moonshot by TechCabal.",
};

export default function BootcampLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#001c22] text-white flex flex-col font-sans selection:bg-[#27ba55] selection:text-black overflow-x-hidden">
      <BootcampNavbar />
      <div className="flex-1 w-full">{children}</div>
      <BootcampFooter />
    </div>
  );
}
