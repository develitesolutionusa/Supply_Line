import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="flex justify-center px-4 py-12 sm:py-16">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
