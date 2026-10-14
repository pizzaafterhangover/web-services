import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

export async function getNotes(): Promise<Note[]> {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return notes.sort((a, b) => lastTouched(b).getTime() - lastTouched(a).getTime());
}

export function lastTouched(note: Note): Date {
  return note.data.updated ?? note.data.date;
}

export function url(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
