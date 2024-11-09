"use client";

import { trpc } from "@/app/_trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import Error from "@/components/Error";
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/icons";
import { toast } from "sonner";
import { ItemInfo } from "./page";
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
            [name]: value,
        }));
    };
    
    const handleInputChange = (key: string, value: string) => {
        console.log(key, value);

        if(value === "null") {
            setFormData((prevData) => ({
                ...prevData,
                [key]: null,
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
        
            console.log(updatedData);
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
            console.log(formData);
            setLoading(true);
        }
    });
    
    const filterChangedValues = (originalData: Record<string, any>, newData: Record<string, any>) => {
        const changedData: Record<string, any> = {};
        for (const key in newData) {
            console.log(key, newData[key], originalData[key]);
            if (newData[key] !== originalData[key] && newData[key] !== null) {
                changedData[key] = newData[key];
            }
        }
        return changedData;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(loading) return;
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
        <form onSubmit={handleSubmit} className="space-y-4">
            {options.map((option) => (
                <div key={option.key} className="flex flex-col">
                    <label htmlFor={option.key} className="mb-2 font-semibold">
                        {option.name}
                    </label>
                    {option.type === "long_string" ? (
                        <Textarea
                            id={option.key}
                            name={option.key}
                            value={formData[option.key] as string}
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
                            value={formData[option.key] as string}
                            onChange={handleChange}
                            className="border rounded p-2"
                        />
                    )}
                </div>
            ))}
            <Button type="submit" variant="default">
                {loading ? (
                    <>
                        <Spinner width="24" height="24" className="fill-white mr-3" />
                        Submitting...
                    </>
                ) : (
                    "Submit"
                )}
            </Button>
        </form>
    );
}