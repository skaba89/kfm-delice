import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Read locale from cookie, default to "fr"
  const cookieStore = await cookies();
  const locale = cookieStore.get("kfm-locale")?.value || "fr";

  let messages;
  try {
    messages = (await import(`./${locale}.json`)).default;
  } catch {
    messages = (await import("./fr.json")).default;
  }

  return {
    locale,
    messages,
  };
});
