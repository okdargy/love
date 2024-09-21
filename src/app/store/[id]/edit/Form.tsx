"use client";

import { z } from "zod";
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

const options = [
    {
        name: "Value",
        key: "value",
        type: "number",
    },
    {
        name: "Demand",
        key: "demand",
        type: "string",
    },
    {
        name: "Trend",
        key: "trend",
        type: "string",
    },
    {
        name: "OG Stock",
        key: "ogStock",
        type: "number",
    },
    {
        name: "Fun Fact",
        key: "funFact",
        type: "string",
    },
    {
        name: "Effect",
        key: "effect",
        type: "string",
    },
    {
        name: "Rare",
        key: "rare",
        type: "boolean",
    },
    {
        name: "Freaky",
        key: "freaky",
        type: "boolean",
    },
    {
        name: "Projected",
        key: "projected",
        type: "boolean",
    },
];

export default function Form({ id, name }: { id: number, name: string }) {
    const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"mutation", any, any>> | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState(
        options.reduce((acc, option) => {
            switch (option.type) {
                case 'number':
                    acc[option.key] = 0;
                    break;
                case 'boolean':
                    acc[option.key] = false;
                    break;
                default:
                    acc[option.key] = '';
            }
            return acc;
        }, {} as Record<string, string | number | boolean>)
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
            setError(error);
            setLoading(false);
        },
        onSuccess(data) {
            toast.success("Item updated successfully");
            setLoading(false);
        },
        onMutate() {
            setLoading(true);
        }
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitItem.mutateAsync({ ...formData, id });
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };
    
    // Form component JSX
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