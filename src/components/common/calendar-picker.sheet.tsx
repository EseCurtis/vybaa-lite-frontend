import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useMemo, useState } from 'react'
import { BottomNotch } from './notch.component'

function getMonthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1)
  const firstDay = first.getDay() // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function CalendarPickerSheet({
  value,
  onConfirm,
  onCancel,
}: {
  value: Date
  onConfirm: (date: Date) => void
  onCancel?: () => void
}) {
  const [cursor, setCursor] = useState(new Date(value))
  const [selected, setSelected] = useState<Date>(new Date(value))
  const [isYearView, setIsYearView] = useState(false)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = useMemo(() => getMonthMatrix(year, month), [year, month])
  const label = cursor.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          className="rounded-full border border-[#2a2a2a] px-3 py-1"
          onPress={() =>
            setCursor(
              new Date(
                year + (isYearView ? -1 : 0),
                month + (isYearView ? 0 : -1),
                1,
              ),
            )
          }
        >
          <Text className="text-white/80">◀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsYearView((v) => !v)}>
          <Text className="text-white font-bbh">{label}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full border border-[#2a2a2a] px-3 py-1"
          onPress={() =>
            setCursor(
              new Date(
                year + (isYearView ? 1 : 0),
                month + (isYearView ? 0 : 1),
                1,
              ),
            )
          }
        >
          <Text className="text-white/80">▶</Text>
        </TouchableOpacity>
      </View>

      {isYearView ? (
        <View className="grid grid-cols-4 gap-2">
          {months.map((m, idx) => (
            <TouchableOpacity
              key={m}
              className={`h-10 rounded-lg items-center justify-center ${idx === month ? 'bg-white' : 'bg-[#1a1a1a] border border-[#2a2a2a]'}`}
              onPress={() => {
                setCursor(new Date(year, idx, 1))
                setIsYearView(false)
              }}
            >
              <Text
                className={`text-sm ${idx === month ? 'text-black font-semibold' : 'text-white'}`}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <>
          <View className="grid grid-cols-7 gap-2 ">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text
                key={d}
                className="text-white/60 text-center text-xs font-bbh"
              >
                {d}
              </Text>
            ))}
            {cells.map((d, idx) => (
              <TouchableOpacity
                key={idx}
                className={`h-9 rounded-lg items-center justify-center ${!d ? 'bg-transparent' : selected && d.toDateString() === selected.toDateString() ? 'bg-white' : 'bg-[#1a1a1a] border border-[#2a2a2a]'}`}
                onPress={() => d && setSelected(d)}
                disabled={!d}
              >
                <Text
                  className={`text-sm ${!d ? 'text-transparent' : selected && d.toDateString() === selected.toDateString() ? 'text-black font-semibold' : 'text-white'}`}
                >
                  {d ? d.getDate() : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-3 pt-3">
            <TouchableOpacity
              className="w-1/3 bg-red-500/10 justify-center flex  rounded-xl py-3 bordser border-[#2a2a2a]"
              onPress={onCancel}
            >
              <Text className="text-red-500 text-center font-bbh">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-2/3 justify-center flex rounded-xl py-3 bg-white"
              onPress={() => onConfirm(selected)}
            >
              <Text className="text-black text-center font-bbh font-semibold">
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <BottomNotch />
    </View>
  )
}
