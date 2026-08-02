import{evaluateRepair}from"@/lib/evaluation/service";import{errorResponse}from"@/lib/errors";
export async function POST(_:Request,{params}:{params:Promise<{repairId:string}>}){try{return Response.json({evaluation:await evaluateRepair((await params).repairId)})}catch(error){return errorResponse(error)}}
