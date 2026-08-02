import{startProjectScan}from"@/lib/scans/orchestrator";import{db}from"@/lib/db/client";import{errorResponse}from"@/lib/errors";
export async function GET(_:Request,{params}:{params:Promise<{projectId:string}>}){return Response.json({scans:await db.scan.findMany({where:{projectId:(await params).projectId},orderBy:{startedAt:"desc"},take:25})})}
export async function POST(_:Request,{params}:{params:Promise<{projectId:string}>}){try{return Response.json({scan:await startProjectScan((await params).projectId)},{status:201})}catch(error){return errorResponse(error)}}
