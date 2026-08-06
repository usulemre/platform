export default function DocsHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-6 p-12">
      <h1 className="text-2xl font-semibold text-foreground">Platform Documentation</h1>
      <p className="max-w-prose text-muted-foreground">
        Documentation portal shell. The authoritative corpus lives in <code>docs/</code> and is
        governed by <code>CLAUDE.md</code> and the Architecture Canon. This app renders that corpus;
        it never restates or overrides it.
      </p>
    </main>
  );
}
