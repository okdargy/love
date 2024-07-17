"use client";

import { trpc } from "@/app/_trpc/client";
import { useEffect, useState } from "react";
import EditItem from "./EditItem";

export default function ItemList() {
    const [items, setItems] = useState<any[]>([]);
    
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
        <div className="border rounded-md divide-y">
            {items.map((item) => (
                <div key={item.id} className="p-2 rounded-md">
                    <div className="flex justify-between">
                        <div className="my-auto flex gap-x-3">
                            <img src={item.thumbnailUrl} alt={item.name} className="border rounded-md p-1 w-12 h-12" />
                            <p>{item.name}</p>
                        </div>
                        <div className="my-auto">
                            <EditItem id={item.id} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}