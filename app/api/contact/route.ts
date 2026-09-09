import { NextResponse } from "next/server";
import { sendContactInquiry } from "@/lib/email";
import { withPublicRateLimit } from "@/lib/http";
import { logError } from "@/lib/observability";

const TOPICS = new Set([
  "Wholesale account",
  "Catalog and pricing",
  "Delivery",
  "Existing order",
  "Other",
]);

function readString(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  const limited = await withPublicRateLimit(request, "contact", 12);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = readString(body.name, 80);
  const email = readString(body.email, 120);
  const company = readString(body.company, 80);
  const phone = readString(body.phone, 40);
  const topic = readString(body.topic, 40);
  const message = readString(body.message, 2000);

  if (name.length < 2) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!TOPICS.has(topic)) {
    return NextResponse.json({ error: "Choose a topic." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Tell us a bit more in your message." }, { status: 400 });
  }

  try {
    const result = await sendContactInquiry({ name, email, company, phone, topic, message });
    return NextResponse.json({
      ok: true,
      delivered: result.delivered,
    });
  } catch (error) {
    logError("contact.inquiry", error);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }
}
