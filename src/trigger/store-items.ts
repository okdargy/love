import { logger, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { auditLogsTable, collectablesStatsTable, collectablesTable } from "@/lib/db/schema";

export const storeItemsTask = schedules.task({
  id: "store-items",
  run: async () => {
    // Fetch the first item from the database and the first item from Polytoria
    const response = await fetch("https://polytoria.com/api/store/items?collectiblesOnly=true&sort=createdAt", {
        headers: {
          'User-Agent': 'Trigger/storeItems (https://polytoria.trade; hello@dargy.party)'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch store items");
    }

    const resJson: StoreItemsResponse = await response.json();
    const firstItem = resJson.data[0];
    const firstDbItem = await db.select().from(collectablesTable).orderBy(collectablesTable.id).limit(1);

    // Check to see if the id from the first item in the database is less than the id from the first item from Polytoria
    if (firstItem.id <= firstDbItem[0].id) {
      logger.log("No new items found.");
      return;
    }
    
    // Fetch items from Polytoria
    const items = await fetchAllItems([
      {
        page: 1,
        result: resJson
      }
    ]);
    logger.log(JSON.stringify(items));

    // Check if there are new items
    const newItems = items.filter((item: any) => !firstDbItem.length || item.id > firstDbItem[0].id);

    if (newItems.length > 0) {
      const values = newItems.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        thumbnailUrl: item.thumbnailUrl,
        price: item.price,
        onSaleUntil: new Date(item.onSaleUntil),
        isSoldOut: item.isSoldOut,
      }));

      try {
        await db.transaction(async (trx) => {
            const result = await trx.insert(collectablesTable)
                .values(values)
                .returning({ id: collectablesTable.id })
                .onConflictDoNothing();
    
            if (result.length > 0) {
                await trx.insert(collectablesStatsTable)
                    .values(result.map((item: any) => ({
                        id: item.id
                        // Add other necessary fields here
                    })))
                    .onConflictDoNothing();
    
                logger.log(`Inserted ${result.length} new items.`);
            } else {
                logger.log("No new items to insert.");
            }
        });
      } catch (e) {
          logger.error("Failed to insert items and stats");
      }
    } else {
      logger.log("No new items found.");
    }
  }
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

async function fetchAllItems(previousData?: {
  page: number;
  result: StoreItemsResponse;
}[]): Promise<StoreItem[]> {
  let allItems: StoreItem[] = [];
  let nextPageURL = "https://polytoria.com/api/store/items?collectiblesOnly=true";

  if (previousData && previousData.length > 0) {
    // Use the last page's nextPageURL from previousData
    const lastPage = previousData[previousData.length - 1];
    nextPageURL = lastPage.result.meta && lastPage.result.meta.nextPageURL 
      ? new URL(lastPage.result.meta.nextPageURL, "https://polytoria.com").toString() 
      : "";
    allItems = previousData.flatMap(data => data.result.data);
  }

  while (nextPageURL !== "") {
    const response = await fetch(nextPageURL);
    if (!response.ok) {
      throw new Error("Failed to fetch store items");
    }

    const pageData: StoreItemsResponse = await response.json();
    allItems = allItems.concat(pageData.data);

    nextPageURL = pageData.meta && pageData.meta.nextPageURL 
      ? new URL(pageData.meta.nextPageURL, "https://polytoria.com").toString() 
      : "";
  }

  return allItems;
}

async function fetchFirstItem() {
  const response = await fetch("https://polytoria.com/api/store/items?collectiblesOnly=true");
  if (!response.ok) {
    throw new Error("Failed to fetch store items");
  }

  const pageData: StoreItemsResponse = await response.json();
  return pageData.data[0];
}