import Link from "next/link";
import { MessageCircle, Bot, Users, Palette } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-indigo-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="h-6 w-6 text-indigo-600" />
          Realtime Chat
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Multi-tenant chat, <span className="text-indigo-600">in realtime</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Embed a customizable chatbot on any website. Capture leads, chat with humans,
          and answer with AI — all backed by Supabase Realtime and OpenRouter.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-indigo-600 px-6 py-3 font-medium text-white shadow hover:bg-indigo-700"
          >
            Create your workspace
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          {
            icon: Users,
            title: "Multi-tenant",
            body: "Each workspace has isolated conversations, members, and branding.",
          },
          {
            icon: Bot,
            title: "AI replies",
            body: "Plug in any OpenRouter model. Configure system prompt per tenant.",
          },
          {
            icon: Palette,
            title: "Customizable widget",
            body: "Colors, position, welcome message, lead fields — all from the admin panel.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Icon className="h-8 w-8 text-indigo-600" />
            <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
