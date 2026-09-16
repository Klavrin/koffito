import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  ["src/app/(auth)/welcome.tsx", "Welcome page"],
  ["src/app/(auth)/register.tsx", "Register page"],
  ["src/app/(app)/survey.tsx", "Survey page"],
  ["src/app/(app)/survey-profile-settings.tsx", "Survey profile settings page"],
  ["src/app/(app)/profile.tsx", "Profile page"],
  ["src/app/(app)/settings.tsx", "Settings page"],
  ["src/app/(app)/admin.tsx", "Admin page"],
  ["src/app/(app)/create-event.tsx", "Create event page"],
  ["src/app/(app)/events.tsx", "Events page"],
  ["src/app/(app)/event-details.tsx", "Event details page"],
];

test("each requested placeholder route renders its page label", async () => {
  for (const [path, label] of routes) {
    const source = await readFile(path, "utf8");
    assert.match(source, new RegExp(`>${label}<`));
  }
});

test("the home screen links to every signed-in placeholder route", async () => {
  const homeScreen = await readFile("src/app/(tabs)/index.tsx", "utf8");
  const destinations = [
    ["Survey", "/survey"],
    ["Survey profile settings", "/survey-profile-settings"],
    ["Profile", "/profile"],
    ["Settings", "/settings"],
    ["Admin", "/admin"],
    ["Create event", "/create-event"],
    ["Events", "/events"],
    ["Event details", "/event-details"],
  ];

  for (const [label, path] of destinations) {
    assert.match(homeScreen, new RegExp(`title=\\"${label}\\"`));
    assert.match(homeScreen, new RegExp(`router\\.push\\(\\"${path}\\"\\)`));
  }
});
