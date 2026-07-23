import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";
import { businessRowToSettings, type BusinessSettings } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const COLUMN: Record<keyof BusinessSettings, string> = {
  hoursText: "hours_text",
  prepTime: "prep_time",
  phoneDisplay: "phone_display",
  whatsappNumber: "whatsapp_number",
  address: "address",
};

/** Update business settings (row id = 1). Admin only. */
export async function PATCH(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const body = (await req.json().catch(() => null)) as Partial<BusinessSettings> | null;
    if (!body) return fail("Invalid request body.");

    // Only forward the known columns that were actually provided.
    const patch: Record<string, string> = {};
    for (const key of Object.keys(COLUMN) as (keyof BusinessSettings)[]) {
      if (typeof body[key] === "string") patch[COLUMN[key]] = body[key] as string;
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update.");

    const { data, error } = await admin()
      .from("business_settings")
      .update(patch)
      .eq("id", 1)
      .select()
      .single();
    if (error) throw error;

    return ok({ business: businessRowToSettings(data) });
  });
}
