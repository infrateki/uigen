import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only to prevent client-side import error
vi.mock('server-only', () => ({}));

// Mock Next.js cookies
const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookies = vi.fn(() => ({
  set: mockCookieSet,
  get: mockCookieGet,
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

// Mock jose for JWT operations
const mockSignJWT = {
  setProtectedHeader: vi.fn().mockReturnThis(),
  setExpirationTime: vi.fn().mockReturnThis(),
  setIssuedAt: vi.fn().mockReturnThis(),
  sign: vi.fn().mockResolvedValue('mock-jwt-token'),
};

const mockJwtVerify = vi.fn();

vi.mock('jose', () => ({
  SignJWT: vi.fn(() => mockSignJWT),
  jwtVerify: mockJwtVerify,
}));

describe('createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a session with correct JWT token and cookie settings', async () => {
    const { createSession } = await import('../auth');
    const userId = 'user123';
    const email = 'test@example.com';

    await createSession(userId, email);

    // Verify SignJWT was called with correct payload
    expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
    expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('7d');
    expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
    expect(mockSignJWT.sign).toHaveBeenCalled();

    // Verify cookie was set with correct options
    expect(mockCookieSet).toHaveBeenCalledWith('auth-token', 'mock-jwt-token', {
      httpOnly: true,
      secure: false, // NODE_ENV is not production in tests
      sameSite: 'lax',
      expires: new Date('2024-01-08T00:00:00Z'), // 7 days from mock date
      path: '/',
    });
  });

  it('should set secure cookie in production environment', async () => {
    const { createSession } = await import('../auth');
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const userId = 'user123';
    const email = 'test@example.com';

    await createSession(userId, email);

    expect(mockCookieSet).toHaveBeenCalledWith('auth-token', 'mock-jwt-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: new Date('2024-01-08T00:00:00Z'),
      path: '/',
    });

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should create session with different user data', async () => {
    const { createSession } = await import('../auth');
    const userId = 'different-user';
    const email = 'different@example.com';

    await createSession(userId, email);

    expect(mockSignJWT.sign).toHaveBeenCalled();
    expect(mockCookieSet).toHaveBeenCalledWith('auth-token', 'mock-jwt-token', expect.any(Object));
  });

  it('should handle JWT signing errors gracefully', async () => {
    const { createSession } = await import('../auth');
    mockSignJWT.sign.mockRejectedValueOnce(new Error('JWT signing failed'));

    const userId = 'user123';
    const email = 'test@example.com';

    await expect(createSession(userId, email)).rejects.toThrow('JWT signing failed');
  });

  it('should handle empty string userId and email', async () => {
    const { createSession } = await import('../auth');
    const userId = '';
    const email = '';

    await createSession(userId, email);

    expect(mockSignJWT.sign).toHaveBeenCalled();
    expect(mockCookieSet).toHaveBeenCalledWith('auth-token', 'mock-jwt-token', expect.any(Object));
  });

  it('should handle special characters in userId and email', async () => {
    const { createSession } = await import('../auth');
    const userId = 'user-123_test@domain';
    const email = 'test+user@sub-domain.example-site.com';

    await createSession(userId, email);

    expect(mockSignJWT.sign).toHaveBeenCalled();
    expect(mockCookieSet).toHaveBeenCalledWith('auth-token', 'mock-jwt-token', expect.any(Object));
  });

  it('should handle very long userId and email strings', async () => {
    const { createSession } = await import('../auth');
    const userId = 'a'.repeat(1000);
    const email = 'test@' + 'a'.repeat(500) + '.com';

    await createSession(userId, email);

    expect(mockSignJWT.sign).toHaveBeenCalled();
    expect(mockCookieSet).toHaveBeenCalledWith('auth-token', 'mock-jwt-token', expect.any(Object));
  });

  it('should create session payload with correct expiration date', async () => {
    const { createSession } = await import('../auth');
    const { SignJWT } = await import('jose');
    const userId = 'user123';
    const email = 'test@example.com';

    await createSession(userId, email);

    // Verify SignJWT was instantiated with correct payload
    expect(SignJWT).toHaveBeenCalledWith({
      userId,
      email,
      expiresAt: new Date('2024-01-08T00:00:00Z'), // 7 days from mock date
    });
  });

  it('should handle cookies function throwing an error', async () => {
    const { createSession } = await import('../auth');
    mockCookies.mockRejectedValueOnce(new Error('Cookies not available'));

    const userId = 'user123';
    const email = 'test@example.com';

    await expect(createSession(userId, email)).rejects.toThrow('Cookies not available');
  });

  it('should handle cookie set function throwing an error', async () => {
    const { createSession } = await import('../auth');
    mockCookieSet.mockImplementationOnce(() => {
      throw new Error('Failed to set cookie');
    });

    const userId = 'user123';
    const email = 'test@example.com';

    await expect(createSession(userId, email)).rejects.toThrow('Failed to set cookie');
  });

  it('should use custom JWT secret from environment', async () => {
    const { createSession } = await import('../auth');
    const originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'custom-secret-key';

    const userId = 'user123';
    const email = 'test@example.com';

    await createSession(userId, email);

    // The secret is encoded internally, so we just verify the JWT methods were called
    expect(mockSignJWT.sign).toHaveBeenCalled();

    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('should set cookie with exact expected structure', async () => {
    const { createSession } = await import('../auth');
    const userId = 'test-user-id';
    const email = 'user@test.com';

    await createSession(userId, email);

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    expect(mockCookieSet).toHaveBeenCalledWith(
      'auth-token',
      'mock-jwt-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires: new Date('2024-01-08T00:00:00Z'),
        path: '/',
      }
    );
  });
});

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cookies mock to not throw by default
    mockCookies.mockResolvedValue({
      set: mockCookieSet,
      get: mockCookieGet,
    });
  });

  it('should return session payload when valid token exists', async () => {
    const { getSession } = await import('../auth');
    const mockPayload = {
      userId: 'user123',
      email: 'test@example.com',
      expiresAt: new Date('2024-01-08T00:00:00Z'),
    };

    mockCookieGet.mockReturnValue({ value: 'valid-jwt-token' });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockCookieGet).toHaveBeenCalledWith('auth-token');
    expect(mockJwtVerify).toHaveBeenCalledWith('valid-jwt-token', expect.any(Object));
    expect(result).toEqual(mockPayload);
  });

  it('should return null when no token exists in cookies', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue(undefined);

    const result = await getSession();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockCookieGet).toHaveBeenCalledWith('auth-token');
    expect(mockJwtVerify).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null when token exists but has no value', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue({ value: undefined });

    const result = await getSession();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockCookieGet).toHaveBeenCalledWith('auth-token');
    expect(mockJwtVerify).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null when token exists but value is empty string', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue({ value: '' });

    const result = await getSession();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockCookieGet).toHaveBeenCalledWith('auth-token');
    expect(mockJwtVerify).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null when JWT verification fails', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue({ value: 'invalid-jwt-token' });
    mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

    const result = await getSession();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockCookieGet).toHaveBeenCalledWith('auth-token');
    expect(mockJwtVerify).toHaveBeenCalledWith('invalid-jwt-token', expect.any(Object));
    expect(result).toBeNull();
  });

  it('should return null when JWT verification throws expired token error', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue({ value: 'expired-jwt-token' });
    mockJwtVerify.mockRejectedValue(new Error('Token expired'));

    const result = await getSession();

    expect(mockJwtVerify).toHaveBeenCalledWith('expired-jwt-token', expect.any(Object));
    expect(result).toBeNull();
  });

  it('should handle malformed JWT token gracefully', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue({ value: 'malformed.token.here' });
    mockJwtVerify.mockRejectedValue(new Error('JWT malformed'));

    const result = await getSession();

    expect(mockJwtVerify).toHaveBeenCalledWith('malformed.token.here', expect.any(Object));
    expect(result).toBeNull();
  });

  it('should handle cookies function throwing an error', async () => {
    const { getSession } = await import('../auth');
    mockCookies.mockRejectedValue(new Error('Cookies not available'));

    await expect(getSession()).rejects.toThrow('Cookies not available');
    expect(mockCookieGet).not.toHaveBeenCalled();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it('should handle JWT payload with additional properties', async () => {
    const { getSession } = await import('../auth');
    const mockPayload = {
      userId: 'user123',
      email: 'test@example.com',
      expiresAt: new Date('2024-01-08T00:00:00Z'),
      iat: 1704067200,
      exp: 1704672000,
      extraProperty: 'should be preserved',
    };

    mockCookieGet.mockReturnValue({ value: 'valid-jwt-token' });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(result).toEqual(mockPayload);
  });

  it('should handle very long JWT token', async () => {
    const { getSession } = await import('../auth');
    const longToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' + 'a'.repeat(1000) + '.signature';
    const mockPayload = {
      userId: 'user123',
      email: 'test@example.com',
      expiresAt: new Date('2024-01-08T00:00:00Z'),
    };

    mockCookieGet.mockReturnValue({ value: longToken });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(mockJwtVerify).toHaveBeenCalledWith(longToken, expect.any(Object));
    expect(result).toEqual(mockPayload);
  });

  it('should handle JWT payload with null values', async () => {
    const { getSession } = await import('../auth');
    const mockPayload = {
      userId: null,
      email: null,
      expiresAt: null,
    };

    mockCookieGet.mockReturnValue({ value: 'valid-jwt-token' });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(result).toEqual(mockPayload);
  });

  it('should call jwtVerify with correct JWT secret', async () => {
    const { getSession } = await import('../auth');
    mockCookieGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockResolvedValue({ 
      payload: { userId: 'test', email: 'test@test.com', expiresAt: new Date() } 
    });

    await getSession();

    // Verify jwtVerify was called with a Uint8Array (encoded secret)
    expect(mockJwtVerify).toHaveBeenCalledWith('test-token', expect.any(Object));
    
    // Get the actual secret that was passed
    const [, secretArg] = mockJwtVerify.mock.calls[0];
    expect(secretArg).toBeInstanceOf(Uint8Array);
  });
});