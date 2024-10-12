import { AggregatedInventoryItem, ErrorResponse, InventoryItem, InventoryResponse } from "@/app/_types/api";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Image from 'next/image';

async function grabItemizedInventory(id: number): Promise<AggregatedInventoryItem[]> {
    const limit = 100; // Adjust the limit as needed
    let page = 1;
    let totalPages = 1;
    let inventory: InventoryItem[] = [];

    while (page <= totalPages) {
        try {
            const response = await fetch(`https://api.polytoria.com/v1/users/${id}/inventory?limited=true&limit=${limit}&page=${page}`);
            if (response.ok) {
                const data: InventoryResponse = await response.json();
                inventory = inventory.concat(data.inventory);
                totalPages = data.pages;
                page++;
            } else {
                const errorData: ErrorResponse = await response.json();
                console.error('Error fetching inventory:', errorData.errors[0].message);
                break;
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            break;
        }
    }

    // Aggregate inventory by asset
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

    return Object.values(aggregatedInventory);
}

export default async function Inventory({ id }: { id: number }) {
    const inventory: AggregatedInventoryItem[] = await grabItemizedInventory(id);
    inventory.sort((a, b) => b.amount - a.amount);

    return (
        <div className="border border-neutral-800 rounded-md">
            <ul className="divide-y divide-neutral-900">
                {inventory.map((item, index) => (
                    <li key={index} className="flex items-center space-x-4 px-3 py-2.5 justify-between">
                        <Image src={item.asset.thumbnail} alt={item.asset.name} width={64} height={64} className="rounded-md" />
                        <div className="text-right">
                            <p className="text-lg font-semibold">{item.asset.name}</p>
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <p className="text-right text-neutral-500 cursor-pointer">Owns {item.amount} copies</p>
                                </HoverCardTrigger>
                                <HoverCardContent className="text-left">
                                    <p>{'#' + item.serials.sort((a, b) => a - b).join(', #')}</p>
                                </HoverCardContent>
                            </HoverCard>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}