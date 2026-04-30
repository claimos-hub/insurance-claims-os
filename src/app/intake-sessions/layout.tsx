import Sidebar from "@/components/Sidebar";

export default function IntakeSessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="mr-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
