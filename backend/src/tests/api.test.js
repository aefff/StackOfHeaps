import { describe, test, expect, afterAll } from 'vitest';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

require('dotenv').config();

const { Pool } = require('pg');
const BASE_URL = 'http://localhost:3000/api';

const isTest = process.env.NODE_ENV === 'test';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: isTest ? process.env.TEST_DB_PORT : process.env.DB_PORT,
    user: isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
    password: isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
    database: isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME,
});

describe('StackOHeaps API Integration Tests', () => {

    afterAll(async () => {
        console.log('\nCleaning up test database records...');
        try {
            await pool.query('TRUNCATE TABLE users, projects RESTART IDENTITY CASCADE;');
            console.log('Test database cleaned successfully.');
        } catch (err) {
            console.error('Failed to clean up database:', err.message);
        } finally {
            await pool.end();
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

    test('POST /api/auth/login should log in the user', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUser,
                password: 'test_secure_password'
            })
        })

        expect(res.status).toBe(200);
    });

    test('POST /api/auth/login should fail for incorrect password', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
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