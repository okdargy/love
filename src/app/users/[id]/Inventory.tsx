import { AggregatedInventoryItem, ErrorResponse, InventoryItem, InventoryResponse } from "@/app/_types/api";
import { Lock } from 'lucide-react';
import { USER_AGENT } from "@/lib/utils";
import { db } from "@/lib/db";
import { userInventoryPreferencesTable } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { validateRequest } from "@/lib/auth";
import InventoryGrid from "./InventoryGrid";

async function grabItemizedInventory(id: number): Promise<{
    isPrivate: boolean;
    inventory: AggregatedInventoryItem[];
}> {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    let inventory: InventoryItem[] = [];
    let isPrivate = false;

    while (page <= totalPages) {
        try {
            const response = await fetch(`https://api.polytoria.com/v1/users/${id}/inventory?limited=true&limit=${limit}&page=${page}`, {
                headers: {
                    'User-Agent': USER_AGENT
                }
            });

            if (response.ok) {
                const data: InventoryResponse = await response.json();
                inventory = inventory.concat(data.inventory);
                totalPages = data.pages;
                page++;
            } else {
                const errorData: ErrorResponse = await response.json();

                for (const error of errorData.errors) {
                    if (error.code === 'E_FORBIDDEN') {
                        isPrivate = true;
                        break;
                    }
                }

                console.error('Responded with error:', errorData.errors[0].message);
                break;
            }
        } catch (error) {
            console.error('Error whilst fetching inventory:', error);
            break;
        }
    }

    const aggregatedInventory: Record<number, AggregatedInventoryItem> = {};

    inventory.forEach(item => {
        const assetId = item.asset.id;
        if (!aggregatedInventory[assetId]) {
            aggregatedInventory[assetId] = {
                asset: item.asset,
                amount: 0,
                serials: [],
            };
        }
        aggregatedInventory[assetId].amount += 1;
        aggregatedInventory[assetId].serials.push(item.serial);
    });

    return { isPrivate, inventory: Object.values(aggregatedInventory) };
}

export default async function Inventory({ id }: { id: number }) {
    const { user } = await validateRequest();
    const { isPrivate, inventory } = await grabItemizedInventory(id);

    const canManageSaleStatus = user?.polytoriaId === id;
    const itemIds = inventory.map((item) => item.asset.id);

    let notForSaleRows: Array<{ itemId: number }> = [];

    if (itemIds.length > 0) {
        try {
            notForSaleRows = await db.query.userInventoryPreferencesTable.findMany({
                where: and(
                    eq(userInventoryPreferencesTable.ownerPolytoriaId, id),
                    inArray(userInventoryPreferencesTable.itemId, itemIds),
                    eq(userInventoryPreferencesTable.notForSale, true),
                ),
                columns: {
                    itemId: true,
                },
            });
        } catch (error) {
            console.error("Failed to load inventory sale preferences:", error);
        }
    }

    const notForSaleSet = new Set(notForSaleRows.map((row) => row.itemId));
    const inventoryWithSaleStatus = inventory.map((item) => ({
        ...item,
        notForSale: notForSaleSet.has(item.asset.id),
    }));

    return (
        <div>
            {isPrivate ? <div className="flex flex-col items-center justify-center space-y-2">
                <Lock className="h-6 w-6 text-muted-foreground" />
                <p className="text-muted-foreground text-center">This user has a private inventory</p>
            </div> : inventory.length === 0 ? <p className="text-muted-foreground text-center">This user has no items</p> :
                <InventoryGrid items={inventoryWithSaleStatus} canManageSaleStatus={canManageSaleStatus} />
            }

            {!isPrivate && inventory.length > 0 && canManageSaleStatus ? (
                <p className="mt-3 text-xs text-muted-foreground text-center">
                    Toggle &quot;Mark NFS&quot; on any item to show it as not for sale on your profile.
                </p>
            ) : null}
        </div>
    );
}
