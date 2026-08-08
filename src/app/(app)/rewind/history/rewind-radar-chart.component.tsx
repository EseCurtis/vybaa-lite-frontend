import type { ReactElement } from 'react'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { RewindWellbeingSignals } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'

type RadarSignal = {
  color: string
  key: keyof RewindWellbeingSignals
  label: string
}

const RADAR_SIGNALS: RadarSignal[] = [
  {
    color: colors['success-green'],
    key: 'emotionalSteadiness',
    label: 'Steadiness',
  },
  { color: colors['warning-yellow'], key: 'energy', label: 'Energy' },
  { color: colors.accent[700], key: 'clarity', label: 'Clarity' },
  { color: colors.accent[300], key: 'connection', label: 'Connection' },
  { color: colors['card-lighter-3'], key: 'agency', label: 'Agency' },
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
  empty = false,
  signals,
}: {
  empty?: boolean
  signals: RewindWellbeingSignals
}): ReactElement {
  const values = RADAR_SIGNALS.map((signal) =>
    Math.max(0, Math.min(1, signals[signal.key] / 100)),
  )

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
        {empty ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            fill={colors.cardx}
            r="5"
            stroke={colors['card-lighter-3']}
            strokeOpacity="0.7"
          />
        ) : (
          <>
            <polygon
              fill="rgba(22, 186, 129, 0.12)"
              points={getPolygonPoints(values)}
              stroke={colors['success-green']}
              strokeOpacity="0.9"
              strokeWidth="1.75"
            />
            {values.map((value, index) => {
              const point = getPoint(index, value)
              const signal = RADAR_SIGNALS[index]
              return (
                <circle
                  key={signal.key}
                  cx={point.x}
                  cy={point.y}
                  fill={signal.color}
                  r="3.5"
                />
              )
            })}
          </>
        )}
      </svg>

      <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2 px-3">
        {RADAR_SIGNALS.map((signal) => (
          <View key={signal.key} className="flex-row items-center gap-1.5">
            <View
              className="size-1.5 rounded-full"
              style={{ backgroundColor: signal.color }}
            />
            <Text className="muted font-bbh text-[11px]">
              {signal.label} {empty ? '--' : signals[signal.key]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
