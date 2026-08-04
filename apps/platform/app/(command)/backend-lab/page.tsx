import { BackendLab } from "@/components/backend-lab";
import { listTemporaryBackends } from "@/lib/backend-lab/service";
import { parseStoredContract } from "@/lib/backend-lab/validation";

export const dynamic = "force-dynamic";

export default async function BackendLabPage() {
  const backends = (await listTemporaryBackends()).map((backend) => ({
    id: backend.id,
    name: backend.name,
    description: backend.description,
    status: backend.status,
    expiresAt: backend.expiresAt.toISOString(),
    requestCount: backend.requestCount,
    endpoints: parseStoredContract(backend.contractJson).endpoints.map(({ method, path }) => ({ method, path })),
  }));
  return <BackendLab initialBackends={backends} />;
}
