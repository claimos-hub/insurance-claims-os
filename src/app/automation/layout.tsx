import Sidebar from "@/components/Sidebar";

export default function AutomationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar />
      <main className="mr-64 min-h-screen">{children}</main>
    </div>
  );
}
