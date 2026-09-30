import { AppShell } from "@/components/layout/app-shell";
import { TimezoneSync } from "@/components/layout/timezone-sync";
import { preferenceAttributes, readPreferences } from "@/lib/preferences";
import { requireUser } from "@/server/users";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const prefs = readPreferences(user.preferences);

  // Apply appearance choices to <html> before first paint. Values are validated enums.
  const applyPrefs = `(function(a){var d=document.documentElement;for(var k in a)d.setAttribute(k,a[k]);})(${JSON.stringify(
    preferenceAttributes(prefs),
  )});`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: applyPrefs }} />
      <AppShell layout={prefs.layout}>
        <TimezoneSync current={user.timezone} />
        {children}
      </AppShell>
    </>
  );
}
