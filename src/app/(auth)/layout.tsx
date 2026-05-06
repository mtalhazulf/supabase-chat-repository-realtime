import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-semibold text-gray-900">
          <MessageCircle className="h-6 w-6 text-indigo-600" />
          Realtime Chat
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
