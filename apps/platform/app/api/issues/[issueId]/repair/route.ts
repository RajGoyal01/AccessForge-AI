import{generateRepair}from"@/lib/repair/service";import{errorResponse}from"@/lib/errors";
export async function POST(_:Request,{params}:{params:Promise<{issueId:string}>}){try{return Response.json({repair:await generateRepair((await params).issueId)},{status:201})}catch(error){return errorResponse(error)}}
