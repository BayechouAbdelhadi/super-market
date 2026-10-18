import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

interface CustomersPageProps {
  searchParams?: Promise<{ page?: string; limit?: string; q?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await resolveUserRole(supabase, user);
  const params = searchParams ? await searchParams : {};
  const search = new URLSearchParams();
  if (params.page) search.set("page", params.page);
  if (params.limit) search.set("limit", params.limit);
  if (params.q) search.set("q", params.q);
  const query = search.toString() ? `?${search.toString()}` : "";

  if (role === "ADMIN") {
    redirect(`/admin/customers${query}`);
  }

  redirect(`/cashier/customers${query}`);
}
