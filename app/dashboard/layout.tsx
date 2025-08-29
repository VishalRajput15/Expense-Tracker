// app/dashboard/layout.tsx
export const metadata = {
  title: "Expense Tracker",
  description: "Track Your Expenses Efficiently",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      {children}
    </main>
  );
}
