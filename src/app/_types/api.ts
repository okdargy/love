export interface UserThumbnail {
    avatar: string;
    icon: string;
}

export interface UserData {
    id: number;
    username: string;
    description: string;
    signature: string;
    thumbnail: UserThumbnail;
    playing: string | null;
    netWorth: number;
    placeVisits: number;
    profileViews: number;
    forumPosts: number;
    assetSales: number;
    membershipType: string;
    isStaff: boolean;
    registeredAt: string;
    lastSeenAt: string;
}

export interface Asset {
    id: number;
    type: string;
    name: string;
    thumbnail: string;
    isLimited: boolean;
}

export interface InventoryItem {
    id: number;
    asset: Asset;
    serial: number;
    purchasedAt: string;
}

export interface AggregatedInventoryItem {
    asset: Asset;
    amount: number;
    serials: number[];
}

export interface InventoryResponse {
    inventory: InventoryItem[];
    pages: number;
    total: number;
}

export interface ErrorResponse {
    errors: Array<{
        code: string;
        message: string;
    }>;
}