"use client"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import useDebounceValue from "@/app/_hooks/useDebounceValue";
import { Input } from "../src/components/ui/input";

export default function Search() {
  const [search, setSearch] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);

  const searchTerm = useDebounceValue(search, 300)

  const searchItems = trpc.searchItems.useMutation({
    onSuccess(data, variables, context) {
      setItems(data);
    },
  });

  useEffect(() => {
    if(searchTerm) {
      searchItems.mutate({ input: searchTerm });
    } else {
      setItems([]);
    }
  }, [searchTerm])

  return (
      <div className="rounded-lg border">
        <Input className="border-0" placeholder="Search for an item..." value={search} onChange={(e) => setSearch(e.target.value)} />
          { searchTerm && searchItems.isSuccess && items.length == 0 ? (
            <p className="p-3 text-center border-t">No results found.</p>
          ): null}
          {items.length > 0 ? (
            <div className="border-t p-1 divide-y">
              {items.map((item) => (
                  <div className="py-2.5 px-3 text-sm">
                    <a href={`/item/${item.id}`}>
                      {item.name}
                    </a>
                  </div>
              ))}
            </div>
          ) : null}
      </div>
  )
}