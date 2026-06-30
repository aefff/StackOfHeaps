const BASE_URL = 'http://localhost:3000/api';

async function test(description, testFunction) {
    try {
        await testFunction();
        console.log(`PASSED: ${description}`);
    } catch (error) {
        console.error(`FAILED: ${description}`);
        console.error(`Reason: ${error.message}\n`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message} (Expected ${expected}, but got ${actual})`);
    }
}

async function runAllTests() {
    console.log('Running API Integration Tests...\n');

    await test('GET /api/test should return status 200', async () => {
        const res = await fetch(`${BASE_URL}/test`);
        assertEqual(res.status, 200, 'Status code mismatch');
    });

    const randomUser = `user_${Math.floor(Math.random() * 10000)}`;

    await test('POST /api/auth/register should create a new user', async () => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUser,
                password: 'test_secure_password'
            })
        });

        const data = await res.json();

        assertEqual(res.status, 201, 'Status should be 201 Created');
        assertEqual(data.user.username, randomUser, 'Returned username mismatch');
    });

    await test('POST /api/auth/register should fail for duplicate username', async () => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: randomUser,
                password: 'different_password'
            })
        });

        assertEqual(res.status, 409, 'Status should be 409 Conflict');
    });

    console.log('\n🏁 All tests completed.');
}

runAllTests();