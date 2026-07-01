import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import * as fs from 'fs/promises';
import { Pool } from 'pg';
import { app } from '../server.js';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.NODE_ENV === 'test' ? Number(process.env.TEST_DB_PORT) : Number(process.env.DB_PORT),
    user: process.env.NODE_ENV === 'test' ? process.env.TEST_DB_USER : process.env.DB_USER,
    password: process.env.NODE_ENV === 'test' ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
    database: process.env.NODE_ENV === 'test' ? process.env.TEST_DB_NAME : process.env.DB_NAME,
});

const BASE_URL = 'http://localhost:3000/api';
let runningServer: any;

describe('StackOHeaps API Integration Tests', () => {

    beforeAll(async () => {
        runningServer = app.listen(3000);
    });

    afterAll(async () => {
        console.log('\nCleaning up test database records and files...');
        try {
            await pool.query('TRUNCATE TABLE users, projects RESTART IDENTITY CASCADE;');
            await fs.rm('./storage', { recursive: true, force: true });
            console.log('Test environment cleaned successfully.');
        } catch (err: any) {
            console.error('Failed to clean up:', err.message);
        } finally {
            await pool.end();
            if (runningServer) {
                await runningServer.close();
            }
        }
    });

    test('GET /api/test should return status 200', async () => {
        const res = await fetch(`${BASE_URL}/test`);
        expect(res.status).toBe(200);
    });

    const randomUser = `user_${Math.floor(Math.random() * 10000)}`;

    test('POST /api/auth/register should create a new user', async () => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });
        const data = await res.json();
        expect(res.status).toBe(201);
        expect(data.user.username).toBe(randomUser);
    });

    test('POST /api/auth/register should fail for duplicate username', async () => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'different_password' })
        });
        expect(res.status).toBe(409);
    });

    test('POST /api/auth/login should log in the user', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });
        expect(res.status).toBe(200);
    });

    test('POST /api/auth/login should fail for incorrect password', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'different_password' })
        });
        expect(res.status).toBe(400);
    });

    test('POST /api/projects should successfully create a project record and save file', async () => {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });
        const { token } = await loginRes.json();

        const mockStackPayload = {
            projectName: "My First Test Heap",
            stackId: "abc-123-xyz",
            rawStackData: {
                id: "abc-123-xyz",
                size: 1,
                stack: [
                    {
                        name: "Backend System",
                        heap: {
                            heap: [{ name: "High Priority task", priority: 100 }]
                        }
                    }
                ]
            }
        };

        const res = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mockStackPayload)
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.message).toContain("Project created and stack saved successfully");
        expect(data.project.project_name).toBe("My First Test Heap");

        (global as any).testProjectId = data.project.id;
    });

    test('GET /api/projects/:id/stream should stream back the correct payload from disk', async () => {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });
        const { token } = await loginRes.json();
        const projectId = (global as any).testProjectId;

        const res = await fetch(`${BASE_URL}/projects/${projectId}/stream`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        expect(res.status).toBe(200);

        const streamedData = await res.json();
        expect(streamedData.id).toBe("abc-123-xyz");
        expect(streamedData.stack[0].name).toBe("Backend System");
    });

    test('DELETE /api/auth/deleteAccount should fail with incorrect password', async () => {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });
        const { token } = await loginRes.json();

        const res = await fetch(`${BASE_URL}/auth/deleteAccount`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: randomUser, password: 'wrong_password_here' })
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Incorrect password");
    });

    test('DELETE /api/auth/deleteAccount should completely wipe the user record', async () => {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });
        const { token } = await loginRes.json();

        const res = await fetch(`${BASE_URL}/auth/deleteAccount`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });

        expect(res.status).toBe(200);

        const verifyRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: randomUser, password: 'test_secure_password' })
        });

        expect(verifyRes.status).toBe(400);
    });
});