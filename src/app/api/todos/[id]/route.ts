import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { completed } = await request.json();
  const todo = await prisma.todo.update({
    where: { id },
    data: { completed },
  });
  return NextResponse.json(todo);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await prisma.todo.delete({
    where: { id },
  });
  return new NextResponse(null, { status: 204 });
}
