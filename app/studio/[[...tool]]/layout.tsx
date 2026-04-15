export const metadata = {
  title: "PalmTechnIQ Studio",
  description: "Content management studio for PalmTechnIQ blog",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ margin: 0 }}>
      {children}
    </div>
  );
}
