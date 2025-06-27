import { useEffect, useRef } from 'react'
import { createChart, IChartApi, LineData, LineSeriesOptions, ColorType } from 'lightweight-charts'

interface TokenChartProps {
  mint: string
}

export default function TokenChart({ mint }: TokenChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<IChartApi | null>(null)

  useEffect(() => {
    let chart: IChartApi | null = null
    let priceSeries: any = null
    let supplySeries: any = null
    let destroyed = false

    async function fetchAndRender() {
      const res = await fetch(`/api/tokens/${mint}/chart`)
      const data = await res.json()
      if (!data.success) return
      const chartData = data.chartData
      if (!chartRef.current) return
      if (chartInstance.current) {
        chartInstance.current.remove()
      }
      chart = createChart(chartRef.current, {
        width: chartRef.current.offsetWidth,
        height: 320,
        layout: { background: { type: ColorType.Solid, color: '#18181b' }, textColor: '#fff' },
        grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
        timeScale: { timeVisible: true, secondsVisible: false },
      })
      chartInstance.current = chart
      // Price line
      priceSeries = chart.addSeries({ type: 'line', color: '#facc15', lineWidth: 2 })
      // Supply line
      supplySeries = chart.addSeries({ type: 'line', color: '#38bdf8', lineWidth: 2 })
      // Format data
      const priceData: LineData[] = chartData.map((d: any) => ({ time: Math.floor(d.time / 1000), value: d.price }))
      const supplyData: LineData[] = chartData.map((d: any) => ({ time: Math.floor(d.time / 1000), value: d.supply }))
      priceSeries.setData(priceData)
      supplySeries.setData(supplyData)
      chart.timeScale().fitContent()
    }
    fetchAndRender()
    return () => {
      destroyed = true
      if (chartInstance.current) {
        chartInstance.current.remove()
        chartInstance.current = null
      }
    }
  }, [mint])

  return (
    <div ref={chartRef} style={{ width: '100%', height: 320 }} />
  )
} 