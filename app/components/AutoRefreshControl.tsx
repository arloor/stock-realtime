"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export function AutoRefreshControl({
  intervalSec = 60,
}: {
  intervalSec?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [autoRefresh, setAutoRefresh] = useState(
    searchParams.get("autoRefresh") === "true"
  );

  const updateUrlAndState = (newState: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (newState) {
      params.set("autoRefresh", "true");
    } else {
      params.delete("autoRefresh");
    }

    window.history.replaceState({}, "", `${pathname}?${params.toString()}`); //变更url，但是不跳转
    setAutoRefresh(newState);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        router.refresh(); // 这里进行刷新nextjs的服务端组件
      }, intervalSec * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, router]);

  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor="auto-refresh">自动刷新({intervalSec}秒)：</Label>
      <Switch
        checked={autoRefresh}
        onCheckedChange={updateUrlAndState}
        id="auto-refresh"
      />
    </div>
  );
}
