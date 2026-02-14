import { supabase } from "./supabase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getWorkshopId = async (): Promise<string | null> => {
  const details = await getWorkshopDetails();
  return details?.workshop_id || null;
};

export const getWorkshopDetails = async (): Promise<{ workshop_id: string; workshop_name: string; user_id: string } | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;

    const { data: workshopAccount, error: accountError } = await supabase
      .from("workshop_accounts")
      .select("workshop_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (accountError || !workshopAccount) {
      console.error("getWorkshopDetails account error:", accountError);
      return null;
    }

    const { data: workshop, error: workshopError } = await supabase
      .from("workshops")
      .select("name")
      .eq("id", workshopAccount.workshop_id)
      .maybeSingle();

    if (workshopError || !workshop) {
      console.error("getWorkshopDetails workshop error:", workshopError);
      return null;
    }

    return {
      workshop_id: workshopAccount.workshop_id,
      workshop_name: workshop.name,
      user_id: data.user.id
    };
  } catch (err) {
    console.error("getWorkshopDetails catch:", err);
    return null;
  }
};
