import {describe, it, expect} from 'vitest';

import {TaskHeap} from "../heap.js";

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
        heap.add({ name: 'Database emergency', priority: 2 });

        heap.updatePriority('Database emergency', 99);

        const topTask = heap.extract();
        expect(topTask?.name).toBe('Database emergency');
        expect(topTask?.priority).toBe(99);
    });

    describe('Task Heap - Deletion Operations', () => {

        it('Should delete a leaf task (bottom of the tree) cleanly', () => {
            const heap = new TaskHeap();
            heap.add({ name: 'Root Task', priority: 100 });
            heap.add({ name: 'Leaf Left', priority: 50 });
            heap.add({ name: 'Leaf Right', priority: 40 });

            heap.delete('Leaf Right');

            expect(heap.heap.length).toBe(2);
            expect(heap.heap[0].name).toBe('Root Task');
            expect(heap.heap.find(t => t.name === 'Leaf Right')).toBeUndefined();
        });

        it('Should delete an internal branch task and trigger an antiSwap (sink down)', () => {
            const heap = new TaskHeap();

            heap.add({ name: 'Root', priority: 100 });
            heap.add({ name: 'Branch A', priority: 90 });
            heap.add({ name: 'Branch B', priority: 20 });
            heap.add({ name: 'Leaf A1', priority: 80 });
            heap.add({ name: 'Leaf A2', priority: 70 });
            heap.add({ name: 'Leaf B1', priority: 15 });

            heap.delete('Branch A');

            expect(heap.heap.length).toBe(5);
            expect(heap.heap[1].priority).toBe(80);
            expect(heap.heap.find(t => t.name === 'Branch A')).toBeUndefined();
        });

        it('Should completely remove the task from the internal indexMap on deletion', () => {
            const heap = new TaskHeap();
            heap.add({ name: 'Discard Job', priority: 5 });

            heap.delete('Discard Job');
            const internalMap = (heap as any).indexMap;
            expect(internalMap['Discard Job']).toBeUndefined();
        });
    });
});