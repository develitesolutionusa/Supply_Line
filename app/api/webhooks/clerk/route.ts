import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import {
  deactivateClerkOrg,
  deactivateClerkUser,
  syncClerkIdentity,
  unlinkClerkMembership,
  upsertClerkOrg,
  upsertClerkUser,
} from "@/lib/sync/clerk";
import { isAdminLoginEmail } from "@/lib/auth/admin";
import { withPublicRateLimit } from "@/lib/http";
import { logError, logInfo } from "@/lib/observability";

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
  const limited = await withPublicRateLimit(request, "clerk-webhook", 180);
  if (limited) return limited;

  try {
    const signingSecret =
      process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
    if (!signingSecret) {
      throw new Error("Missing Clerk webhook signing secret");
    }
    const event = await verifyWebhook(request, { signingSecret });
    logInfo("clerk.webhook", { type: event.type });

    if (event.type === "user.created" || event.type === "user.updated") {
      const email =
        event.data.email_addresses.find((item) => item.id === event.data.primary_email_address_id)
          ?.email_address ??
        event.data.email_addresses[0]?.email_address ??
        "";
      const role = isAdminLoginEmail(email)
        ? "admin"
        : event.data.public_metadata?.role === "staff" || event.data.public_metadata?.role === "buyer"
          ? event.data.public_metadata.role
          : undefined;
      await upsertClerkUser({
        clerkUserId: event.data.id,
        email,
        role,
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

    if (event.type === "user.deleted" && event.data.id) {
      await deactivateClerkUser(event.data.id);
    }

    if (event.type === "organization.deleted" && event.data.id) {
      await deactivateClerkOrg(event.data.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError("clerk.webhook", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
