import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Individual sign up",
};

export default function IndividualSignUpPage() {
  return (
    <div className="flex justify-center px-4 py-12 sm:py-16">
      <SignUp
        routing="path"
        path="/sign-up/individual"
        signInUrl="/sign-in"
        unsafeMetadata={{ accountType: "individual" }}
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
