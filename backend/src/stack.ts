import {TaskHeap} from "./heap.js";

export class HeapStack {
    public stack: stackMember[];

    constructor() {
        this.stack = [];
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