"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect, use } from "react";

export function TableViewControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [useTableView, setUseTableView] = useState(
    searchParams.get("view") === "table"
  );

  const updateUrlAndState = (newState: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (newState) {
      params.set("view", "table");
      localStorage.setItem("view", "table");
    } else {
      params.delete("view");
      localStorage.removeItem("view");
    }

    window.location.href = `${pathname}?${params.toString()}`; //变更url，跳转
    setUseTableView(newState);
  };

  // useEffect(() => {
  //   let intervalId: NodeJS.Timeout;
  //   if (autoRefresh) {
  //     intervalId = setInterval(() => {
  //       router.refresh(); // 这里进行刷新nextjs的服务端组件
  //     }, intervalSec * 1000);
  //   }
  //   return () => {
  //     if (intervalId) clearInterval(intervalId);
  //   };
  // }, [autoRefresh, router]);

  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor="auto-refresh">表格视图：</Label>
      <Switch
        checked={useTableView}
        onCheckedChange={updateUrlAndState}
        id="auto-refresh"
      />
    </div>
  );
}
