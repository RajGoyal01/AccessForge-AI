import { mkdir, readFile } from "node:fs/promises"; import path from "node:path"; import { AppError } from "./errors";
const workspaceRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), "../..");
export const storageRoot = path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_ROOT || path.join(workspaceRoot, "storage"));
export function safeFileName(value: string){return value.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"artifact"}
export async function createScreenshotPath(scanId:string){const dir=path.join(storageRoot,"screenshots");await mkdir(dir,{recursive:true});const fileName=`${safeFileName(scanId)}-${Date.now()}.png`;return {absolutePath:path.join(dir,fileName),storagePath:`screenshots/${fileName}`,fileName}}
export async function readScreenshot(fileName:string){if(fileName!==path.basename(fileName)||!fileName.endsWith(".png"))throw new AppError("FORBIDDEN","Invalid screenshot path.",403);return readFile(path.join(storageRoot,"screenshots",fileName))}
