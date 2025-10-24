// not using at this moment but keeping for reference

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTodos() {
  try {
    // Artificial delay to demonstrate loading skeleton
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await prisma.todo.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    return [];
  }
}

export async function addTodo(formData: FormData) {
  const title = formData.get("title") as string;

  if (!title?.trim()) {
    return { error: "Title is required" };
  }

  try {
    await prisma.todo.create({
      data: {
        title,
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create todo" };
  }
}

export async function toggleTodo(id: string, completed: boolean) {
  try {
    await prisma.todo.update({
      where: { id },
      data: { completed: !completed },
    });
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to toggle todo:", error);
  }
}

export async function deleteTodo(formData: FormData) {
  const id = formData.get("id") as string;

  try {
    await prisma.todo.delete({
      where: { id },
    });
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to delete todo:", error);
  }
}
