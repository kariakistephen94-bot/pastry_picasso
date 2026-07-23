import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/** Toggle availability (or set any single boolean flag). Admin only. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (typeof body?.available !== "boolean")
      return fail("`available` boolean is required.");

    const { error } = await admin()
      .from("menu_items")
      .update({ available: body.available })
      .eq("id", id);
    if (error) throw error;

    return ok();
  });
}

/** Delete a menu item. Admin only. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const { error } = await admin().from("menu_items").delete().eq("id", id);
    if (error) throw error;

    return ok();
  });
}
