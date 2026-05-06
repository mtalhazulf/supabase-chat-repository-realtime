import { env } from "@/lib/env";
import { CopyBlock } from "./CopyBlock";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const origin = env.appUrl;

  const snippet = `<!-- Realtime Chat widget -->
<script async src="${origin}/embed.js" data-tenant="${tenantId}"></script>`;

  const iframeSnippet = `<iframe
  src="${origin}/widget/${tenantId}"
  style="position:fixed;bottom:0;right:0;width:380px;height:560px;border:0;"
  allow="clipboard-write"
></iframe>`;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Embed on your website</h2>
        <p className="text-sm text-gray-600">Drop one line into your HTML — works on any framework.</p>
      </header>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Recommended: floating widget</h3>
        <p className="text-xs text-gray-600">
          Adds a floating bubble. Branding and behavior come from the Customize tab.
        </p>
        <CopyBlock code={snippet} />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Alternative: iframe</h3>
        <p className="text-xs text-gray-600">Use when scripts are restricted by CSP.</p>
        <CopyBlock code={iframeSnippet} />
      </section>

      <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p className="font-medium">Test it</p>
        <p className="mt-1">
          Open{" "}
          <a className="underline" href={`${origin}/widget/${tenantId}`} target="_blank" rel="noreferrer">
            {origin}/widget/{tenantId}
          </a>{" "}
          to preview the standalone widget.
        </p>
      </section>
    </div>
  );
}
