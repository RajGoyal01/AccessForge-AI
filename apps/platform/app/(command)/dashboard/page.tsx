import { DashboardCommandCentre } from "@/components/dashboard-command-centre";
import { getDashboardOverview } from "@/lib/dashboard/service";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  return <DashboardCommandCentre data={await getDashboardOverview()} />;
}
