import{getIssueSourceContext}from"@/lib/source-mapping/service";import{errorResponse}from"@/lib/errors";
export async function GET(_:Request,{params}:{params:Promise<{issueId:string}>}){try{return Response.json({source:await getIssueSourceContext((await params).issueId)})}catch(error){return errorResponse(error)}}
