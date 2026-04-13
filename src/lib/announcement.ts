import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettingsTable } from "@/lib/db/schema";

export type AnnouncementSettings = {
  enabled: boolean;
  message: string;
};

const DEFAULT_SETTINGS: AnnouncementSettings = {
  enabled: false,
  message: "",
};

let cache: AnnouncementSettings = DEFAULT_SETTINGS;
let hasLoadedCache = false;
let loadPromise: Promise<void> | null = null;

const normalizeMessage = (message: string) => message.trim();

const loadFromDatabase = async () => {
  const existing = await db.query.siteSettingsTable.findFirst({
    where: eq(siteSettingsTable.id, 1),
    columns: {
      announcementEnabled: true,
      announcementMessage: true,
    },
  });

  if (!existing) {
    await db.insert(siteSettingsTable).values({ id: 1 }).onConflictDoNothing();
    cache = DEFAULT_SETTINGS;
    hasLoadedCache = true;
    return;
  }

  cache = {
    enabled: existing.announcementEnabled,
    message: existing.announcementMessage,
  };
  hasLoadedCache = true;
};

export const initializeAnnouncementCache = async () => {
  if (hasLoadedCache) {
    return;
  }

  if (!loadPromise) {
    loadPromise = loadFromDatabase().finally(() => {
      loadPromise = null;
    });
  }

  await loadPromise;
};

export const getAnnouncementSettings = async (): Promise<AnnouncementSettings> => {
  await initializeAnnouncementCache();
  return cache;
};

export const setAnnouncementSettings = async (input: AnnouncementSettings): Promise<AnnouncementSettings> => {
  const message = normalizeMessage(input.message);
  const next: AnnouncementSettings = {
    enabled: input.enabled,
    message,
  };

  await db
    .insert(siteSettingsTable)
    .values({
      id: 1,
      announcementEnabled: next.enabled,
      announcementMessage: next.message,
      updated_at: Date.now(),
    })
    .onConflictDoUpdate({
      target: siteSettingsTable.id,
      set: {
        announcementEnabled: next.enabled,
        announcementMessage: next.message,
        updated_at: Date.now(),
      },
    });

  cache = next;
  hasLoadedCache = true;

  return cache;
};

void initializeAnnouncementCache();
