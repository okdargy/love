"use server"

import { validateRequest } from "@/lib/auth";
import { forbidden } from "next/navigation";

import Error from "@/components/Error";
import Content from "./Content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: PageProps) {
  const { user } = await validateRequest();
  const resolvedParams = await params;

  if (!user || user.role === "user") {
    return forbidden();
  }

  if (isNaN(parseInt(resolvedParams.id))) {
    return <Error message="Invalid ID" />
  }

  return (
    <Content id={parseInt(resolvedParams.id)} />
  );
}