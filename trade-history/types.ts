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

export interface StoreAPIResponse {
    meta: Meta;
    data: Item[];
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
    price: number;
    isLimited: boolean;
    onSaleUntil?: string;
    accessoryType?: string;
    creatorName: string;
    recentlyUploaded: boolean;
    isSoldOut: boolean;
    thumbnailUrl: string;
    creatorUrl: string;
}

export interface ListingsAPIResponse {
    meta: Meta;
    data: Listings[];
}

export interface Listings {
    id: number;
    inventoryID: number;
    sellerID: number;
    price: number;
    inventory: Inventory;
    seller: Seller;
}

export interface Inventory {
    serial: number;
}

export interface Seller {
    id: number;
    username: string;
    avatarID: string;
    isOnline: boolean;
    avatarIconUrl: string;
}
