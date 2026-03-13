import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([]);
  vi.mocked(createProject).mockResolvedValue({ id: "new-project-id" } as any);
});

// --- signIn ---

test("signIn returns success result and navigates after successful sign-in", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getProjects).mockResolvedValue([{ id: "project-1" } as any]);

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("user@example.com", "password123");
  });

  expect(returnValue).toEqual({ success: true });
  expect(mockPush).toHaveBeenCalledWith("/project-1");
});

test("signIn returns error result and does not navigate on failure", async () => {
  vi.mocked(signInAction).mockResolvedValue({
    success: false,
    error: "Invalid credentials",
  });

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("user@example.com", "wrong");
  });

  expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  expect(mockPush).not.toHaveBeenCalled();
});

test("signIn sets isLoading to true during the call and false after", async () => {
  let resolveAction!: (v: any) => void;
  vi.mocked(signInAction).mockReturnValue(
    new Promise((res) => { resolveAction = res; })
  );
  vi.mocked(getProjects).mockResolvedValue([]);

  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);

  let promise: Promise<any>;
  act(() => {
    promise = result.current.signIn("user@example.com", "password123");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveAction({ success: true });
    await promise;
  });

  expect(result.current.isLoading).toBe(false);
});

test("signIn resets isLoading to false even when the action throws", async () => {
  vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123").catch(() => {});
  });

  expect(result.current.isLoading).toBe(false);
});

// --- signUp ---

test("signUp returns success result and navigates after successful sign-up", async () => {
  vi.mocked(signUpAction).mockResolvedValue({ success: true });
  vi.mocked(getProjects).mockResolvedValue([{ id: "project-42" } as any]);

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("new@example.com", "password123");
  });

  expect(returnValue).toEqual({ success: true });
  expect(mockPush).toHaveBeenCalledWith("/project-42");
});

test("signUp returns error result and does not navigate on failure", async () => {
  vi.mocked(signUpAction).mockResolvedValue({
    success: false,
    error: "Email already registered",
  });

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("taken@example.com", "password123");
  });

  expect(returnValue).toEqual({ success: false, error: "Email already registered" });
  expect(mockPush).not.toHaveBeenCalled();
});

test("signUp sets isLoading during the call and clears it after", async () => {
  let resolveAction!: (v: any) => void;
  vi.mocked(signUpAction).mockReturnValue(
    new Promise((res) => { resolveAction = res; })
  );
  vi.mocked(getProjects).mockResolvedValue([]);

  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);

  let promise: Promise<any>;
  act(() => {
    promise = result.current.signUp("new@example.com", "password123");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveAction({ success: true });
    await promise;
  });

  expect(result.current.isLoading).toBe(false);
});

// --- post sign-in navigation logic ---

test("navigates to existing project when user has projects and no anon work", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([
    { id: "recent-project" } as any,
    { id: "older-project" } as any,
  ]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(mockPush).toHaveBeenCalledWith("/recent-project");
  expect(createProject).not.toHaveBeenCalled();
});

test("creates a new project and navigates to it when user has no projects and no anon work", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([]);
  vi.mocked(createProject).mockResolvedValue({ id: "fresh-project" } as any);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/fresh-project");
});

test("saves anon work as a project when anon messages exist, clears storage, and navigates", async () => {
  const anonMessages = [{ role: "user", content: "make a button" }];
  const anonFsData = { "/App.jsx": { type: "file", content: "export default () => <button />" } };

  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue({
    messages: anonMessages,
    fileSystemData: anonFsData,
  });
  vi.mocked(createProject).mockResolvedValue({ id: "anon-project" } as any);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: anonMessages,
      data: anonFsData,
    })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(getProjects).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/anon-project");
});

test("does not save anon work when anon data exists but messages array is empty", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue({
    messages: [],
    fileSystemData: { "/": { type: "directory" } },
  });
  vi.mocked(getProjects).mockResolvedValue([{ id: "existing-project" } as any]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(createProject).not.toHaveBeenCalled();
  expect(clearAnonWork).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/existing-project");
});
