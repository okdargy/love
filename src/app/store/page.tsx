"use client";

import { trpc } from "@/app/_trpc/client";
import { useEffect, useState } from "react";
import Link from "next/link";

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
            <div className="justify-center grid grid-cols-[repeat(auto-fill,160px)] gap-4">
                {items.map((item) => (
                    <Link href={`/store/${item.id}`} key={item.id} className="bg-gray-900 bg-opacity-15 rounded-lg">
                        <div className="max-w-md p-3 text-center">
                            <img className="w-16 mx-auto" src={item.thumbnailUrl} alt={item.name} />
                            <p className="font-md font-semibold text-gray-900">{item.name}</p>
                            <p className="text-gray-800 text-sm">{item.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}

