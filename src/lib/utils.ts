import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ensureAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export function parseFiles(urlStr: string | null | undefined, nameStr: string | null | undefined): { url: string, name: string }[] {
  if (!urlStr) return [];
  try {
    if (urlStr.trim().startsWith('[')) {
      const urls = JSON.parse(urlStr);
      const names = nameStr && nameStr.trim().startsWith('[') ? JSON.parse(nameStr) : [];
      return urls.map((u: string, i: number) => ({
        url: u,
        name: names[i] || `첨부파일 ${i + 1}`
      }));
    } else {
      return [{ url: urlStr, name: nameStr || "첨부파일" }];
    }
  } catch (e) {
    return [{ url: urlStr, name: nameStr || "첨부파일" }];
  }
}
