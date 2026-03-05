"use client";

import { UploadStatusPanel } from "@/components/shared/upload-status-panel";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <UploadStatusPanel />
    </>
  );
}
