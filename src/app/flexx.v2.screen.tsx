import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { View } from '@/components/layout/view.component'
import { RiInfoI, RiInstagramLine, RiWhatsappLine } from '@remixicon/react'

function FlexxCard() {
  return (
    <View className="size-full relative overflow-hidden">
      <View className="absolute items-center bottom-1/4 h-7 w-full flex-row justify-between scale-[1.1] origin-center">
        <View className="bg-cardd h-full aspect-square  rounded-full"></View>
        <View className="w-full !h-0 mx-2 border-cardd border-dotted border-t-[15px]"></View>
        <View className="bg-cardd h-full aspect-square  rounded-full"></View>
      </View>
    </View>
  )
}

export function FlexxV2AppScreen() {
  const cardWidth = 90
  const padding = (100 - cardWidth) / 4
  return (
    <View className="overflow-y-scroll bg-cardd flex-1 ">
      <NoiseComponent>
        <TabHeader title="Flex On'Em">
          <Pressable className="w-12 h-12 rounded-full bg-warning-yellow/10 flex items-center justify-center">
            <RiInfoI size={24} className="text-warning-yellow" />
          </Pressable>
        </TabHeader>

        <View className="grid grid-rows-6 flex-1 w-full">
          <View className="row-span-5 flex-row gap-3 overflow-x-scroll snap-x snap-mandatory">
            <View
              style={{
                width: `${padding}%`,
              }}
              className=" shrink-0 h-full snap-start"
            />

            {Array.from({ length: 2 }).map((_, index) => {
              return (
                <View
                  key={index}
                  style={{
                    width: `${cardWidth}%`,
                  }}
                  className="snap-center bg-card-light shrink-0 rounded-3xl"
                >
                  <FlexxCard />
                </View>
              )
            })}
            <View
              style={{
                width: `${padding}%`,
              }}
              className=" shrink-0 h-full snap-start"
            />
          </View>
          <View className="row-span-1 justify-center">
            <View className=" flex-row gap-3 items-center justify-center">
              <Pressable className="w-12 h-12 rounded-full bg-pink-600/10 flex items-center justify-center">
                <RiInstagramLine size={24} className="text-pink-600" />
              </Pressable>
              <Button label="Flexx This" />

              <Pressable className="w-12 h-12 rounded-full bg-success-green/10 flex items-center justify-center">
                <RiWhatsappLine size={24} className="text-success-green" />
              </Pressable>
            </View>
            <BottomNotch />
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
