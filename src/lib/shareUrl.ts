import func2url from "../../backend/func2url.json"

const OG_PREVIEW_URL = (func2url as Record<string, string>)["og-preview"]

export function getObjectShareUrl(objectId: string | number): string {
  const id = String(objectId)
  if (OG_PREVIEW_URL) {
    return `${OG_PREVIEW_URL}?id=${encodeURIComponent(id)}`
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/object/${id}`
  }
  return `https://kabinet-24.ru/object/${id}`
}
