import { View } from '../layout/view.component'

export function Spinner({ size = 10 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
      }}
      className="border-2 border-card-lighter-3 border-t-transparent animate-spin rounded-full"
    ></View>
  )
}
