"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { inferProcedureOutput } from '@trpc/server';
import { AppRouter } from "@/server";
import { Spinner } from "@/components/icons";
import Error from "@/components/Error";
import { useSession } from "@/components/SessionContext";
import Form from "./Form";

export type ItemInfo = inferProcedureOutput<AppRouter['getItem']>;

export default function EditPage() {
    const { user } = useSession();
    const pathname = useParams<{ id: string }>();

    if(!user || user.role === "user") {
        return <Error message="Unauthorized" />
    }

    if (isNaN(parseInt(pathname.id))) {
        return <Error message="Invalid ID" />
    }

    const id = parseInt(pathname.id);

    const itemInfo = trpc.getItem.useQuery(id, {
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
        <div className="grid space-y-3 divide-y">
          <div className="space-y-1">
              <h3 className="text-neutral-500 mb-1 capitalize">{itemInfo.data.type}</h3>
              <h1 className="text-2xl md:text-3xl font-bold mt-4 md:mt-0">{itemInfo.data.name}</h1>
              <p className="text-sm text-neutral-400">{itemInfo.data.description}</p>
          </div>
          <div className="py-3">
            <Form data={{ ...itemInfo.data, onSaleUntil: new Date(itemInfo.data.onSaleUntil) }} />
          </div>
        </div>
      ) : (
        <Error message="Could not find item" />
      )}
    </main>
  );
}