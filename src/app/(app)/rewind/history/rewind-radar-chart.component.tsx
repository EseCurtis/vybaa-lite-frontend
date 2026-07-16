import type { ReactElement } from 'react'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { RewindWellbeingSignals } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'

type RadarSignal = {
  key: keyof RewindWellbeingSignals
  label: string
}

const RADAR_SIGNALS: RadarSignal[] = [
  { key: 'emotionalSteadiness', label: 'Steadiness' },
  { key: 'energy', label: 'Energy' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'connection', label: 'Connection' },
  { key: 'agency', label: 'Agency' },
]

const CENTER = 130
const RADIUS = 78

function getPoint(index: number, value: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / RADAR_SIGNALS.length - Math.PI / 2
  const radius = RADIUS * value
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  }
}

function getPolygonPoints(values: number[]): string {
  return values
    .map((value, index) => {
      const point = getPoint(index, value)
      return `${point.x},${point.y}`
    })
    .join(' ')
}

export function RewindRadarChart({
  signals,
}: {
  signals: RewindWellbeingSignals
}): ReactElement {
  const values = RADAR_SIGNALS.map((signal) => signals[signal.key] / 100)

  return (
    <View className="items-center gap-3">
      <svg
        aria-label="Reflection signal radar chart"
        role="img"
        viewBox="0 0 260 260"
        className="h-[252px] w-[252px] max-w-full"
      >
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            fill="none"
            points={getPolygonPoints(RADAR_SIGNALS.map(() => level))}
            stroke={colors['card-lighter-3']}
            strokeOpacity={level === 1 ? 0.32 : 0.16}
            strokeWidth="1"
          />
        ))}
        {RADAR_SIGNALS.map((signal, index) => {
          const point = getPoint(index, 1)
          const labelPoint = getPoint(index, 1.3)
          return (
            <g key={signal.key}>
              <line
                x1={CENTER}
                x2={point.x}
                y1={CENTER}
                y2={point.y}
                stroke={colors['card-lighter-3']}
                strokeOpacity="0.2"
                strokeWidth="1"
              />
              <text
                fill={colors['card-lighter-2']}
                fontFamily="Mona Sans, sans-serif"
                fontSize="9"
                textAnchor="middle"
                x={labelPoint.x}
                y={labelPoint.y + 3}
              >
                {signal.label}
              </text>
            </g>
          )
        })}
        <polygon
          fill="rgba(255, 255, 255, 0.14)"
          points={getPolygonPoints(values)}
          stroke={colors.white}
          strokeOpacity="0.86"
          strokeWidth="1.5"
        />
        {values.map((value, index) => {
          const point = getPoint(index, value)
          return <circle key={RADAR_SIGNALS[index].key} cx={point.x} cy={point.y} fill={colors.white} r="3" />
        })}
      </svg>

      <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-1 px-3">
        {RADAR_SIGNALS.map((signal) => (
          <Text key={signal.key} className="muted font-bbh text-[11px]">
            {signal.label} {signals[signal.key]}
          </Text>
        ))}
      </View>
    </View>
  )
}
