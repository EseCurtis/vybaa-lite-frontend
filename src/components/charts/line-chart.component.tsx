import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

export interface LineChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface LineChartProps {
  data: LineChartDataPoint[]
  height?: number
  color?: string
  showGrid?: boolean
  showLabels?: boolean
  animate?: boolean
}

export function LineChart({
  data,
  height = 200,
  color = '#ffffff',
  showGrid = true,
  showLabels = true,
  animate = true,
}: LineChartProps) {
  const { points, maxValue, yScale, xScale } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: '', maxValue: 0, yScale: 1, xScale: 1 }
    }

    const maxValue = Math.max(...data.map(d => d.value), 1)
    const padding = 20
    const chartHeight = height - padding * 2
    const chartWidth = 100 - padding * 2

    // Create SVG path points
    const pathPoints = data.map((point, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth
      const y = padding + chartHeight - (point.value / maxValue) * chartHeight
      return `${x},${y}`
    }).join(' L ')

    return {
      points: data.length > 0 ? `M ${pathPoints}` : '',
      maxValue,
      yScale: chartHeight / maxValue,
      xScale: chartWidth / Math.max(data.length - 1, 1),
    }
  }, [data, height])

  const pathLength = useMemo(() => {
    if (!data || data.length < 2) return 0
    let length = 0
    for (let i = 1; i < data.length; i++) {
      const dx = xScale
      const dy = (data[i].value - data[i - 1].value) * yScale
      length += Math.sqrt(dx * dx + dy * dy)
    }
    return length
  }, [data, xScale, yScale])

  if (!data || data.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height }}>
        <Text className="text-white/40 text-sm font-bbh">
          No data to display
        </Text>
      </View>
    )
  }

  const padding = 20
  const chartHeight = height - padding * 2
  const chartWidth = 100 - padding * 2

  return (
    <View className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {showGrid && (
          <g opacity={0.1}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + chartHeight - chartHeight * ratio
              return (
                <line
                  key={i}
                  x1={padding}
                  y1={y}
                  x2={100 - padding}
                  y2={y}
                  stroke={color}
                  strokeWidth={0.5}
                />
              )
            })}
          </g>
        )}

        {/* Gradient fill under line */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area under the line */}
        {data.length > 0 && (
          <motion.path
            d={`${points} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`}
            fill="url(#chartGradient)"
            initial={animate ? { opacity: 0 } : undefined}
            animate={animate ? { opacity: 1 } : undefined}
            transition={animate ? { duration: 0.6, delay: 0.2 } : undefined}
          />
        )}

        {/* Line */}
        {data.length > 0 && (
          <motion.path
            d={points}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
            animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
            transition={animate ? { duration: 1, ease: 'easeOut' } : undefined}
          />
        )}

        {/* Data points */}
        {data.map((point, index) => {
          const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth
          const y = padding + chartHeight - (point.value / maxValue) * chartHeight

          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r={1.5}
              fill={color}
              initial={animate ? { scale: 0, opacity: 0 } : undefined}
              animate={animate ? { scale: 1, opacity: 1 } : undefined}
              transition={animate ? { duration: 0.3, delay: 0.8 + index * 0.05 } : undefined}
            />
          )
        })}
      </svg>

      {/* X-axis labels (dates) */}
      {showLabels && data.length > 0 && (
        <View className="flex-row justify-between px-5 mt-2">
          <Text className="text-white/40 text-[10px] font-bbh">
            {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          {data.length > 1 && (
            <Text className="text-white/40 text-[10px] font-bbh">
              {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
