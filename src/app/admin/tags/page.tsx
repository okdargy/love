"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";
import { Form } from "@/components/ui/form";

const isOnlyEmoji = (str: string) => {
    const regex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u;
    return regex.test(str);
}

const RemoveDialog = ({ id, name, onRemove }: { id: number, name: string, onRemove: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsOpen(true)}>
                    <Minus />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader className="space-y-2">
                    <DialogTitle>
                        Remove &quot;{name}&quot;
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove this tag?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onRemove}>
                        Remove
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminTags() {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [tags, setTags] = useState<ReturnType<typeof trpc.searchTags.useMutation>['data']>([]);

    const getTags = trpc.searchTags.useMutation({
        onSuccess: (data) => {
            setTags(data);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const addTag = trpc.addTag.useMutation({
        onSuccess: () => {
            getTags.mutate();
            toast.success("Tag added!");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const removeTag = trpc.removeTag.useMutation({
        onSuccess: () => {
            getTags.mutate();
            toast.success("Tag removed!");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    useEffect(() => {
        getTags.mutate();
    }, []);

    const searchTags = async (query: string) => {
        getTags.mutate(query);
    }

    const handleAddTag = async () => {
        if (name.length < 3) {
            toast.error("Name must be at least 3 characters long");
            return;
        }

        if (!isOnlyEmoji(emoji)) {
            toast.error("Emoji must be an emoji");
            return;
        }

        await addTag.mutate({ name, emoji });
        setIsDialogOpen(false);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            searchTags(searchQuery);
        }
    }

    const doRemoveTag = async (id: number) => {
        await removeTag.mutate(id);
        getTags.mutate();
    };

    return (
        <div className="space-y-4">
            <div className="w-full flex gap-x-2">
                <Input placeholder="Search for tags" className="w-full" onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} />
                <Button onClick={() => searchTags(searchQuery)}>
                    Search
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant={"outline"} onClick={() => setIsDialogOpen(true)}>
                            <Plus />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Create Tag
                            </DialogTitle>
                            <DialogDescription>
                                Make a new tag to categorize collectables with
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tagName" className="text-right">
                                    Name
                                </Label>
                                <Input id="tagName" autoComplete="off" placeholder="Example" className="col-span-3" onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="emoji" className="text-right">
                                    Emoji
                                </Label>
                                <Input id="emoji" className="col-span-3" onChange={(e) => setEmoji(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddTag} type="submit">
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="space-y-2">
                {tags ? (
                    tags.map(tag => (
                        <div key={tag.id} className="flex justify-between items-center p-4 border border-neutral-100/10 rounded-lg shadow-md">
                            <div className="flex gap-x-3">
                                <p>{tag.emoji}</p>
                                <p>{tag.name}</p>
                            </div>
                            <RemoveDialog id={tag.id} name={tag.name} onRemove={() => doRemoveTag(tag.id)} />
                        </div>
                    ))) : (
                    <p>No tags found</p>
                )}
            </div>
        </div>
    )
} 