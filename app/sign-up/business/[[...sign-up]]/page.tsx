import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Business sign up",
};

export default function BusinessSignUpPage() {
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
