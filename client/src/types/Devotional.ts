export type DevotionalId = string; // YYYY-MM-DD

export interface Devotional {
  id: DevotionalId;
  date: string; // YYYY-MM-DD
  title: string;
  verseRef: string;
  verseText?: string;
  body: string;
  imageUrl?: string;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}
