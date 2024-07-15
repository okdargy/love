"use client";

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [search, setSearch] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);

  const searchItems = trpc.searchItems.useMutation({
    onSuccess(data, variables, context) {
      setItems(data);
    },
  });

  const submitSearch = () => {
    searchItems.mutate(search);
    setSearch("");
  }

  return (
    <main  className="max-w-7xl my-3 mx-auto">
        <div className="flex gap-x-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-x-1">
            <Button onClick={submitSearch} disabled={searchItems.isLoading}>Search</Button>
            <Link href="/store"><Button variant="secondary">Shop</Button></Link>
          </div>
        </div>
        <div className="p-3 justify-center grid grid-cols-[repeat(auto-fill,160px)] gap-4">
                {items.map((item) => (
                    <Link href={`/store/${item.id}`} key={item.id} className="bg-gray-900 bg-opacity-15 rounded-lg">
                        <div className="max-w-md p-3 text-center">
                            <img className="w-16 mx-auto" src={item.thumbnailUrl} alt={item.name} />
                            <p className="text-md font-semibold text-gray-900">{item.name}</p>
                            {
                              item.shorthand ? (
                                <p className="text-sm font-light text-gray-700">({item.shorthand})</p>
                              ) : null
                            }
                            <p className="text-sm text-gray-800">{item.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
    </main>
  );
}
