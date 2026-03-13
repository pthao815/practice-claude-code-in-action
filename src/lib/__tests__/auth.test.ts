// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

const { createSession } = await import("../auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie named auth-token", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
});

test("createSession sets sameSite lax and path /", async () => {
  await createSession("user-1", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets a cookie expiry roughly 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expires: Date = options.expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession token contains correct userId and email", async () => {
  await createSession("user-42", "hello@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession token is signed with HS256", async () => {
  await createSession("user-1", "test@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { protectedHeader } = await jwtVerify(token, JWT_SECRET);

  expect(protectedHeader.alg).toBe("HS256");
});

test("createSession token expires in 7 days", async () => {
  const before = Math.floor(Date.now() / 1000);
  await createSession("user-1", "test@example.com");
  const after = Math.floor(Date.now() / 1000);

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const sevenDaysSec = 7 * 24 * 60 * 60;
  expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDaysSec - 1);
  expect(payload.exp).toBeLessThanOrEqual(after + sevenDaysSec + 1);
});
