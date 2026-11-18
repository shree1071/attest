import { DashboardNav } from "@/components/dashboard-nav";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { requireUser } from "@/lib/auth";
import { countByStatus, getOwnedProduct } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const product = await getOwnedProduct(user.id);
  const pending = product ? (await countByStatus(product.id)).pending : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
        <div className="pt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Dashboard</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {user.name}
          </h1>
        </div>
        <DashboardNav pending={pending} />
        <div className="pt-6">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}
