export interface OwnerAPIResponse {
    inventories: Inventory[];
    pages: number;
    total: number;
}

export interface Inventory {
    serial: number;
    purchasedAt: string;
    user: User;
}

export interface User {
    id: number;
    username: string;
}

export interface WebsiteStoreResponse {
    meta: Meta;
    data: WebsiteItem[];
}

export interface Meta {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageURL: string;
    lastPageURL: string;
    nextPageURL: string;
    previousPageURL: any;
}
export interface Item {
    id: number;
    type: string;
    name: string;
    description: string;
    isLimited: boolean;
    accessoryType?: string;
    price?: number;
    originalPrice?: number;
}

export interface WebsiteItem extends Item {
    onSaleUntil?: string;
    creatorName: string;
    recentlyUploaded: boolean;
    isSoldOut: boolean;
    thumbnailUrl: string;
    creatorUrl: string;
}
export interface APIItem extends Item {
    tags: string[];
    creator: Creator;
    thumbnail: string;
    owners: number;
    averagePrice: number;
    createdAt: string;
    updatedAt: string;
}

export interface ListingsAPIResponse {
    meta: Meta;
    data: Listing[];
}

export interface Listing {
    id: number;
    inventoryID: number;
    sellerID: number;
    price: number;
    inventory: ListingInventory;
    seller: Seller;
}

export interface ListingInventory {
    serial: number;
}

export interface Seller {
    id: number;
    username: string;
    avatarID: string;
    isOnline: boolean;
    avatarIconUrl: string;
}

export interface APIStoreResponse {
    assets: APIItem[];
    pages: number;
    total: number;
}

export interface Creator {
    type: string;
    id: number;
    name: string;
    thumbnail: string;
}

	
// {
//   "meta": {
//     "total": 724299,
//     "perPage": 100,
//     "currentPage": 1,
//     "lastPage": 7243,
//     "firstPage": 1
//   },
//   "data": [
//     {
//       "rank": 1,
//       "statistic": 6467086,
//       "user": {
//         "id": 14772,
//         "username": "Everlast",
//         "membershipID": 2,
//         "thumbnail": {
//           "avatar": "https://cdn.polytoria.com/thumbnails/avatars/f3ef8f7c8fd125bae4812bf77047603a6ce78af57d5f9474fe0994a8eeb53cd3.png",
//           "icon": "https://cdn.polytoria.com/thumbnails/avatars/f3ef8f7c8fd125bae4812bf77047603a6ce78af57d5f9474fe0994a8eeb53cd3-icon.png"
//         }
//       }
//     },

export interface RankingsResponse {
    meta: {
        total: number;
        perPage: number;
        currentPage: number;
        lastPage: number;
    };
    data: RankingEntry[];
}

export interface RankingEntry {
    rank: number;
    statistic: number;
    user: {
        id: number;
        username: string;
        membershipID: number;
        thumbnail: {
            avatar: string;
            icon: string;
        };
    };
}