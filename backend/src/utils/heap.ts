export class TaskHeap {
    public heap: Task[];
    public indexMap: Record<string, number>;

    constructor() {
        this.heap = [];
        this.indexMap = {};
    }



    public exportRawHeap(): Task[] {
        return [...this.heap];
    }

    public static fromRawHeap(raw: Task[]) : TaskHeap {
        const inst = new TaskHeap();
        for (const task of raw) {
            inst.add(task);
        }

        return inst;
    }


    add(newTask: Task) {
        this.heap.push(newTask);
        this.indexMap[newTask.name] = this.heap.length - 1

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

    updatePriority(name: string, priority: number) {
        let i = this.indexMap[name];
        let oldP = this.heap[i].priority;

        if (oldP != priority) {
            this.heap[i].priority = priority;
            if (oldP < priority) {
                this.swap(i, this.heap[i]);
            } else {
                this.antiSwap(i)
            }
        }
    }

    delete(name: string): void {
        let i = this.indexMap[name];
        if (i === undefined) return; // Guard clause if task doesn't exist

        if (i === this.heap.length - 1) {
            this.heap.pop();
            delete this.indexMap[name];
            return;
        }

        let removedPriority = this.heap[i].priority;

        let movedTask = this.heap.pop()!;
        this.heap[i] = movedTask;
        this.indexMap[movedTask.name] = i;

        delete this.indexMap[name];

        if (movedTask.priority > removedPriority) {
            this.swap(i, this.heap[i]);
        } else {
            this.antiSwap(i);
        }
    }


    swap(i: number, newTask: Task) {
        if (i > 0) {
            let parent: number = Math.floor((i - 1) / 2);

            if (this.heap[parent].priority < newTask.priority) {

                this.transfer(i, parent);

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
        this.indexMap[this.heap[i1].name] = i1;
        this.indexMap[this.heap[i2].name] = i2
    }
}

export interface Task {
    name: string;
    priority: number;
}