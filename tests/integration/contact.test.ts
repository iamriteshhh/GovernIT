import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as contactHandler } from "@/app/api/contact/route";
import { contactRateLimiter } from "@/server/auth/rate-limiter";

describe("Contact & Grievance API Endpoint", () => {
  beforeEach(() => {
    contactRateLimiter.reset();
  });

  it("rejects invalid email address", async () => {
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        subject: "editorial-correction",
        message: "This is a detailed valid message for testing purposes.",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid email/i);
  });

  it("rejects message that is too short", async () => {
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "user@example.com",
        subject: "editorial-correction",
        message: "short",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/at least 10 characters/i);
  });

  it("traps bot submissions using honeypot without error feedback", async () => {
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Spam Bot",
        email: "spambot@example.com",
        subject: "commercial-spam",
        message: "Buy cheap products at this url http://spam.example",
        website_hp: "http://bot-trap.com",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.ticketId).toBe("GRIEV-HP-TRAP");
  });

  it("rejects fast submissions submitted in under 2 seconds", async () => {
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Human User",
        email: "user@example.com",
        subject: "editorial-correction",
        message: "Notification corrigendum indicates new deadline for UPSC CSE.",
        renderedAt: Date.now() - 500, // 500ms ago
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/too quickly/i);
  });

  it("successfully processes valid submission and returns ticket ID", async () => {
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Pooja Sharma",
        email: "pooja.sharma@example.com",
        subject: "editorial-correction",
        opportunityName: "UPSC Civil Services 2026",
        message: "The official notification revised the photo upload specification in Corrigendum 2.",
        renderedAt: Date.now() - 5000, // 5s ago
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.ticketId).toMatch(/^GRIEV-/);
  });
});
