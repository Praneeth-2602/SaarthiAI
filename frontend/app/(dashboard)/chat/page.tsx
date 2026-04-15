"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentCaseId } from "@/lib/store";

export default function ChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const caseId = getCurrentCaseId();
    if (caseId) {
      router.replace(`/case/${caseId}`);
      return;
    }
    router.replace("/");
  }, [router]);

  return <div className="panel">Opening the latest active case...</div>;
}
