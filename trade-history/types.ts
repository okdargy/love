export interface OwnerAPIResponse {
    inventories: Inventory[]
    pages: number
    total: number
}

export interface Inventory {
    serial: number
    purchasedAt: string
    user: User
}

export interface User {
    id: number
    username: string
}

export interface StoreAPIResponse {
    meta: StoreInfo
    data: Item[]
}

export interface StoreInfo {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageURL: string
    lastPageURL: string
    nextPageURL: string
    previousPageURL: any
}

export interface Item {
    id: number
    type: string
    name: string
    description: string
    price: number
    isLimited: boolean
    onSaleUntil?: string
    accessoryType?: string
    creatorName: string
    recentlyUploaded: boolean
    isSoldOut: boolean
    thumbnailUrl: string
    creatorUrl: string
}
