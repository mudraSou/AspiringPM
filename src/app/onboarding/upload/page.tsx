import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import UploadForm from "./upload-form";

export default async function UploadPage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    });
    if (user?.onboardingCompleted) redirect("/dashboard");
  }
  return <UploadForm />;
}
