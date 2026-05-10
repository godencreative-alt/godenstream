"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAdminSettings } from "@/lib/admin/store";

export async function saveAdminSettings(formData: FormData) {
  await updateAdminSettings(formData);
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?status=saved");
}
