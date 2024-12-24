"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function StockCodeManager() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlCodes = searchParams?.getAll("code");
    const storedCodes = localStorage.getItem("stockCodes");

    let selectedCodes: string[] = [];
    if (urlCodes && urlCodes.length > 0) {
      selectedCodes = urlCodes;
      localStorage.setItem("stockCodes", JSON.stringify(selectedCodes));
    } else if (storedCodes) {
      selectedCodes = JSON.parse(storedCodes);
      const params = new URLSearchParams(searchParams);
      selectedCodes.forEach((code) => params.append("code", code));
      router.replace(`?${params.toString()}`);
    }
  }, [searchParams, router]);

  return <></>;
}
