import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import { withPublicRateLimit } from "@/lib/http";
import { upsertClerkOrg, upsertClerkUser } from "@/lib/sync/clerk";

export async function POST(request: NextRequest) {
  const limited = withPublicRateLimit(request, "clerk-webhook");
  if (limited) return limited;

  try {
    const event = await verifyWebhook(request);
    console.info("[clerk webhook]", { type: event.type });

    if (event.type === "user.created" || event.type === "user.updated") {
      const email =
        event.data.email_addresses.find((item) => item.id === event.data.primary_email_address_id)
          ?.email_address ??
        event.data.email_addresses[0]?.email_address ??
        "";
      const role = event.data.public_metadata?.role;
      await upsertClerkUser({
        clerkUserId: event.data.id,
        email,
        role: role === "admin" || role === "staff" || role === "buyer" ? role : "buyer",
      });
    }

    if (event.type === "organization.created" || event.type === "organization.updated") {
      await upsertClerkOrg({
        clerkOrgId: event.data.id,
        companyName: event.data.name,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[clerk webhook] failed", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
