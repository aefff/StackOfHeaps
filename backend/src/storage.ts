import * as fs from "fs/promises";
import { HeapStack } from "./stack.js";

export class StorageHandler {
    private storageDir: string;

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

    public async storeNewRecord(stack: HeapStack): Promise<void> {
        try {
            await this.ensureDirectoryExists();

            const filename = this.getFilePath(stack.id);
            const serializedData = JSON.stringify(stack.exportRawStack(), null, 2);

            await fs.writeFile(filename, serializedData, "utf8");
        } catch (e) {
            console.error(`Error saving record for stack ID ${stack.id}:`, e);
            throw new Error("Failed to write data record to disk.");
        }
    }

    public async retrieveRecord(id: string): Promise<HeapStack> {
        try {
            const filename = this.getFilePath(id);
            const rawPayload = await this.loadJSON(filename);

            return HeapStack.fromRawStack(rawPayload);
        } catch (e: any) {
            if (e.code === "ENOENT") {
                throw new Error(`Record not found: No file exists for stack ID ${id}`);
            }
            console.error(`Error retrieving record for stack ID ${id}:`, e);
            throw new Error("Issue reading file or processing payload data.");
        }
    }

    private async loadJSON(filename: string): Promise<any> {
        const buffer = await fs.readFile(filename, "utf8");
        return JSON.parse(buffer);
    }
}