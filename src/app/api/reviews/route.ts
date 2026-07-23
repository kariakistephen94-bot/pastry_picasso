import { admin, ok, fail, guard } from "@/lib/api-server";
import { reviewRowToReview } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Public list: only reviews the owner has approved. */
export async function GET() {
  return guard(async () => {
    const { data, error } = await admin()
      .from("reviews")
      .select("*")
      .eq("visible", true)
      .order("date", { ascending: false });
    if (error) throw error;
    return ok({ reviews: (data ?? []).map(reviewRowToReview) });
  });
}

/**
 * Public submission. The server, not the client, decides the sensitive
 * fields: a new review is always hidden until the owner approves it, and
 * always tagged as coming from the website.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const text = String(body?.text ?? "").trim();
    const rating = Number(body?.rating);

    if (!name) return fail("A name is required.");
    if (!text) return fail("Review text is required.");
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return fail("Rating must be between 1 and 5.");
    }

    const review = {
      id: uid(),
      name: name.slice(0, 80),
      rating: Math.round(rating),
      text: text.slice(0, 1000),
      source: "Website",
      date: Date.now(),
      visible: false,
    };

    const { error } = await admin().from("reviews").insert(review);
    if (error) throw error;
    return ok({ review: reviewRowToReview(review) }, 201);
  });
}
