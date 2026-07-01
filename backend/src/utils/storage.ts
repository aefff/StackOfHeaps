import * as fs from "fs/promises";
import { HeapStack } from "./stack.js";
import {LockManager} from "./lockManager.js";

export class StorageHandler {
    private readonly storageDir: string;

    private storageLockHandler = new Map<string, LockManager>();

    constructor(storageDir: string = "./storage") {
        this.storageDir = storageDir;
    }

    private getFilePath(id: string): string {
        return `${this.storageDir}/stack_${id}.json`;
    }

    private async ensureDirectoryExists(): Promise<void> {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch (e) {
            console.error("Failed to create storage directory:", e);
            throw e;
        }
    }

    public async storeNewRecord(stack: HeapStack, requesterUUID: string): Promise<void> {
        const filename = this.getFilePath(stack.id);

        if (!this.storageLockHandler.has(stack.id)) {
            this.storageLockHandler.set(stack.id, new LockManager(stack.id));
        }

        const serializedData = JSON.stringify(stack.exportRawStack(), null, 2);
        const lock: LockManager = this.storageLockHandler.get(stack.id)!;

        await lock.acquireWrite(requesterUUID);

        try {
            await this.ensureDirectoryExists();
            await fs.writeFile(filename, serializedData, "utf8");
        } catch (e) {
            console.error(`Error saving record for stack ID ${stack.id}: `, e);
        } finally {
            lock.releaseWrite(requesterUUID);
        }
    }

    public async retrieveRecord(id: string, requesterUUID: string): Promise<HeapStack> {
        const filename = this.getFilePath(id);

        if (!this.storageLockHandler.has(id)) {
            this.storageLockHandler.set(id, new LockManager(id));
        }

        const lock: LockManager = this.storageLockHandler.get(id)!;
        await lock.acquireRead(requesterUUID);

        try {
            await this.ensureDirectoryExists();
            const rawData = await fs.readFile(filename, "utf8");

            return HeapStack.fromRawStack(JSON.parse(rawData));
        } catch (e: any) {
            if (e.code === "ENOENT") {
                console.error(`Record not found: No file exists for id: `, id);
                throw new Error(`Record not found: No file exists for stack ID ${id}`);
            } else {
                console.error(`Error retrieving record for stack ID ${id}:`, e);
                throw new Error("Issue reading file or processing payload data.");
            }
        } finally {
            lock.releaseRead(requesterUUID);
        }
    }
}