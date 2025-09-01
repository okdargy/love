"use client"

import { trpc } from "@/app/_trpc/client";
import { inferProcedureOutput } from '@trpc/server';
import { AppRouter } from "@/server";

import Error from "@/components/Error";
import Form from "./Form";

export type Defined<T> = T extends undefined ? never : T;
export type ItemInfo = Defined<inferProcedureOutput<AppRouter['getItemWithTags']>>;

export default function Content({ id }: { id: number }) {
    const itemInfo = trpc.getItemWithTags.useQuery(id, {
        onError(err) {
            console.error(err)
        }
    })

    return (
        <main>
            {itemInfo.isLoading ? (
                <div>
                    <p className="text-xl">Loading...</p>
                </div>
            ) : itemInfo.data ? (
                <div className="grid space-y-3.5 divide-y">
                    <div className="space-y-1">
                        <h3 className="text-neutral-500 mb-1 capitalize">{itemInfo.data.item.type}</h3>
                        <h1 className="text-2xl md:text-3xl font-bold mt-4 md:mt-0">{itemInfo.data.item.name}</h1>
                        <p className="text-sm text-neutral-400">{itemInfo.data.item.description}</p>
                    </div>
                    <div className="py-3">
                        <Form data={{
                            item: itemInfo.data.item,
                            allTags: itemInfo.data.allTags
                        }} />
                    </div>
                </div>
            ) : (
                <Error message="Could not find item" />
            )}
        </main>
    );
}