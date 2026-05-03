"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KitchenPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kitchen/orders");
  }, [router]);
  return null;
}
