import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUserRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ ...data, userId: 1 })),
      save: vi.fn((data) => Promise.resolve({ ...data, userId: 1 })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockJwtService = {
      sign: vi.fn(() => 'mock_token_xyz'),
      verify: vi.fn(),
    };

    authService = new AuthService(mockUserRepo, mockJwtService);
  });

  it('should successfully register a user and generate tokens', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    const result = await authService.register({
      firstName: 'Clark',
      lastName: 'Kent',
      email: 'clark@dailyplanet.com',
      password: 'Password@123',
    });

    expect(result.accessToken).toBe('mock_token_xyz');
    expect(result.refreshToken).toBe('mock_token_xyz');
    expect(result.user.email).toBe('clark@dailyplanet.com');
    expect(result.user.roleName).toBe('MEMBER');
  });

  it('should successfully login an existing user with valid password', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    mockUserRepo.findOne.mockResolvedValue({
      userId: 3,
      email: 'hlahla@gmail.com',
      firstName: 'Hla',
      lastName: 'Hla',
      passwordHash,
      roleId: 3,
      membershipNo: 'MEM001',
      status: 'ACTIVE',
    });

    const result = await authService.login({
      email: 'hlahla@gmail.com',
      password: 'Password@123',
    });

    expect(result.accessToken).toBe('mock_token_xyz');
    expect(result.user.name).toBe('Hla Hla');
  });

  it('should reject login with wrong password', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123', 10);
    mockUserRepo.findOne.mockResolvedValue({
      userId: 3,
      email: 'hlahla@gmail.com',
      passwordHash,
    });

    await expect(
      authService.login({
        email: 'hlahla@gmail.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow('Invalid email or password');
  });
});
