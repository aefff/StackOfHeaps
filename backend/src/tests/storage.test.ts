import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { StorageHandler } from '../utils/storage.js';
import { HeapStack } from '../utils/stack.js';
import { TaskHeap } from '../utils/heap.js';

describe('StorageHandler - Integration Tests', () => {
    const TEST_DIR = './test_storage';
    const MOCK_UID = 'test-user-uuid-123';
    let handler: StorageHandler;

    beforeEach(async () => {
        handler = new StorageHandler(TEST_DIR);
    });

    afterEach(async () => {
        try {
            await fs.rm(TEST_DIR, { recursive: true, force: true });
        } catch (e) {
        }
    });

    it('Should save a live stack, create the target directory, and write to disk', async () => {
        const stack = new HeapStack();
        const heap = new TaskHeap();
        heap.add({ name: 'Verify File IO', priority: 10 });
        stack.pushStack('QA Layer', heap);

        await handler.storeNewRecord(stack, MOCK_UID);

        const expectedPath = `${TEST_DIR}/stack_${stack.id}.json`;
        const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false);

        expect(fileExists).toBe(true);
    });

    it('Should execute a complete round-trip (Save -> Load) and maintain deep class method functionality', async () => {
        const originalStack = new HeapStack();
        const backendHeap = new TaskHeap();

        backendHeap.add({ name: 'Low Priority task', priority: 1 });
        backendHeap.add({ name: 'High Priority task', priority: 100 });

        originalStack.pushStack('Backend System', backendHeap);

        await handler.storeNewRecord(originalStack, MOCK_UID);

        const loadedStack = await handler.retrieveRecord(originalStack.id, MOCK_UID);

        expect(loadedStack.id).toBe(originalStack.id);
        expect(loadedStack.size).toBe(1);
        expect(loadedStack.stack[0].name).toBe('Backend System');

        const highestPriority = loadedStack.stack[0].heap.extract();
        expect(highestPriority?.name).toBe('High Priority task');
    });

    it('Should throw a descriptive domain error when trying to fetch a non-existent ID', async () => {
        // Act & Assert: We expect a rejection that matches our custom error signature
        await expect(handler.retrieveRecord('fake-id-123', MOCK_UID)).rejects.toThrowError(
            'Record not found: No file exists for stack ID fake-id-123'
        );
    });
});