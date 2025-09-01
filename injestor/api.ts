import {
    APIStoreResponse,
    ListingsAPIResponse,
    OwnerAPIResponse,
    WebsiteStoreResponse,
} from "./types";
import { helpfulPrint } from "./utils";

const USER_AGENT = "TradeHistory/1.0 (https://polytoria.trade; hello@dargy.party)";
const API_BASE_URL = {
    POLYTORIA: "https://api.polytoria.com/v1",
    STORE: "https://polytoria.com/api/store"
};
let LAST_API_ERROR = 0;

async function apiRequest<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT
            },
        });

        if (!response.ok) {
            console.error(`API request failed: ${url} (${response.status})`);
            return null;
        }

        return await response.json() as T;
    } catch (error) {
        console.error(`Error in API request: ${url}`, error);

        if (Date.now() - LAST_API_ERROR < 1000 * 60) helpfulPrint(`${url}: ${error}`, "WARNING");
        LAST_API_ERROR = Date.now();

        return null;
    }
}

/**
 * Gets a list of owners for a specific item
 * 
 * @param id - The item ID
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 100)
 * @returns Owner API response or null if request fails
 */
export const getOwners = async (
    id: number,
    page: number = 1,
    limit: number = 100,
): Promise<OwnerAPIResponse | null> => {
    const url = `${API_BASE_URL.POLYTORIA}/store/${id}/owners?page=${page}&limit=${limit}`;
    return apiRequest<OwnerAPIResponse>(url);
};

/**
 * Gets listings for a specific item
 * 
 * @param id - The item ID
 * @returns Listings API response or null if request fails
 */
export const getListings = async (id: number): Promise<ListingsAPIResponse | null> => {
    const url = `${API_BASE_URL.STORE}/listings/${id}`;
    return apiRequest<ListingsAPIResponse>(url);
};

/**
 * Gets a list of store items from the API
 * 
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 100, limit: 100,)
 * @returns JSON response of all the collectibles from the real API or null if request fails
 */
export const getAPIItems = async (page: number = 1, limit: number = 100): Promise<APIStoreResponse | null> => {
    const url = `${API_BASE_URL.POLYTORIA}/store?sort=createdAt&order=desc&collectiblesOnly=true&limit=${limit}&page=${page}`;
    return apiRequest<APIStoreResponse>(url);
};


/**
 * Gets a list of store items from the website
 * 
 * @param page - Page number (default: 1)
 * @returns JSON response of all the collectibles from the website or null if request fails
 */
export const getWebsiteItems = async (page: number = 1): Promise<WebsiteStoreResponse | null> => {
    const url = `${API_BASE_URL.STORE}/items?sort=createdAt&order=desc&showOffsale=true&collectiblesOnly=true&page=${page}`;
    return apiRequest<WebsiteStoreResponse>(url);
};

// For legacy kitty, that keeps coming back for getItems(), those who know.
export const getItems = getWebsiteItems;