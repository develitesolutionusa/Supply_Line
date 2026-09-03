import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import { upsertClerkOrg, upsertClerkUser } from "@/lib/sync/clerk";

export async function POST(request: NextRequest) {
  try {
    const signingSecret =
      process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
    if (!signingSecret) {
      throw new Error("Missing Clerk webhook signing secret");
    }
    const event = await verifyWebhook(request, { signingSecret });
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
