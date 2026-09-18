import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  "src/app/(auth)/welcome.tsx",
  "src/app/(auth)/login.tsx",
  "src/app/(auth)/register.tsx",
  "src/app/(tabs)/index.tsx",
  "src/app/(tabs)/events.tsx",
  "src/app/(tabs)/profile.tsx",
  "src/app/(app)/survey.tsx",
  "src/app/(app)/survey-profile-settings.tsx",
  "src/app/(app)/settings.tsx",
  "src/app/(app)/admin.tsx",
  "src/app/(app)/create-event.tsx",
  "src/app/(app)/find-coffee-talk.tsx",
  "src/app/(app)/event-details.tsx",
  "src/app/(app)/report.tsx",
];

test("every route exports a screen built on the shared UI", async () => {
  for (const path of routes) {
    const source = await readFile(path, "utf8");
    assert.match(source, /export default function \w+Page\(/, `${path} should default-export a Page component`);
    assert.match(source, /from "@\/components\/ui"/, `${path} should use the shared UI components`);
    assert.doesNotMatch(source, />\w[\w ]* page</, `${path} still renders its placeholder label`);
  }
});

test("the tab bar exposes every tab route", async () => {
  const tabBar = await readFile("src/components/navigation/app-tab-bar.tsx", "utf8");
  const layout = await readFile("src/app/(tabs)/_layout.tsx", "utf8");

  for (const name of ["index", "events", "profile"]) {
    assert.match(tabBar, new RegExp(`key: "${name}"`));
    assert.match(layout, new RegExp(`<Tabs.Screen name="${name}"`));
  }
});

test("signed-in destinations are reachable from the app", async () => {
  const sources = await Promise.all(routes.map((path) => readFile(path, "utf8")));
  const app = sources.join("\n");

  for (const destination of ["/survey", "/survey-profile-settings", "/settings", "/admin", "/create-event", "/find-coffee-talk", "/event-details", "/report"]) {
    assert.match(app, new RegExp(`"${destination}"`), `nothing links to ${destination}`);
  }
});
