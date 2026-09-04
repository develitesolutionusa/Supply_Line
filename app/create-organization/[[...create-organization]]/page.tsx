import { CreateOrganization } from "@clerk/nextjs";
import { stampBusinessAccountType } from "@/lib/auth/stampAccountType";
import { requireUser } from "@/lib/auth/requireUser";

export const metadata = {
  title: "Create company",
};

export default async function CreateOrganizationPage() {
  const { userId } = await requireUser();
  if (userId) {
    await stampBusinessAccountType(userId);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-dark">
        Business account
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Create your company</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This Clerk organization is your business account. Teammates can join it later.
      </p>
      <div className="mt-8 flex justify-center">
        <CreateOrganization
          skipInvitationScreen
          afterCreateOrganizationUrl="/"
          routing="path"
          path="/create-organization"
        />
      </div>
    </div>
  );
}
