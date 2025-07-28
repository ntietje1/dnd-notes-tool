import Link from "next/link";

export function HeaderServer() {
  return (
    <header className="bg-background h-10 border-b border-border">
      <div className="mx-auto flex justify-between items-center h-full px-4">
        <Link href="/" className="font-bold text-xl text-primary">
          D&D Connect
        </Link>
      </div>
    </header>
  );
}
