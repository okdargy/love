"use client"

import { trpc } from "@/app/_trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetClose,
    SheetTrigger,
  } from "@/components/ui/sheet"
import { toast } from "sonner"
import { useState } from "react"
import { Eye, Pencil } from "lucide-react"
import Link from "next/link"
  
export default function EditItem(props: {
    id: number  
}) {
    const [value, setValue] = useState<number>(0);
    
    const editItemStats = trpc.editItemStats.useMutation({
        onError(err) {
            console.error(err); 
            toast.error("Failed to update item");
        },
        onSuccess(data, variables, context) {
            console.log(data);
            toast.success("Item updated successfully");
        }
    });

    const submitEdit = () => {
        editItemStats.mutate({
            id: props.id,
            value
        });
    }

    return (
        <div>
            <Sheet>
                <SheetTrigger asChild> 
                    <Button variant="outline">
                        <Pencil className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Edit Item</SheetTitle>
                        <SheetDescription>
                            Let's make some changes to the item
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value" className="text-right">
                            Value
                            </Label>
                            <Input id="value" type="number" className="col-span-3" onChange={(e) => setValue(parseInt(e.target.value))} />
                        </div>
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button type="submit" onClick={submitEdit}>Save changes</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <Link href={`/store/${props.id}`}>
                <Button variant="outline" className="my-auto ml-2">
                    <Eye className="w-5 h-5" />
                </Button>
            </Link>
        </div>
    );
}