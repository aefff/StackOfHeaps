import { describe, it, expect } from 'vitest';
import { HeapStack } from '../stack.js';
import { TaskHeap } from '../heap.js';

describe('Heap Stack - Project Layer Operations', () => {

    it('Should push and pop named layers obeying LIFO laws', () => {
        const projectStack = new HeapStack();

        const backendHeap = new TaskHeap();
        const frontendHeap = new TaskHeap();

        projectStack.pushStack('Backend API Engine', backendHeap);
        projectStack.pushStack('Frontend Web App', frontendHeap);

        expect(projectStack.size).toBe(2);

        const popped = projectStack.popStack();
        expect(popped).toBeDefined();
        expect(popped?.name).toBe('Frontend Web App');
        expect(popped?.heap).toBe(frontendHeap);
    });

    it('Should allow inserting and removing project layers out of order', () => {
        const projectStack = new HeapStack();

        const alphaHeap = new TaskHeap();
        const betaHeap = new TaskHeap();
        const gammaHeap = new TaskHeap();

        projectStack.pushStack('Alpha Project', alphaHeap);
        projectStack.pushStack('Gamma Project', gammaHeap);

        projectStack.addLayerAt(1, 'Beta Project', betaHeap);

        expect(projectStack.size).toBe(3);
        expect(projectStack.stack[1].name).toBe('Beta Project');

        projectStack.removeLayerAt(0);

        expect(projectStack.size).toBe(2);
        expect(projectStack.stack[0].name).toBe('Beta Project');
    });
});