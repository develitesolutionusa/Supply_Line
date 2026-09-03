import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import {
  syncClerkIdentity,
  unlinkClerkMembership,
  upsertClerkOrg,
  upsertClerkUser,
} from "@/lib/sync/clerk";

type MembershipPayload = {
  organization?: { id?: string; name?: string };
  public_user_data?: { user_id?: string; identifier?: string };
};

function membershipFrom(data: unknown): { clerkUserId: string; clerkOrgId: string; companyName?: string; email?: string } | null {
  const payload = data as MembershipPayload;
  const clerkUserId = payload.public_user_data?.user_id;
  const clerkOrgId = payload.organization?.id;
  if (!clerkUserId || !clerkOrgId) return null;
  return {
    clerkUserId,
    clerkOrgId,
    companyName: payload.organization?.name,
    email: payload.public_user_data?.identifier,
  };
}

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
        role: role === "admin" || role === "staff" || role === "buyer" ? role : undefined,
      });
    }

    if (event.type === "organization.created" || event.type === "organization.updated") {
      await upsertClerkOrg({
        clerkOrgId: event.data.id,
        companyName: event.data.name,
      });
    }

    const eventType = event.type as string;
    if (eventType === "organizationMembership.created" || eventType === "organizationMembership.updated") {
      const membership = membershipFrom(event.data);
      if (membership) {
        await syncClerkIdentity({
          clerkUserId: membership.clerkUserId,
          email: membership.email,
          clerkOrgId: membership.clerkOrgId,
          companyName: membership.companyName,
        });
      }
    }

    if (eventType === "organizationMembership.deleted") {
      const membership = membershipFrom(event.data);
      if (membership) {
        await unlinkClerkMembership(membership);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[clerk webhook] failed", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
