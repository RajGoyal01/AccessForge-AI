import { resolveTemporaryResponse } from "@/lib/backend-lab/service";
import { errorResponse } from "@/lib/errors";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "no-store",
};

async function respond(method: "GET" | "POST", params: Promise<{ backendId: string; path: string[] }>) {
  try {
    const { backendId, path } = await params;
    const result = await resolveTemporaryResponse(backendId, method, `/${path.join("/")}`);
    return Response.json(result.body, { status: result.status, headers: corsHeaders });
  } catch (error) {
    const response = errorResponse(error);
    const payload = await response.text();
    return new Response(payload, { status: response.status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ backendId: string; path: string[] }> }) {
  return respond("GET", params);
}

export async function POST(_: Request, { params }: { params: Promise<{ backendId: string; path: string[] }> }) {
  return respond("POST", params);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
