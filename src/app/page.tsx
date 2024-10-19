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
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import Error from "@/components/Error";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

const ITEMS_PER_PAGE = 25;
const DEFAULT_PAGE = 1;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [result, setDataResult] = useState<ReturnType<typeof trpc.getItemsByPage.useMutation>['data']>({
    items: [],
    totalPages: 0,
    allTags: [],
  });
  const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"query", any, any>> | null>(null);
  const [filters, setFilters] = useState({
    sortBy: "date",
    order: "desc",
    types: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [currentPage, setCurrentPage] = useState(+(searchParams.get("page") ?? DEFAULT_PAGE));

  const getItems = trpc.getItemsByPage.useMutation({
    onError(error) {
      setError(error);
      setLoading(false);
    },
    onSuccess(data) {
      setDataResult(data);
      setLoading(false);
    },
  });

  const safeResult = result ?? { items: [], totalPages: 0, allTags: [] };

  const filterOptions = [
    {
      label: "Sort By",
      key: "sortBy",
      type: "select",
      value: filters.sortBy,
      options: [
        { value: "date", label: "Date added" },
      ],
    },
    {
      label: "Order",
      key: "order",
      type: "select",
      value: filters.order,
      options: [
        { value: "asc", label: "Ascending" },
        { value: "desc", label: "Descending" },
      ],
    },
    {
      label: "Types",
      key: "types",
      type: "multi-select",
      value: filters.types,
      options: [
        { value: "hat", label: "Hat" },
        { value: "face", label: "Face" },
        { value: "tool", label: "Tool" },
      ],
    }
  ]

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
      filters
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    // Ensure the new page is within the bounds of the total pages
    newPage = Math.max(1, Math.min(newPage, safeResult.totalPages));

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

  const handleMultiSelectChange = (key: string, value: string[], int?: boolean) => {
    setFilters({
      ...filters,
      [key]: int ? value.map(v => parseInt(v)) : value
    });
  }

  const handleSelectChange = (key: string, value: string, int?: boolean) => {
    setFilters({
      ...filters,
      [key]: int ? parseInt(value) : value
    });
  }

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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-3 divide-y">
              <div className="grid gap-2">
                {
                  filterOptions.map((option, index) => (
                    <div key={index} className="grid grid-cols-3 items-center">
                      <Label className="col-span-1">{option.label}</Label>
                      <div className="col-span-2">
                        {option.type === "select" ? (
                          <Select
                            value={typeof option.value === 'string' ? option.value : undefined}
                            onValueChange={(value: string) => handleSelectChange(option.key, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue className="w-full" />
                            </SelectTrigger>
                            <SelectContent>
                              {option.options.map((opt, index) => (
                                <SelectItem key={index} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : option.type === "multi-select" ? (
                          <MultiSelect options={option.options} onValueChange={(value: string[]) => handleMultiSelectChange(option.key, value, false )} value={option.value} />
                        ) : null}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
          </PopoverContent>
        </Popover>
        <Button variant="default" onClick={handleSearch}>
          Search
        </Button>
      </div>
      {loading ? ( // Step 2: Show a loading icon when the data is being fetched
        <div className="flex justify-center items-center p-2">
          <Spinner width="24" height="24" className="fill-primary" />
        </div>
      ) : error ? (
        <Error message={error.message} />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {safeResult.items.map((item, index) => (
              <Link key={index} href={`/store/${item.id}`} passHref={true}>
                <div className="p-4 space-y-3 border hover:border-primary transition-all rounded-lg shadow-sm flex flex-col justify-between relative">
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
                    unoptimized
                  />
                  <div className="mt-auto">
                    <h2 className="text-md text-gray-100 font-bold truncate">{item.name}</h2>
                    <p className="text-sm text-gray-400 overflow-hidden">
                      <i className="pi pi-brick me-2"></i>{formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="absolute -top-3 right-0 p-2">

                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'disabled' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                {Array.from({ length: result?.totalPages ?? 1 }).map((_, index) => (
                  <PaginationLink
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`cursor-pointer ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    {index + 1}
                  </PaginationLink>
                ))}
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === (result?.totalPages ?? 1) ? 'disabled' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
