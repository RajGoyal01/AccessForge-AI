import{approveAndApply}from"@/lib/repair/service";import{errorResponse}from"@/lib/errors";
export async function POST(_:Request,{params}:{params:Promise<{repairId:string}>}){try{return Response.json({repair:await approveAndApply((await params).repairId)})}catch(error){return errorResponse(error)}}
