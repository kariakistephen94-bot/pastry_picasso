import { admin, ok, guard } from "@/lib/api-server";
import { businessRowToSettings } from "@/lib/mappers";

export const dynamic = "force-dynamic";

/** Public business settings (row id = 1). */
export async function GET() {
  return guard(async () => {
    const { data, error } = await admin()
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return ok({ business: null });
    return ok({ business: businessRowToSettings(data) });
  });
}
