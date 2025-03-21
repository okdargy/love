"use client";

import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import { toast } from "sonner";
import Link from "next/link";

import { ItemInfo } from "./Content";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/icons";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { Lock } from "lucide-react";

export default function Form({ data }: { data: ItemInfo }) {
    const router = useRouter();

    const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"mutation", any, any>> | null>(null);
    const [loading, setLoading] = useState(false);

    const options = [
        {
            name: "Value",
            key: "value",
            type: "number",
            value: data.item.stats.value,
        },
        {
            name: "Demand",
            key: "demand",
            type: "enum",
            value: data.item.stats.demand,
            options: {
                awful: "Awful",
                low: "Low",
                normal: "Normal",
                high: "High",
                great: "Great",
            }
        },
        {
            name: "Trend",
            key: "trend",
            type: "enum",
            value: data.item.stats.trend,
            options: {
                stable: "Stable",
                unstable: "Unstable",
                fluctuating: "Fluctuating",
                rising: "Rising",
                lowering: "Lowering",
            }
        },
        {
            name: "Fun Fact",
            key: "funFact",
            type: "long_string",
            value: data.item.stats.funFact,
        },
        {
            name: "Tags",
            key: "tags",
            type: "multi-select",
            valueType: "number",
            value: data.item.tags.map((tag) => tag.tagId),
            opts: data.allTags.map((tag) => {
                return {
                    value: tag.id.toString(),
                    label: tag.name,
                };
            })
        }, {
            name: "Shorthand",
            key: "shorthand",
            type: "string",
            value: data.item.shorthand,
            adminOnly: true
        }
    ];

    const initialFormData = options.reduce((acc, option) => {
        acc[option.key] = option.value;
        return acc;
    }, {} as Record<string, any>);

    const [formData, setFormData] = useState(initialFormData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) : value;
        setFormData((prevData) => ({
            ...prevData,
            [name]: parsedValue,
        }));
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value || '',
        }));
    };

    const handleInputChange = (key: string, value: string) => {
        if (value === "null") {
            setFormData((prevData) => ({
                ...prevData,
                [key]: '',
            }));
            return;
        }
    
        setFormData((prevData) => ({
            ...prevData,
            [key]: value,
        }));
    }

    const handleSwitchChange = (key: string, value: boolean) => {
        setFormData((prevData) => ({
            ...prevData,
            [key]: value,
        }));
    };

    const handleMultiSelectChange = (key: string, value: string[], valueType?: string) => {
        setFormData((prevData) => {
            const updatedData = {
                ...prevData,
                [key]: value,
            };

            if (valueType === 'number' && Array.isArray(value)) {
                updatedData[key] = value.map(tag => Number(tag));
            }

            return updatedData;
        });
    }

    const submitItem = trpc.editItemStats.useMutation({
        onError(error) {
            toast.error("An error occurred while submitting changes: " + error.message);
            console.error(error);
            setError(error);
            setLoading(false);
        },
        onSuccess() {
            toast.success("Changes submitted successfully");
            setLoading(false);
            router.refresh();
            router.replace("/store/" + data.item.id);
        },
        onMutate() {
            setLoading(true);
        }
    });

    const filterChangedValues = (originalData: Record<string, any>, newData: Record<string, any>) => {
        const changedData: Record<string, any> = {};
        for (const key in newData) {
            if (newData[key] !== originalData[key] && newData[key] !== null) {
                changedData[key] = newData[key];
            }
        }
        return changedData;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        const changedData = filterChangedValues(data.item.stats, formData);

        if (Object.keys(changedData).length === 0) {
            toast.info("No changes to submit");
            return;
        }

        try {
            await submitItem.mutateAsync({ ...changedData, id: data.item.id });
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {options.map((option) => (
                    <div key={option.key} className="flex flex-col">
                        <label htmlFor={option.key} className="mb-2 font-semibold flex justify-between">
                            <span>{option.name}</span>
                            {option.adminOnly && (
                                <span className="text-right text-sm my-auto text-neutral-400 flex gap-x-1.5">
                                    Admin Only
                                    <Lock className="h-4 w-4 my-auto" />
                                </span>
                            )}
                        </label>
                        {option.type === "long_string" ? (
                            <Textarea
                                id={option.key}
                                name={option.key}
                                value={formData[option.key] || ''}
                                onChange={handleTextareaChange}
                                className="border rounded p-2"
                            />
                        ) : option.type === "boolean" ? (
                            <Switch
                                id={option.key}
                                name={option.key}
                                checked={formData[option.key] as boolean}
                                onCheckedChange={(value) => handleSwitchChange(option.key, value)}
                            />
                        ) : option.type === "enum" ? (
                            <Select onValueChange={(value) => handleInputChange(option.key, value)} value={formData[option.key] as string}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {option.options && Object.entries(option.options).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                    <SelectSeparator />
                                    <Button
                                        className="w-full px-2"
                                        variant="secondary"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleInputChange(option.key, "null");
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </SelectContent>
                            </Select>
                        ) : option.type === "multi-select" ? (
                            <MultiSelect
                                options={option.opts || []}
                                onValueChange={(value) => handleMultiSelectChange(option.key, value, option.valueType)}
                                defaultValue={Array.isArray(option.value) ? option.value.map(String) : []}
                                placeholder="Select tags"
                            />
                        ) : (
                            <Input
                                id={option.key}
                                name={option.key}
                                type={option.type}
                                value={formData[option.key] || ''}
                                onChange={handleChange}
                                className="border rounded p-2"
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex space-x-2 items-center">
                <Button type="submit" variant="default">
                    {loading ? (
                        <>
                            <Spinner width="12" height="12" className="mr-2.5 fill-white" />
                            Submitting...
                        </>
                    ) : (
                        "Submit"
                    )}
                </Button>
                <Link href={"/store/" + data.item.id}>
                    <Button variant="secondary">Cancel</Button>
                </Link>
            </div>
        </form>
    );
}