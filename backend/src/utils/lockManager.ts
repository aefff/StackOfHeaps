import {EventEmitter} from "node:events";

const EmitterStatus = Object.freeze({
    ReadRequest: 'ReadRequest',
    ReadRelease: 'ReadRelease',
    WriteRequest: 'WriteRequest',
    WriteRelease: 'WriteRelease',
    ReadEmpty: 'ReadEmpty',
})

export class LockManager {

    private filePath : string = "";

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    private ReadTracker = new Set<string>();
    private WriteTracker: string | null = null;

    private eventEmitter = new EventEmitter();

    async acquireRead(UUID: string): Promise<void> {
        while (this.WriteTracker !== null) {
            await new Promise((resolve) => {
                this.eventEmitter.once(EmitterStatus.WriteRelease, resolve)
            })
        }
        this.ReadTracker.add(UUID);
    }

    releaseRead(UUID: string) {
        if (this.ReadTracker.has(UUID)) {
            this.ReadTracker.delete(UUID);
        }
        if (this.ReadTracker.size === 0) {
            this.eventEmitter.emit(EmitterStatus.ReadEmpty);
        } else {
            this.eventEmitter.emit(EmitterStatus.ReadRelease);
        }
    }

    async acquireWrite(UUID: string): Promise<void> {
        while (this.WriteTracker !== null || this.ReadTracker.size !== 0) {

            const writeRelease = new Promise((resolve) => {
                this.eventEmitter.once(EmitterStatus.WriteRelease, resolve);
            })

            const readEmpty = new Promise((resolve) => {
                this.eventEmitter.once(EmitterStatus.ReadEmpty, resolve);
            })

            await Promise.race([writeRelease, readEmpty]);
        }

        this.WriteTracker = UUID;
    }

    releaseWrite(UUID: string){
        if (this.WriteTracker === UUID) {
            this.WriteTracker = null;
            this.eventEmitter.emit(EmitterStatus.WriteRelease);
        }
    }
}