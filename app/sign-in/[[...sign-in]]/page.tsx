import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/layout/Logo";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center px-4 py-12 sm:py-16">
      <Logo />
      <div className="mt-8">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
