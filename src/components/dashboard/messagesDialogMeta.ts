// Типы, константы и утилиты для хранения мета-данных диалогов в localStorage

export type FilterType = "all" | "object" | "club" | string  // string = folder id

export interface DialogMeta {
  pinned: boolean
  muted: boolean
  deleted: boolean
  cleared: boolean
  forceUnread: boolean
  folderIds: string[]
}

export interface Folder {
  id: string
  name: string
  emoji: string
}

export const META_KEY   = "dialog_meta_v1"
export const FOLDER_KEY = "dialog_folders_v1"
export const EMOJIS     = ["📁","⭐","🔥","💼","🏠","👤","🤝","💡","📌","🎯","💬","🔔"]

export function defaultMeta(): DialogMeta {
  return { pinned: false, muted: false, deleted: false, cleared: false, forceUnread: false, folderIds: [] }
}

export function loadMeta(): Record<string, DialogMeta> {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") } catch { return {} }
}
export function saveMeta(m: Record<string, DialogMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(m))
}
export function loadFolders(): Folder[] {
  try { return JSON.parse(localStorage.getItem(FOLDER_KEY) || "[]") } catch { return [] }
}
export function saveFolders(f: Folder[]) {
  localStorage.setItem(FOLDER_KEY, JSON.stringify(f))
}
