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
