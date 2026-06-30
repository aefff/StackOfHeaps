import { describe, test, expect } from 'vitest';

const BASE_URL = 'http://localhost:3000/api';

describe('StackOHeaps API Integration Tests', () => {

    test('GET /api/test should return status 200', async () => {
        const res = await fetch(`${BASE_URL}/test`);
        expect(res.status).toBe(200);
    });

    const randomUser = `user_${Math.floor(Math.random() * 10000)}`;

    test('POST /api/auth/register should create a new user', async () => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUser,
                password: 'test_secure_password'
            })
        });

        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.user.username).toBe(randomUser);
    });

    test('POST /api/auth/register should fail for duplicate username', async () => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUser,
                password: 'different_password'
            })
        });

        expect(res.status).toBe(409);
    });
});