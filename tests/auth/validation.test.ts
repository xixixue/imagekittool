import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

describe("auth validation", () => {
  it("register accepts a valid email and 8+ char password", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
  });

  it("register trims and lowercases the email", () => {
    const r = registerSchema.safeParse({ email: "  User@Example.COM  ", password: "12345678" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("user@example.com");
  });

  it("register rejects a short password", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "1234567" }).success).toBe(false);
  });

  it("register rejects an invalid email", () => {
    expect(registerSchema.safeParse({ email: "not-an-email", password: "12345678" }).success).toBe(
      false,
    );
  });

  it("register rejects a password over 72 characters", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "x".repeat(73) }).success).toBe(
      false,
    );
  });

  it("login requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("forgot-password validates the email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("reset-password requires a token and an 8+ char password", () => {
    expect(resetPasswordSchema.safeParse({ token: "t", password: "123" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "t", password: "12345678" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", password: "12345678" }).success).toBe(false);
  });
});
