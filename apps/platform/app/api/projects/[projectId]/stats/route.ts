import{projectService}from"@/lib/db/services/projects";import{AppError,errorResponse}from"@/lib/errors";
export async function GET(_:Request,{params}:{params:Promise<{projectId:string}>}){try{const stats=await projectService.stats((await params).projectId);if(!stats)throw new AppError("NOT_FOUND","Project not found.",404);return Response.json({stats})}catch(error){return errorResponse(error)}}
