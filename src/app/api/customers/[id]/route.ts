import { admin, ok, fail, guard } from "@/lib/api-server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapProfile(d: any) {
  return {
    id: d.id,
    name: d.name ?? "",
    phone: d.phone ?? "",
    address: d.address ?? "",
  };
}

/** Read a guest's cached checkout details by their locally-stored uuid. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { id } = await params;
    if (!UUID.test(id)) return fail("Invalid customer id.");

    const { data, error } = await admin()
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;

    return ok({ profile: data ? mapProfile(data) : null });
  });
}

/** Upsert the guest's cached checkout details. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { id } = await params;
    if (!UUID.test(id)) return fail("Invalid customer id.");

    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    if (!name) return fail("A name is required.");

    const row = {
      id,
      name: name.slice(0, 120),
      phone: body?.phone ? String(body.phone).trim().slice(0, 40) : null,
      address: body?.address ? String(body.address).trim().slice(0, 300) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin().from("customers").upsert(row);
    if (error) throw error;

    return ok({ profile: mapProfile(row) });
  });
}
