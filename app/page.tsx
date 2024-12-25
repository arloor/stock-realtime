import Link from "next/link";
import { AutoRefreshControl } from "./components/AutoRefreshControl";
import iconv from "iconv-lite";
import { StockCodeManager } from "./StockCodeManager";
import { TableViewControl } from "./TableViewControl";

export default async function Page(props: {
  // https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
  searchParams?: Promise<{
    code?: string | string[] | undefined;
    view?: string | undefined; // 新增view参数
    colored?: string | undefined; // 新增colored参数
  }>;
}) {
  const searchParams = await props.searchParams;
  const view = searchParams?.view || "card"; // 默认使用卡片视图
  const colored = searchParams?.colored !== "false"; // 默认为true
  //   console.log("code", searchParams?.code, typeof searchParams?.code);
  // 如果searchParams?.code是单个string，转成string[]
  let codes: { code: string; count?: number }[] = [];
  if (typeof searchParams?.code === "string") {
    const [code, count] = searchParams.code.split("-");
    codes = [{ code, count: count ? parseInt(count) : undefined }];
  } else {
    codes = (searchParams?.code || []).map((c) => {
      const [code, count] = c.split("-");
      return { code, count: count ? parseInt(count) : undefined };
    });
  }

  const codesStr = codes.map((c) => c.code).join(",");
  const response = await fetch(`https://hq.sinajs.cn/list=${codesStr}`, {
    headers: { Referer: "http://finance.sina.com.cn/" },
  });

  // 获取响应的 ArrayBuffer
  const buffer = await response.arrayBuffer();
  // 将 GBK 编码的 buffer 转换为 UTF-8 字符串
  const res = iconv.decode(Buffer.from(buffer), "gbk");

  // 解析股票数据的函数
  const parseStockData = (str: string, count?: number) => {
    const matches = str.match(/var hq_str_(\w+)="([^"]+)"/);
    if (matches && matches[2]) {
      const stockCode = matches[1]; // 完整的代码，如 sz002212
      const market = stockCode.substring(0, 2); // sz 或 sh
      const code = stockCode.substring(2); // 纯数字代码
      const values = matches[2].split(",");
      const currentPrice = parseFloat(values[3]);
      const yesterdayClose = parseFloat(values[2]);
      const priceChange =
        code.startsWith("5") || code.startsWith("15") //指数ETF，保留3位
          ? (currentPrice - yesterdayClose).toFixed(3)
          : (currentPrice - yesterdayClose).toFixed(2);
      const changePercent = (
        ((currentPrice - yesterdayClose) / yesterdayClose) *
        100
      ).toFixed(2);

      return {
        name: values[0],
        price: currentPrice,
        market, // 新增市场类型
        code, // 新增股票代码
        open: values[1],
        yesterday_close: yesterdayClose,
        high: values[4],
        low: values[5],
        volume: values[8],
        date: values[30],
        time: values[31],
        priceChange, // 涨跌额
        changePercent, // 涨跌幅
        count, // 新增持仓数量
        profit: count
          ? code.startsWith("5") || code.startsWith("15") //指数ETF，保留1位
            ? (parseFloat(priceChange) * count * 100).toFixed(1)
            : (parseFloat(priceChange) * count * 100).toFixed(0)
          : undefined, // 新增持仓盈亏
      };
    }
    return null;
  };

  // 格式化成交量的函数
  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 100000000) {
      return (num / 100000000).toFixed(2) + "亿";
    } else if (num >= 10000) {
      return (num / 10000).toFixed(0) + "万";
    }
    return volume;
  };

  // 为每个股票代码解析数据
  const stocksData = codes.map((codeObj) => {
    const regex = new RegExp(`var hq_str_${codeObj.code}="([^"]+)"`);
    const matches = res.match(regex);
    return matches
      ? parseStockData(
          `var hq_str_${codeObj.code}="${matches[1]}"`,
          codeObj.count
        )
      : null;
  });

  // 计算今日盈亏总和
  const totalProfit = stocksData
    .reduce(
      (sum, stock) => sum + (stock?.profit ? parseFloat(stock.profit) : 0),
      0
    )
    .toFixed(1);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-start items-center mt-4 mb-4 gap-4 sm:gap-2">
        <div className="flex flex-row justify-end items-center gap-2">
          <div
            className={`font-bold ${colored ? (parseFloat(totalProfit) >= 0 ? "text-red-500" : "text-green-500") : ""}`}
          >
            今日盈亏总计：{totalProfit}
          </div>
        </div>
        <div className="flex flex-row justify-end items-center gap-2">
          <TableViewControl />
          <AutoRefreshControl intervalSec={3} />
        </div>
      </div>
      {view === "table" ? (
        // 表格视图
        <div className="overflow-x-auto">
          {/* min-w-full */}
          <table className="min-w-[200px] table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 min-w-16">名称代码</th>
                <th className="px-4 py-2">当前价</th>
                <th className="px-4 py-2">涨跌幅</th>
                <th className="px-4 py-2">涨跌额</th>
                <th className="px-4 py-2">今日盈亏</th>
                <th className="px-4 py-2">成交量</th>
                <th className="px-4 py-2">持仓(手)</th>
                <th className="px-4 py-2">最高</th>
                <th className="px-4 py-2">最低</th>
                <th className="px-4 py-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {stocksData.map((stock, index) =>
                stock ? (
                  <tr key={codes[index].code} className="border-b">
                    <td className="px-4 py-2">
                      <Link
                        // className="text-link"
                        className="hidden sm:block"
                        target="_blank"
                        href={`https://quote.eastmoney.com/concept/${stock.market}${stock.code}.html`}
                      >
                        <strong>
                          {stock.name} ({stock.market}
                          {stock.code})
                        </strong>
                      </Link>
                      <Link
                        className="block sm:hidden"
                        href={`https://wap.eastmoney.com/quote/stock/${stock.market === "sz" ? "0" : "1"}.${stock.code}.html`}
                      >
                        <strong>{stock.name}</strong>
                      </Link>
                    </td>
                    <td
                      className={`px-4 py-2 ${colored ? (parseFloat(stock.priceChange) >= 0 ? "text-red-500" : "text-green-500") : ""}`}
                    >
                      <strong>{stock.price === 0 ? "-" : stock.price}</strong>
                    </td>
                    <td
                      className={`px-4 py-2 ${colored ? (parseFloat(stock.priceChange) >= 0 ? "text-red-500" : "text-green-500") : ""}`}
                    >
                      <strong>
                        {stock.price === 0 ? "-" : stock.changePercent}%
                      </strong>
                    </td>
                    <td
                      className={`px-4 py-2 ${colored ? (parseFloat(stock.priceChange) >= 0 ? "text-red-500" : "text-green-500") : ""}`}
                    >
                      <strong>
                        {stock.price === 0 ? "-" : stock.priceChange}
                      </strong>
                    </td>
                    <td
                      className={`px-4 py-2 ${colored ? (stock.profit && parseFloat(stock.priceChange) >= 0 ? "text-red-500" : "text-green-500") : ""}`}
                    >
                      <strong>{stock.profit || "-"}</strong>
                    </td>
                    <td className="px-4 py-2">{formatVolume(stock.volume)}</td>
                    <td className="px-4 py-2">{stock.count || "-"}</td>
                    <td className="px-4 py-2">{stock.high}</td>
                    <td className="px-4 py-2">{stock.low}</td>
                    <td className="px-4 py-2">
                      {stock.date} {stock.time}
                    </td>
                  </tr>
                ) : (
                  <tr key={codes[index].code}>
                    <td colSpan={7} className="px-4 py-2 text-center">
                      无数据
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // 卡片视图（原有的展示方式）
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 width-full">
          {stocksData.map((stock, index) => (
            <div key={codes[index].code} className="p-4 border rounded-lg">
              {stock ? (
                <>
                  <div className="font-bold [&_a]:text-link">
                    <Link
                      className="hidden sm:block"
                      target="_blank"
                      href={`https://quote.eastmoney.com/concept/${stock.market}${stock.code}.html`}
                    >
                      {stock.name} ({stock.market}
                      {stock.code})
                    </Link>
                    <Link
                      className="block sm:hidden"
                      href={`https://wap.eastmoney.com/quote/stock/${stock.market === "sz" ? "0" : "1"}.${stock.code}.html`}
                    >
                      {stock.name} ({stock.market}
                      {stock.code})
                    </Link>
                  </div>
                  <div
                    className={
                      colored
                        ? parseFloat(stock.priceChange) >= 0
                          ? "text-red-500"
                          : "text-green-500"
                        : ""
                    }
                  >
                    <strong>
                      当前价: {stock.price === 0 ? "-" : stock.price}
                    </strong>
                  </div>
                  <div
                    className={
                      colored
                        ? parseFloat(stock.priceChange) >= 0
                          ? "text-red-500"
                          : "text-green-500"
                        : ""
                    }
                  >
                    <strong>
                      涨跌幅: {stock.price === 0 ? "-" : stock.changePercent}%
                    </strong>
                  </div>
                  <div
                    className={
                      colored
                        ? parseFloat(stock.changePercent) >= 0
                          ? "text-red-500"
                          : "text-green-500"
                        : ""
                    }
                  >
                    <strong>
                      涨跌额度: {stock.price === 0 ? "-" : stock.priceChange}
                    </strong>
                  </div>

                  <div>
                    <strong>成交量: {formatVolume(stock.volume)}</strong>
                  </div>
                  <div>最高: {stock.high}</div>
                  <div>最低: {stock.low}</div>
                  {stock.count && (
                    <>
                      <div>
                        <strong>持仓: {stock.count}手</strong>
                      </div>
                      <div
                        className={
                          colored
                            ? parseFloat(stock.priceChange || "0") >= 0
                              ? "text-red-500"
                              : "text-green-500"
                            : ""
                        }
                      >
                        <strong>持仓盈亏: {stock.profit}</strong>
                      </div>
                    </>
                  )}
                  <div>
                    {stock.date} {stock.time}
                  </div>
                </>
              ) : (
                <div>无数据</div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center sm:justify-start mt-4">
        <StockCodeManager />
      </div>
    </>
  );
}
