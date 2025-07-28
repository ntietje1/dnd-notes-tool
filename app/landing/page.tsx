import { LandingPageButton } from "./landing-button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          Welcome to D&D Connect
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Your ultimate companion for managing D&D campaigns
        </p>
        <LandingPageButton />
      </div>
    </div>
  );
}
