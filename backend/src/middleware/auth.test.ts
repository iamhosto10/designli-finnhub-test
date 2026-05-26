import { describe, it, expect, vi, beforeEach } from "vitest";
import { authMiddleware } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

// ─── Mocks ────────────────────────────────────────────────────────────────────

/**
 * Creates a mock Express Request object with optional headers.
 */
const mockRequest = (headers: Record<string, string> = {}) =>
  ({ headers }) as any;

/**
 * Creates a mock Express Response with chainable status/json methods.
 */
const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test_secret";
  });

  it("should return 401 if no Authorization header is provided", () => {
    const req = mockRequest();
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized: no token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header does not start with Bearer", () => {
    const req = mockRequest({ authorization: "Basic sometoken" });
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized: no token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if token is invalid", () => {
    const req = mockRequest({ authorization: "Bearer invalidtoken123" });
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized: invalid or expired token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if token is expired", () => {
    // Sign a token that expired 1 second ago
    const expiredToken = jwt.sign({ userId: "user123" }, "test_secret", {
      expiresIn: -1,
    });

    const req = mockRequest({ authorization: `Bearer ${expiredToken}` });
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized: invalid or expired token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() and attach user to req if token is valid", () => {
    const validToken = jwt.sign({ userId: "user123" }, "test_secret", {
      expiresIn: "1h",
    });

    const req = mockRequest({ authorization: `Bearer ${validToken}` });
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();
    expect(req.user).toEqual(expect.objectContaining({ userId: "user123" }));
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 if token was signed with a different secret", () => {
    const tokenWithWrongSecret = jwt.sign(
      { userId: "user123" },
      "wrong_secret",
      { expiresIn: "1h" },
    );

    const req = mockRequest({
      authorization: `Bearer ${tokenWithWrongSecret}`,
    });
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
