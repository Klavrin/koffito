import { router } from "expo-router";

/** Goes back when there is history; otherwise (deep link, web refresh) falls back to Home. */
export function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}
