import{readScreenshot}from"@/lib/storage";import{errorResponse}from"@/lib/errors";
export async function GET(_:Request,{params}:{params:Promise<{fileName:string}>}){try{const data=await readScreenshot((await params).fileName);return new Response(data,{headers:{"content-type":"image/png","cache-control":"private, max-age=60"}})}catch(error){return errorResponse(error)}}
