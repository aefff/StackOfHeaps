import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import { StorageHandler } from '../utils/storage.js';
import { HeapStack } from '../utils/stack.js';

vi.mock('fs/promises', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs/promises')>();

    return {
        ...actual,
        writeFile: async (path: string, data: any, options: any) => {
            if (path.includes('test_concurrency_storage')) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return actual.writeFile(path, data, options);
        }
    };
});

describe('StorageHandler - Concurrency Synchronization Tests', () => {
    const TEST_DIR = './test_concurrency_storage';
    let handler: StorageHandler;

    beforeEach(async () => {
        handler = new StorageHandler(TEST_DIR);
    });

    afterEach(async () => {
        try {
            await fs.rm(TEST_DIR, { recursive: true, force: true });
        } catch (e) {}
    });

    it('Should cleanly serialize overlapping concurrent writes to the same file', async () => {
        const stack = new HeapStack();
        const executionOrder: string[] = [];

        const userA_Promise = (async () => {
            await handler.storeNewRecord(stack, 'USER_A');
            executionOrder.push('USER_A_DONE');
        })();

        await new Promise(resolve => setTimeout(resolve, 5));

        const userB_Promise = (async () => {
            await handler.storeNewRecord(stack, 'USER_B');
            executionOrder.push('USER_B_DONE');
        })();

        await Promise.all([userA_Promise, userB_Promise]);

        expect(executionOrder).toEqual(['USER_A_DONE', 'USER_B_DONE']);
    });
});