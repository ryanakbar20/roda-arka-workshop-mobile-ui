import { supabase } from "./supabase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getWorkshopId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workshop_accounts")
    .select("workshop_id")
    .eq("user_id", user.id)
    .single();

  return data?.workshop_id || null;
};
