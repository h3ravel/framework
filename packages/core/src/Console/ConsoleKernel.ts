import { Application } from "../Application";
import { Logger } from "@h3ravel/shared";
import { XGeneric } from "@h3ravel/support";
import { mkdir } from "node:fs/promises";

export class ConsoleKernel {
    public cwd!: string
    public output = typeof Logger
    public basePath: string = ''
    public modulePath!: string
    public consolePath!: string
    public modulePackage!: XGeneric<{ version: string }>
    public consolePackage!: XGeneric<{ version: string }>

    constructor(public app: Application) { }

    async ensureDirectoryExists (dir: string) {
        await mkdir(dir, { recursive: true })
    }
}
