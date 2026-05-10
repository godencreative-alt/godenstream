"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateAdminSettings, verifyAdminSession } from "@/lib/admin/store";

export async function saveAdminSettings(formData: FormData) {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get("dramashort_admin")?.value)) {
    redirect("/admin/login");
  }

  await updateAdminSettings(formData);
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?status=saved");
}
