"use client";

import { createContext, useContext } from "react";
import { validateRequest } from "@/lib/auth";

type ContextType = Awaited<ReturnType<typeof validateRequest>>;

const SessionContext = createContext<ContextType>({
  session: null,
  user: null,
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children, value }: React.PropsWithChildren<{ value: ContextType }>) => {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};