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

    public static fromRawStack(raw: snapStack): HeapStack {
        const newStack = new HeapStack(raw.id);
        for (const h of raw.contents) {
            newStack.pushStack(h.name, TaskHeap.fromRawHeap(h.heap));
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