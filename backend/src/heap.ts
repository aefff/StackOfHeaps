export class TaskHeap {
    public heap: Task[];

    constructor() {
        this.heap = [];
    }

    add(newTask: Task) {
        this.heap.push(newTask);

        if (this.heap.length > 1) {
            this.swap(this.heap.length - 1, newTask);
        }
    }

    extract() {
        if (this.heap.length === 0) { return undefined; }

        if (this.heap.length === 1) {return this.heap.pop(); }

        let maxTask = this.heap[0];
        this.heap[0] = <Task>this.heap.pop();

        this.antiSwap(0);

        return maxTask;
    }

    swap(i: number, newTask: Task) {
        if (i > 0) {
            let parent: number = Math.floor((i - 1) / 2);
            if (this.heap[parent].priority < newTask.priority) {
                [this.heap[parent], this.heap[i]] =
                    [newTask, this.heap[parent]];
                this.swap(parent, newTask);
            }
        }
    }

    antiSwap(i: number) {
        let leftChild = 2 * i + 1;
        let rightChild = 2 * i + 2;

        let largest = i;

        if (leftChild < this.heap.length && this.heap[leftChild].priority > this.heap[largest].priority) {
            largest = leftChild;
        }

        if (rightChild < this.heap.length && this.heap[rightChild].priority > this.heap[largest].priority) {
            largest = rightChild;
        }

        if (largest !== i) {
            this.transfer(i, largest);

            this.antiSwap(largest);
        }
    }

    transfer(i1: number, i2: number) {
        [this.heap[i1], this.heap[i2]] =
            [this.heap[i2], this.heap[i1]];
    }
}

interface Task {
    name: string;
    priority: number;
}