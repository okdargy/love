"use client";

import { trpc } from "@/app/_trpc/client";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/icons";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 25;
const DEFAULT_PAGE = 1;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [result, setResult] = useState<{
    items: {
      id: number;
      name: string;
      thumbnailUrl: string;
      price: number;
    }[],
    totalPages: number;
  }>({
    items: [],
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [currentPage, setCurrentPage] = useState(+(searchParams.get("page") ?? DEFAULT_PAGE));

  const getItems = trpc.getItemsByPage.useMutation({
    onSuccess(data, variables, context) {
      setResult(data);
      setLoading(false);
    },
  });

  useEffect(() => {
    getItems.mutate({
      page: currentPage < 1 ? DEFAULT_PAGE : currentPage,
      total: ITEMS_PER_PAGE,
      search: searchParams.get("search") ?? "",
    });
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(price);
  };

  const handleSearch = () => {
    setCurrentPage(DEFAULT_PAGE); // Reset to the first page on new search
    setLoading(true);
    const queryParams = new URLSearchParams({ page: DEFAULT_PAGE.toString() });

    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }
    
    router.push(`/?${queryParams.toString()}`);
    getItems.mutate({
      page: DEFAULT_PAGE,
      total: ITEMS_PER_PAGE,
      search: searchTerm,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setLoading(true);
    const queryParams = new URLSearchParams({ page: newPage.toString() });
  
    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }
  
    router.push(`/?${queryParams.toString()}`);
    getItems.mutate({
      page: newPage,
      total: ITEMS_PER_PAGE,
      search: searchTerm,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-x-2">
        <Input
          type="search"
          placeholder="Search for an item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="default" onClick={handleSearch}>
          Search
        </Button>
      </div>
      {loading ? ( // Step 2: Show a loading icon when the data is being fetched
        <div className="flex justify-center items-center p-2">
          <Spinner width="24" height="24" className="fill-red-500" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {result.items.map((item, index) => (
              <Link key={index} href={`/store/${item.id}`}>
                <div className="p-4 space-y-3 border hover:border-red-500 transition-all rounded-lg shadow-sm flex flex-col justify-between">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.name}
                    width={200}
                    height={200}
                    className="rounded-lg data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-100/10"
                    data-loaded='false'
                    onLoad={event => {
                      event.currentTarget.setAttribute('data-loaded', 'true')
                    }}
                  />
                  <div className="mt-auto">
                    <h2 className="text-md text-gray-100 font-bold truncate">{item.name}</h2>
                    <p className="text-sm text-gray-400 overflow-hidden">
                      <i className="pi pi-brick me-2"></i>{formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                {Array.from({ length: result.totalPages ?? 1 }).map((_, index) => (
                  <PaginationLink
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className="cursor-pointer"
                  >
                    {index + 1}
                  </PaginationLink>
                ))}
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
