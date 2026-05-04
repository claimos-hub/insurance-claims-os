import Sidebar from "@/components/Sidebar";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="mr-64 min-h-screen">{children}</main>
    </div>
  );
}
