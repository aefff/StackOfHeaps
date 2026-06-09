import {describe, it, expect} from 'vitest';

import {TaskHeap} from "./heap.js";

describe('Task Heap Core Ops', () => {
    it('Should create a new task heap instance', () => {
        const heap = new TaskHeap();
        expect(heap.heap.length).toBe(0);
    });

    it('Should add task to implemented heap instance', () => {
        const heap = new TaskHeap();
        heap.add({name: 'test', priority: 1});
        expect(heap.heap.length).toBe(1);
        expect(heap.heap[0]).toStrictEqual({name: 'test', priority: 1});
    });

    it('Should add higher priority task correctly', () => {
        const heap = new TaskHeap();
        heap.add({name: 'test', priority: 1});
        heap.add({name: 'test', priority: 2});
        expect(heap.heap.length).toBe(2);
        expect(heap.heap[0]).toStrictEqual({name: 'test', priority: 2});
        expect(heap.heap[1]).toStrictEqual({name: 'test', priority: 1});
    });

    it('Should extract the root task and update the heap size', () => {
        const heap = new TaskHeap();
        heap.add({ name: 'Task Alpha', priority: 50 });

        const extracted = heap.extract();

        expect(extracted).toStrictEqual({ name: 'Task Alpha', priority: 50 });
        expect(heap.heap.length).toBe(0);
    });

    it('Should always extract the highest priority and re-sink the remaining items correctly', () => {
        const heap = new TaskHeap();

        heap.add({ name: 'Low', priority: 10 });
        heap.add({ name: 'Critical', priority: 99 });
        heap.add({ name: 'Medium', priority: 50 });
        heap.add({ name: 'Low-Medium', priority: 25 });

        const first = heap.extract();
        expect(first?.priority).toBe(99);

        expect(first?.name).toBe('Critical');

        const second = heap.extract();
        expect(second?.priority).toBe(50);
        expect(second?.name).toBe('Medium');
    });

    it('Should update a task priority and correctly restructure the heap', () => {
        const heap = new TaskHeap();

        heap.add({ name: 'Review logs', priority: 10 });
        heap.add({ name: 'Fix text alignment', priority: 5 });
        heap.add({ name: 'Database emergency', priority: 2 }); // Currently at the bottom

        heap.updatePriority('Database emergency', 99);

        const topTask = heap.extract();
        expect(topTask?.name).toBe('Database emergency');
        expect(topTask?.priority).toBe(99);
    });
});