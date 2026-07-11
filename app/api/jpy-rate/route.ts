import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch("https://www.shishihuilv.com/JPY-CNY.html", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GundamWiki/1.0)" },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`汇率页面请求失败：${response.status}`);
    const html = await response.text();
    const descriptionRate = html.match(/当前汇率:1日元=([0-9.]+)人民币/);
    const serialValues = [...html.matchAll(/"time":"([^"]+)","value":([0-9.]+)/g)];
    const latest = serialValues.at(-1);
    const rate = Number(descriptionRate?.[1] ?? latest?.[2]);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("未读取到有效汇率");
    return NextResponse.json({ rate, updatedAt: latest?.[1] ?? new Date().toISOString(), source: "实时汇率网" });
  } catch {
    return NextResponse.json({ rate: 0.042001, updatedAt: new Date().toISOString(), source: "缓存参考汇率", fallback: true });
  }
}
