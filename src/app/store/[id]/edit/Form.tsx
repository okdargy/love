"use client";

import { trpc } from "@/app/_trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { TRPCClientErrorLike } from "@trpc/client";
import { BuildProcedure } from "@trpc/server";
import Error from "@/components/Error";
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/icons";
import { toast } from "sonner";
import { ItemInfo } from "./page";
import { useRouter } from "next/navigation";
import { revalidatePath } from 'next/cache'

export default function Form({ data }: { data: ItemInfo }) {
    if (!data) {
        return <Error message="Could not find item" />;
    }

    const router = useRouter();

    const options = [
        {
            name: "Value",
            key: "value",
            value: data.stats.value,
            type: "number",
        },
        {
            name: "Demand",
            key: "demand",
            value: data.stats.demand,
            type: "string",
        },
        {
            name: "Trend",
            key: "trend",
            value: data.stats.trend,
            type: "string",
        },
        {
            name: "OG Stock",
            key: "ogStock",
            value: data.stats.ogStock,
            type: "number",
        },
        {
            name: "Fun Fact",
            key: "funFact",
            value: data.stats.funFact,
            type: "string",
        },
        {
            name: "Effect",
            key: "effect",
            value: data.stats.effect,
            type: "string",
        },
        {
            name: "Rare",
            key: "rare",
            value: data.stats.rare,
            type: "boolean",
        },
        {
            name: "Freaky",
            key: "freaky",
            value: data.stats.freaky,
            type: "boolean",
        },
        {
            name: "Projected",
            key: "projected",
            value: data.stats.projected,
            type: "boolean",
        },
    ];

    const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"mutation", any, any>> | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(
        options.reduce((acc, option) => {
            acc[option.key] = option.value;
            return acc;
        }, {} as Record<string, any>)
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) : value;
        setFormData((prevData) => ({
            ...prevData,
            [name]: parsedValue,
        }));
    };
    
    const handleSwitchChange = (key: string, value: boolean) => {
        setFormData((prevData) => ({
            ...prevData,
            [key]: value,
        }));
    };
    
    const submitItem = trpc.editItemStats.useMutation({
        onError(error) {
            toast.error("An error occurred while submitting changes");
            console.error("An error occurred while submitting changes: ", error);
            setError(error);
            setLoading(false);
        },
        onSuccess() {
            toast.success("Changes submitted successfully");
            setLoading(false);
            router.refresh();
            router.replace("/store/" + data.id);
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
        if(loading) return;
        const changedData = filterChangedValues(data.stats, formData);
        
        if (Object.keys(changedData).length === 0) {
            toast.info("No changes to submit");
            return;
        }

        try {
            await submitItem.mutateAsync({ ...changedData, id: data.id });
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
                    {option.type === "boolean" ? (
                        <Switch
                            id={option.key}
                            name={option.key}
                            checked={formData[option.key] as boolean}
                            onCheckedChange={(value) => handleSwitchChange(option.key, value)}
                        />
                    ) : (
                        <Input
                            id={option.key}
                            name={option.key}
                            type={option.type}
                            value={formData[option.key] as string | number}
                            onChange={handleChange}
                            className="p-2 border rounded"
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