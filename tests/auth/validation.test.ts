import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

describe("auth validation", () => {
  const validUser = { username: "alice", email: "a@b.com", password: "12345678" };

  it("register accepts a valid username, email and 8+ char password", () => {
    expect(registerSchema.safeParse(validUser).success).toBe(true);
  });

  it("register trims and lowercases the email", () => {
    const r = registerSchema.safeParse({ ...validUser, email: "  User@Example.COM  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("user@example.com");
  });

  it("register trims the username", () => {
    const r = registerSchema.safeParse({ ...validUser, username: "  alice  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBe("alice");
  });

  it("register rejects a short password", () => {
    expect(registerSchema.safeParse({ ...validUser, password: "1234567" }).success).toBe(false);
  });

  it("register rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...validUser, email: "not-an-email" }).success).toBe(false);
  });

  it("register rejects a password over 72 characters", () => {
    expect(registerSchema.safeParse({ ...validUser, password: "x".repeat(73) }).success).toBe(
      false,
    );
  });

  it("register rejects a username shorter than 3 characters", () => {
    expect(registerSchema.safeParse({ ...validUser, username: "ab" }).success).toBe(false);
  });

  it("register rejects a username over 20 characters", () => {
    expect(registerSchema.safeParse({ ...validUser, username: "x".repeat(21) }).success).toBe(
      false,
    );
  });

  it("register rejects a username with invalid characters", () => {
    expect(registerSchema.safeParse({ ...validUser, username: "alice doe" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validUser, username: "alice!" }).success).toBe(false);
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
