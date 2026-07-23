import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/** Promote/demote a registered account. Admin only. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const role = body?.role;
    if (role !== "admin" && role !== "customer")
      return fail("role must be 'admin' or 'customer'.");

    // An admin cannot strip their own access and lock everyone out.
    if (id === auth.id && role === "customer")
      return fail("You cannot remove your own administrator access.");

    const { error } = await admin()
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (error) throw error;

    return ok({ role });
  });
}
