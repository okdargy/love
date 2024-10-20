import { db } from "@/lib/db";
import { logger, schedules } from "@trigger.dev/sdk/v3";

export const getItemOwners = schedules.task({
    id: "get-item-owners",
    run: async (payload: any, { ctx }) => {
        // Get all the collectables
        const collectables = await db.query.collectablesTable.findMany();
        logger.log(`Found ${collectables.length} collectables`);

        

        

    }
});