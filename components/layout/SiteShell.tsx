import { SiteFooter } from "@/components/layout/SiteFooter";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getAccountContext } from "@/lib/auth/context";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const account = await getAccountContext();
  return (
    <div className="flex min-h-full min-h-dvh flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header showAdmin={account.isAdmin} />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <ScrollReveal />
      <SiteFooter />
    </div>
  );
}
