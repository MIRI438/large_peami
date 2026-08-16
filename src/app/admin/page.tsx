import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  if (!authed) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
