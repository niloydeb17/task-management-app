import { HomeDashboard } from "@/components/HomeDashboard";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardHome() {
  const user = await currentUser();
  
  return <HomeDashboard user={user} />;
}
