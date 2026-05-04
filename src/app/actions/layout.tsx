import Sidebar from "@/components/Sidebar";
import DailyBrief from "@/components/DailyBrief";

export default function ActionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <DailyBrief />
      <main className="mr-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
