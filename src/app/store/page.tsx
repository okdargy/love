"use client";

import { trpc } from "@/app/_trpc/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function Collections() {
    const [items, setItems] = useState<any[]>([]);
    // const [filters, setFilters] = useState<any>({});

    const getItems = trpc.getItems.useMutation({
        onSuccess(data, variables, context) {
            setItems(data);
        },
    });

    useEffect(() => {
        getItems.mutate({
            limit: 25
        });
    }, []);

    return (
        <main className="max-w-7xl my-3 mx-auto">
            <div className="justify-center space-y-1">
                {items.map((item) => (
                        <div className="w-full bg-gray-200 rounded-lg p-4">
                            <Link href={`/store/${item.id}`} key={item.id} className="flex w-full justify-between">
                                <div className="flex gap-x-4">
                                    <img className="w-12 h-12 my-auto" src={item.thumbnailUrl} alt={item.name} />
                                        <div className="space-y-1">
                                            <div>
                                                <p className="font-md font-semibold text-gray-900">{item.name}</p>
                                            </div>
                                            <div className="flex gap-x-2">
                                                {item.stats.rare ? (
                                                    <Badge variant="default">Rare</Badge>
                                                ): null}
                                                {item.stats.freaky ? (
                                                    <Badge variant="default">𝓯𝓻𝓮𝓪𝓴𝔂</Badge>
                                                ): null}
                                                {item.stats.projected ? (
                                                    <Badge variant="default">Projected</Badge>
                                                ): null}
                                            </div>
                                        </div>
                                </div>
                                <div className="my-auto flex space-x-2">
                                    <div className="flex bg-green-500 px-2 rounded-md gap-x-2">
                                        <p className="text-gray-100 font-bold my-auto">Value</p>
                                        <p className="text-gray-100 font-medium my-auto">{item.stats.value || "-"}</p>
                                    </div>
                                    <div className="flex bg-blue-500 px-2 rounded-md gap-x-2">
                                        <p className="text-gray-100 font-bold my-auto">Demand</p>
                                        <p className="text-gray-100 font-medium my-auto">{item.stats.demand || "-"}</p>
                                    </div>
                                    <div className="flex bg-red-500 px-2 rounded-md gap-x-2">
                                        <p className="text-gray-100 font-bold my-auto">Trend</p>
                                        <p className="text-gray-100 font-medium my-auto">{item.stats.trend || "-"}</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                ))}
            </div>
        </main>
    );
}

