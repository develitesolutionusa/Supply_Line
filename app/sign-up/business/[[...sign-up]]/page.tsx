import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { stampBusinessAccountType } from "@/lib/auth/stampAccountType";

export const metadata = {
  title: "Business sign up",
};

export default async function BusinessSignUpPage() {
  const { userId } = await auth();
  if (userId) {
    await stampBusinessAccountType(userId);
    redirect("/create-organization");
  }

  return (
    <div className="flex justify-center px-4 py-12 sm:py-16">
      <SignUp
        routing="path"
        path="/sign-up/business"
        signInUrl="/sign-in"
        unsafeMetadata={{ accountType: "business" }}
        forceRedirectUrl="/create-organization"
        fallbackRedirectUrl="/create-organization"
      />
    </div>
  );
}
