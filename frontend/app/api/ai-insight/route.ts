import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ insight: null, error: 'AI not configured' }, { status: 200 })
  }

  try {
    const body = await req.json()
    const { metrics, topProducts, recentSales, lowStockCount } = body

    const prompt = `You are a business analyst for a Filipino SME inventory system called Talastock.
Analyze this data and give ONE short, actionable insight (2-3 sentences max). Be specific with numbers. Use Philippine Peso (₱). Be friendly and practical.

Data:
- Total products: ${metrics.total_products}
- Sales this month: ₱${metrics.total_sales_revenue?.toLocaleString()}
- Last month sales: ₱${metrics.last_month_revenue?.toLocaleString()}
- Low stock items: ${lowStockCount}
- Top products by units sold: ${topProducts?.map((p: any) => `${p.product} (${p.sales} units, ₱${p.revenue?.toLocaleString()})`).join(', ')}
- Recent sales count: ${recentSales?.length}

Give a single insight card message. No bullet points, no headers. Just 2-3 sentences.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ insight: null }, { status: 200 })
    }

    const data = await response.json()
    const insight = data.content?.[0]?.text ?? null
    return NextResponse.json({ insight })
  } catch {
    return NextResponse.json({ insight: null }, { status: 200 })
  }
}
