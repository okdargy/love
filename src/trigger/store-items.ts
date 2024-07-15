import { logger, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { collectablesStatsTable, collectablesTable } from "@/lib/db/schema";

export const storeItemsTask = schedules.task({
  id: "store-items",
  run: async (payload: any, { ctx }) => {
    const items = await fetchAllItems();
    logger.log(JSON.stringify(items));

    const values = items.map((item: any) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      price: item.price,
      onSaleUntil: new Date(item.onSaleUntil),
      isSoldOut: item.isSoldOut,
    }));

    const result = await db.insert(collectablesTable).values(values).returning({ id: collectablesTable.id }).onConflictDoNothing();
    
    if(result.length > 0) { 
      await db.insert(collectablesStatsTable).values(result.map((item) => ({ id: item.id }))).onConflictDoNothing();
    }
  },
});

type StoreItem = {
  id: number;
  type: string;
  name: string;
  description: string;
  price: number;
  isLimited: boolean;
  onSaleUntil: string | null;
  accessoryType: string | null;
  creatorName: string;
  recentlyUploaded: boolean;
  isSoldOut: boolean;
  thumbnailUrl: string;
  creatorUrl: string;
};

type StoreItemsResponse = {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageURL: string;
    lastPageURL: string;
    nextPageURL: string | null;
    previousPageURL: string | null;
  };
  data: StoreItem[];
};

async function fetchAllItems() {
  let allItems: StoreItem[] = [];
  let nextPageURL = "https://polytoria.com/api/store/items?collectiblesOnly=true";

  while (nextPageURL !== "") {
    const response = await fetch(nextPageURL);
    if (!response.ok) {
      throw new Error("Failed to fetch store items");
    }

    const pageData: StoreItemsResponse = await response.json();
    allItems = allItems.concat(pageData.data);

    nextPageURL = pageData.meta && pageData.meta.nextPageURL ? new URL(pageData.meta.nextPageURL, "https://polytoria.com").toString() : "";
  }

  return allItems;
}