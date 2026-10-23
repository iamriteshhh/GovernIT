import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactRateLimiter } from "@/server/auth/rate-limiter";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(100),
  opportunityName: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message must be under 5000 characters"),
  website_hp: z.string().optional().default(""),
  renderedAt: z.number().optional(),
});

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "local-client";
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIdentifier(request);

  // 1. Rate limiting check (5 submissions per 15 min per IP)
  const rateLimitStatus = contactRateLimiter.check(clientIp);
  if (!rateLimitStatus.allowed) {
    console.warn(`[SECURITY AUDIT] Contact form rate limit exceeded for IP: ${clientIp}`);
    return NextResponse.json(
      {
        error: "Too many contact submissions. Please wait before submitting again.",
        retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds ?? 900),
        },
      }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = contactSchema.safeParse(rawBody);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? "Invalid form input";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const data = parsed.data;

    // 2. Honeypot check (Bots fill this field)
    if (data.website_hp) {
      console.warn(`[SPAM DEFENSE] Honeypot triggered on contact form from IP: ${clientIp}`);
      // Silently pretend success to avoid giving bot feedback
      return NextResponse.json({
        success: true,
        ticketId: "GRIEV-HP-TRAP",
        message: "Your message has been received.",
      });
    }

    // 3. Time-to-submit verification (reject submissions made in under 2 seconds)
    if (data.renderedAt && Date.now() - data.renderedAt < 2000) {
      return NextResponse.json(
        { error: "Form submitted too quickly. Please take a moment to review before submitting." },
        { status: 400 }
      );
    }

    // Record submission against rate limiter
    contactRateLimiter.recordFailure(clientIp);

    // 4. Generate unique ticket identifier for editorial tracking
    const ticketId = `GRIEV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    console.info(
      `[EDITORIAL CONTACT] Grievance logged [${ticketId}] | Subject: "${data.subject}" | Opportunity: "${data.opportunityName || "N/A"}" | Sender: ${data.name} <${data.email}> | IP: ${clientIp}`
    );

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Your message has been securely submitted to our editorial transparency team. Ticket ID: ${ticketId}.`,
    });
  } catch (error) {
    console.error("[CONTACT ERROR] Failed to process contact submission:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while submitting your message." },
      { status: 500 }
    );
  }
}
