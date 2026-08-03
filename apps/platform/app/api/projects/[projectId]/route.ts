import { projectService } from "@/lib/db/services/projects";
import { AppError, errorResponse } from "@/lib/errors";
import { projectUpdateSchema } from "@/lib/projects/validation";
import { validateTargetUrl } from "@/lib/security/url-policy";
import { dispatchQueuedScan, queueProjectScan } from "@/lib/scans/orchestrator";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const project = await projectService.getById((await params).projectId);
    if (!project) throw new AppError("NOT_FOUND", "Project not found.", 404);
    return Response.json({ project });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const id = (await params).projectId;
    const current = await projectService.getById(id);
    if (!current) throw new AppError("NOT_FOUND", "Project not found.", 404);
    const parsed = projectUpdateSchema.parse(await request.json());
    let targetUrl = parsed.targetUrl;
    if (targetUrl) {
      if (current.projectType === "BUNDLED_DEMO") throw new AppError("FORBIDDEN", "NovaMart target cannot be changed.", 403);
      targetUrl = (await validateTargetUrl(targetUrl, false)).toString();
    }
    const update = {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description } : {}),
      ...(targetUrl !== undefined ? { targetUrl } : {}),
    };
    return Response.json({ project: await projectService.update(id, update) });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: Context) {
  try { return Response.json({ project: await projectService.archive((await params).projectId) }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(_: Request, { params }: Context) {
  try {
    const scan = await queueProjectScan((await params).projectId);
    dispatchQueuedScan(scan.id);
    return Response.json({ scan }, { status: 202 });
  }
  catch (error) { return errorResponse(error); }
}
