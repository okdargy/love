"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import type { AggregatedInventoryItem } from "@/app/_types/api";

interface InventoryGridItem extends AggregatedInventoryItem {
    notForSale: boolean;
}

export default function InventoryGrid({
    items,
    canManageSaleStatus,
}: {
    items: InventoryGridItem[];
    canManageSaleStatus: boolean;
}) {
    const [notForSaleMap, setNotForSaleMap] = useState<Record<number, boolean>>(
        () => Object.fromEntries(items.map((item) => [item.asset.id, item.notForSale]))
    );

    const setSalePreference = trpc.setUserInventoryNotForSale.useMutation({
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const sortedItems = useMemo(
        () => [...items].sort((a, b) => b.amount - a.amount),
        [items]
    );

    const handleSaleStatusToggle = (assetId: number, nextState: boolean) => {
        if (!canManageSaleStatus || setSalePreference.isPending) {
            return;
        }

        const previousState = notForSaleMap[assetId] ?? false;
        setNotForSaleMap((prev) => ({ ...prev, [assetId]: nextState }));

        setSalePreference.mutate(
            { itemId: assetId, notForSale: nextState },
            {
                onError: () => {
                    setNotForSaleMap((prev) => ({ ...prev, [assetId]: previousState }));
                },
            }
        );
    };

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sortedItems.map((item) => {
                const isNotForSale = notForSaleMap[item.asset.id] ?? false;

                return (
                    <article
                        key={item.asset.id}
                        className="group relative flex flex-col items-center gap-2.5 rounded-lg border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <Link href={`/store/${item.asset.id}`} className="block">
                            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-secondary to-muted">
                                <Image
                                    src={item.asset.thumbnail}
                                    alt={item.asset.name}
                                    width={64}
                                    height={64}
                                    className="h-16 w-16 rounded object-cover"
                                />
                            </div>
                        </Link>
                        <div className="flex w-full flex-col items-center gap-1">
                            <Link
                                href={`/store/${item.asset.id}`}
                                className="line-clamp-2 text-center text-xs font-semibold leading-tight transition-colors hover:text-primary"
                            >
                                {item.asset.name}
                            </Link>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="cursor-pointer text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground">
                                        x{item.amount}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-sm z-50" side="bottom">
                                    #{item.serials.slice().sort((a, b) => a - b).join(", #")}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        {canManageSaleStatus && (
                            <div className="flex items-center gap-1.5 border-t pt-2 w-full justify-center">
                                <span className={`text-[10px] font-medium ${isNotForSale ? "text-destructive" : "text-muted-foreground/70"}`}>
                                    {isNotForSale ? "Not for sale" : "Accepting offers"}
                                </span>
                                <Switch
                                    checked={isNotForSale}
                                    onCheckedChange={(checked) => handleSaleStatusToggle(item.asset.id, checked)}
                                    disabled={setSalePreference.isPending}
                                    aria-label={`Mark ${item.asset.name} as not for sale`}
                                    className="scale-75"
                                />
                            </div>
                        )}
                        {!canManageSaleStatus && isNotForSale && (
                            <div className="absolute right-2 top-2 rounded bg-destructive/90 px-1.5 py-0.5 text-[9px] font-semibold text-destructive-foreground">
                                NFS
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
}
