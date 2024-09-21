"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Spinner } from "@/components/icons";
import Error from "@/components/Error";
import { useSession } from "@/components/SessionContext";
import Form from "./Form";

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
        <Form id={itemInfo.data.id} name={itemInfo.data.name} />
      ) : (
        <Error message="Could not find item" />
      )}
    </main>
  );
}