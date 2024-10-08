import { logger, schedules } from "@trigger.dev/sdk/v3";

export const getLeaderboardsTask = schedules.task({
    id: "get-leaderboards",
    run: async (payload: any, { ctx }) => {
        // Fetch the leaderboards from Polytoria
        const response = await fetch("https://polytoria.com/api/leaderboards");

        if (!response.ok) {
            throw new Error("Failed to fetch leaderboards");
        }

        const resJson = await response.json();
        const leaderboards = resJson.data;

        // Log the leaderboards
        logger.log(JSON.stringify(leaderboards));
    }
});