import { useEffect } from "react";
export function useMeta(name?: string, bio?: string | null) {
  useEffect(() => {
    if (!name) return;
    document.title = `${name} · Những món đồ mình yêu`;
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    const description = bio || `Khám phá những món đồ yêu thích tại ${name}.`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
  }, [name, bio]);
}
