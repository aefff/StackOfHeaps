import {TaskHeap, Task} from "./heap.js";
import { randomUUID } from "node:crypto";

export class HeapStack {
    public stack: stackMember[];
    public id : string;

    constructor(id? : string) {
        this.stack = [];
        this.id = id ?? randomUUID();
    }

    public exportRawStack(): snapStack {
        return {id: this.id, contents: this.stack.map(item => ({
            name: item.name,
            heap: item.heap.exportRawHeap()
        }))};
    }

    public static fromRawStack(raw: any): HeapStack {
        const targetId = raw.id || "unknown-id";
        const newStack = new HeapStack(targetId);

        let list: any[] = [];
        if (Array.isArray(raw)) {
            list = raw;
        } else if (raw && Array.isArray(raw.contents)) {
            list = raw.contents;
        } else if (raw && Array.isArray(raw.stack)) {
            list = raw.stack;
        }

        for (const h of list) {
            const rawHeapArray = (h.heap && Array.isArray(h.heap.heap)) ? h.heap.heap : h.heap;
            newStack.pushStack(h.name, TaskHeap.fromRawHeap(rawHeapArray || []));
        }

        return newStack;
    }

    get size() : number {
        return this.stack.length;
    }

    pushStack(name: string, heap: TaskHeap) {
        this.stack.push({name, heap});
    }

    popStack(){
        return this.stack.pop();
    }

    removeLayerAt(index: number) {
        this.stack.splice(index, 1);
    }

    addLayerAt(index: number, name: string, heap: TaskHeap) {
        this.stack.splice(index, 0, {name, heap});
    }
}

interface stackMember {
    name: string;
    heap: TaskHeap;
}

interface snapStack {
    id: string;
    contents: snapShot[];
}

interface snapShot {
    name: string;
    heap: Task[];
}