import Link from "next/link";
import { AutoRefreshControl } from "@/app/components/AutoRefreshControl";
import iconv from "iconv-lite";
import { StockCodeManager } from "@/app/components/StockCodeManager";

export default async function Page(props: {
  // https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
  searchParams?: Promise<{
    code?: string | string[] | undefined;
  }>;
}) {
  const searchParams = await props.searchParams;
  //   console.log("code", searchParams?.code, typeof searchParams?.code);
  // 如果searchParams?.code是单个string，转成string[]
  let codes: string[] = [];
  if (typeof searchParams?.code === "string") {
    codes = [searchParams?.code];
  } else {
    codes = searchParams?.code || [];
  }
  //   console.log("codes", codes, typeof codes);
  // 将codes用英文逗号拼接
  const codesStr = codes.join(",");
  const response = await fetch(`https://hq.sinajs.cn/list=${codesStr}`, {
    headers: { Referer: "http://finance.sina.com.cn/" },
  });

  // 获取响应的 ArrayBuffer
  const buffer = await response.arrayBuffer();
  // 将 GBK 编码的 buffer 转换为 UTF-8 字符串
  const res = iconv.decode(Buffer.from(buffer), "gbk");

  // 解析股票数据的函数
  const parseStockData = (str: string) => {
    const matches = str.match(/var hq_str_(\w+)="([^"]+)"/);
    if (matches && matches[2]) {
      const stockCode = matches[1]; // 完整的代码，如 sz002212
      const market = stockCode.substring(0, 2); // sz 或 sh
      const code = stockCode.substring(2); // 纯数字代码
      const values = matches[2].split(",");
      const currentPrice = parseFloat(values[3]);
      const yesterdayClose = parseFloat(values[2]);
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
        changePercent, // 涨跌幅
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
  const stocksData = codes.map((code) => {
    const regex = new RegExp(`var hq_str_${code}="([^"]+)"`);
    const matches = res.match(regex);
    return matches
      ? parseStockData(`var hq_str_${code}="${matches[1]}"`)
      : null;
  });
  //   console.log("stocksData", stocksData);

  return (
    <>
      <StockCodeManager />
      <div className="flex flex-col sm:flex-row justify-start items-center mt-4 mb-4 gap-4 sm:gap-2">
        
        <div className="flex flex-row justify-end items-center gap-2">
          <AutoRefreshControl intervalSec={3} />
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-4">
        提示：在URL中使用code参数来查询股票，例如：?code=sz399001&code=sh000001
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 width-full">
        {stocksData.map((stock, index) => (
          <div key={codes[index]} className="p-4 border rounded-lg">
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
                  className={`${
                  parseFloat(stock.changePercent) >= 0
                    ? "text-red-500"
                    : "text-green-500"
                  }`}
                >
                   <strong>当前价: {stock.price === 0 ? "-" : stock.price}</strong>
                </div>
                <div
                  className={`${
                  parseFloat(stock.changePercent) >= 0
                    ? "text-red-500"
                    : "text-green-500"
                  }`}
                >
                  <strong>涨跌幅: {stock.price === 0 ? "-" : stock.changePercent}%</strong>
                </div>
                <div>
                  <strong>成交量: {formatVolume(stock.volume)}</strong>
                </div>
                <div>最高: {stock.high}</div>
                <div>最低: {stock.low}</div>

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
    </>
  );
}
