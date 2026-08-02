import { z } from "zod";
export const projectRequestSchema=z.discriminatedUnion("projectType",[
  z.object({name:z.string().trim().min(2).max(120),description:z.string().trim().max(2000).optional(),projectType:z.literal("BUNDLED_DEMO")}),
  z.object({name:z.string().trim().min(2).max(120),description:z.string().trim().max(2000).optional(),projectType:z.literal("EXTERNAL_AUDIT"),targetUrl:z.url()})
]);
export const projectUpdateSchema=z.object({name:z.string().trim().min(2).max(120).optional(),description:z.string().trim().max(2000).nullable().optional(),targetUrl:z.url().optional()}).strict();
