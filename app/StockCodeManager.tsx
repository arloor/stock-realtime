"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface StockEntry {
  code: string;
  count?: number;
}

export function StockCodeManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newCount, setNewCount] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editCount, setEditCount] = useState("");

  // 初始化数据
  useEffect(() => {
    const urlCodes = searchParams?.getAll("code");
    const storedCodes = localStorage.getItem("stockCodes");

    let selectedCodes: string[] = [];
    if (urlCodes && urlCodes.length > 0) {
      selectedCodes = urlCodes;
      localStorage.setItem("stockCodes", JSON.stringify(selectedCodes));
    } else if (storedCodes) {
      selectedCodes = JSON.parse(storedCodes);
      updateURL(selectedCodes);
    }

    // 解析代码和持仓数量
    const parsedEntries = selectedCodes.map((code) => {
      const [stockCode, count] = code.split("-");
      return {
        code: stockCode,
        count: count ? parseInt(count) : undefined,
      };
    });
    setEntries(parsedEntries);
  }, []);

  // 更新URL
  const updateURL = (codes: string[]) => {
    const params = new URLSearchParams(searchParams);
    params.delete("code");
    codes.forEach((code) => params.append("code", code));
    router.replace(`?${params.toString()}`);
  };

  // 保存更改
  const handleSave = () => {
    const codes = entries.map((entry) =>
      entry.count ? `${entry.code}-${entry.count}` : entry.code
    );
    localStorage.setItem("stockCodes", JSON.stringify(codes));
    updateURL(codes);
    setShowForm(false);
  };

  // 检查股票代码是否重复
  const isDuplicateCode = (code: string) => {
    return entries.some(
      (entry) => entry.code.toLowerCase() === code.toLowerCase()
    );
  };

  // 添加新股票
  const handleAdd = () => {
    if (!newCode) return;

    const normalizedCode = newCode.toLowerCase();
    if (isDuplicateCode(normalizedCode)) {
      alert("该股票代码已存在！");
      return;
    }

    setEntries([
      ...entries,
      {
        code: normalizedCode,
        count: newCount ? parseInt(newCount) : undefined,
      },
    ]);
    setNewCode("");
    setNewCount("");
  };

  // 删除股票
  const handleDelete = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  // 开始编辑
  const handleStartEdit = (index: number, count?: number) => {
    setEditIndex(index);
    setEditCount(count?.toString() || "");
  };

  // 保存编辑
  const handleSaveEdit = (index: number) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      count: editCount ? parseInt(editCount) : undefined,
    };
    setEntries(newEntries);
    setEditIndex(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditCount("");
  };

  // 上移股票
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newEntries = [...entries];
    [newEntries[index - 1], newEntries[index]] = [
      newEntries[index],
      newEntries[index - 1],
    ];
    setEntries(newEntries);
  };

  // 下移股票
  const handleMoveDown = (index: number) => {
    if (index === entries.length - 1) return;
    const newEntries = [...entries];
    [newEntries[index], newEntries[index + 1]] = [
      newEntries[index + 1],
      newEntries[index],
    ];
    setEntries(newEntries);
  };

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
      >
        设置股票
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black bg-opacity-60"
            onClick={() => setShowForm(false)}
          />

          {/* 模态框内容 */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">股票设置</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2 text-gray-900">当前股票列表：</h3>
              {entries.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  {/* 移动按钮列 */}
                  <div className="flex gap-1 w-16">
                    {index > 0 && (
                      <button
                        onClick={() => handleMoveUp(index)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="上移"
                      >
                        <ChevronUpIcon className="w-5 h-5" />
                      </button>
                    )}
                    {index < entries.length - 1 && (
                      <button
                        onClick={() => handleMoveDown(index)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="下移"
                      >
                        <ChevronDownIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* 股票代码列 */}
                  <div className="w-28">
                    <span className="text-gray-900">{entry.code}</span>
                  </div>

                  {/* 持仓数量列 */}
                  <div className="w-24">
                    {editIndex === index ? (
                      <input
                        type="number"
                        value={editCount}
                        onChange={(e) => setEditCount(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-gray-900"
                        min="0"
                        placeholder="持仓数量"
                      />
                    ) : (
                      <span className="text-gray-600">
                        ({entry.count || 0}手)
                      </span>
                    )}
                  </div>

                  {/* 操作按钮列 */}
                  <div className="flex gap-2">
                    {editIndex === index ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(index, entry.count)}
                          className="px-3 py-1 text-sm border border-gray-300 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 hover:border-gray-400"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="px-3 py-1 text-sm border border-red-200 bg-red-50 text-red-500 rounded hover:bg-red-100 hover:border-red-300"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="代码(sz000001)"
                className="px-2 py-1 border rounded text-gray-900 w-36"
              />
              <input
                type="number"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                placeholder="持仓数量(手)"
                className="px-2 py-1 border rounded w-32 text-gray-900"
                min="0"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                添加
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
