import { SignInCard } from "./SignInCard";
import { SignInRedirectHandler } from "./SignInRedirectHandler";

export default function SignInPage() {
  return (
    <>
      <SignInRedirectHandler />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SignInCard />
      </div>
    </>
  );
}
