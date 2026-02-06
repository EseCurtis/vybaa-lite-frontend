import { ImageCropper } from '@/components/common/image-cropper.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import { domtoimage } from '@/plugins/dom-to-img'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { shareImageBlob } from '@/shared/utils/filesystem.util'
import { randomInRange } from '@/shared/utils/helpers.util'
import { RiImageAddLine, RiUpload2Fill } from '@remixicon/react'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useRef, useState } from 'react'

export function FlexxAppScreen() {
  const { user } = useAuth()
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ])

  const imageTypeSuggestions = [
    'Maybe your progress',
    'Maybe your vibe',
    'Maybe your wins',
    'Maybe your setup',
    'Maybe your grind',
    'Maybe your moment',
    'Maybe your journey',
    'Maybe your passion',
    'Maybe your goals',
    'Maybe your hustle',
    'Maybe your achievement',
    'Maybe your lifestyle',
    'Maybe your collection',
    'Maybe your craft',
    'Maybe your energy',
    'Maybe your focus',
    'Maybe your dedication',
    'Maybe your style',
    'Maybe your view',
    'Maybe your space',
  ]

  const generateGrid = () => {
    const maxHeight = 100
    const minHeight = 30
    const randomHeight = () => randomInRange(minHeight, maxHeight / 2)
    const [set1Height, set2Height] = Array.from({ length: 2 }, () =>
      randomHeight(),
    )

    return [
      Math.floor(set1Height),
      Math.floor(maxHeight - set1Height),
      Math.floor(set2Height),
      Math.floor(maxHeight - set2Height),
    ]
  }

  const generateHints = () => {
    // Shuffle and pick 4 unique suggestions
    const shuffled = [...imageTypeSuggestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }

  const [[box1, box2, box3, box4], setGrid] = useState(generateGrid())
  const [boxImages, setBoxImages] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ])
  const [boxHints, setBoxHints] = useState<string[]>(generateHints())
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [currentBoxIndex, setCurrentBoxIndex] = useState<number | null>(null)
  const [cropAspectRatio, setCropAspectRatio] = useState<number>(1)

  const regen = () => {
    setGrid(generateGrid())
    setBoxHints(generateHints())
  }

  const handleBoxClick = (index: number, aspectRatio: number) => {
    setCurrentBoxIndex(index)
    setCropAspectRatio(aspectRatio)
    fileInputRefs.current[index]?.click()
  }

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageToCrop(dataUrl)
      setCurrentBoxIndex(index)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImage: string) => {
    if (currentBoxIndex === null) return

    // Store cropped image locally (no backend upload)
    const newImages = [...boxImages]
    newImages[currentBoxIndex] = croppedImage
    setBoxImages(newImages)

    setImageToCrop(null)
    setCurrentBoxIndex(null)
  }

  const handleCropCancel = () => {
    setImageToCrop(null)
    setCurrentBoxIndex(null)
    // Reset file input
    if (currentBoxIndex !== null && fileInputRefs.current[currentBoxIndex]) {
      fileInputRefs.current[currentBoxIndex]!.value = ''
    }
  }

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newImages = [...boxImages]
    newImages[index] = null
    setBoxImages(newImages)
  }

  const handleExportAndShare = async (element: any) => {
    if (!element) {
      toast.error('Card not found')
      return
    }

    try {
      toast.loading('Generating image...')

      // Convert to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      })

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!)
          },
          'image/png',
          1.0,
        )
      })

      let scale = 7
      let style = {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: element.clientWidth + 'px', // use original width of DOM element to avoid part of the image being cropped out
        height: element.clientHeight + 'px', // use original height of DOM element
      }

      await domtoimage
        .toBlob(element, {
          width: element.clientWidth * scale,
          height: element.clientHeight * scale,
          style: style,
        })
        .then(async function (blobx) {
          await shareImageBlob(blobx)
        })

      toast.dismiss()
    } catch (error: any) {
      alert(error)
      console.error('Export failed:', error)
      console.log(error)
      toast.dismiss()
      toast.error('Failed to export image')
    }
  }

  const boxes = [
    { height: box1, image: boxImages[0], index: 0 },
    { height: box2, image: boxImages[1], index: 1 },
    { height: box4, image: boxImages[2], index: 2 },
    { height: box3, image: boxImages[3], index: 3 },
  ]

  const Noise = () => (
    <div
      style={{
        background: 'url(/assets/framernoise--2.png)',
        backgroundSize: 'cover',
        mixBlendMode: 'multiply',
        opacity: 0.7,

        filter: `contrast(50%) brightness(1.3) saturate(0.9)`,
      }}
      className="top-0 left-0 size-full absolute mix-blend-multiply "
    />
  )

  return (
    <View className="overflow-y-scroll [&_*]:!border-transparent">
      <TabHeader title="Flex On'Em">
        <Pressable
          onPress={() => {
            handleExportAndShare(ref.current)
          }}
          className="w-12 h-12 rounded-full bg-card-light/40 flex items-center justify-center"
        >
          <RiUpload2Fill size={24} className="text-white" />
        </Pressable>
      </TabHeader>

      <View className="px-05-mg   no-scrollbar">
        <div
          id="flexx-card"
          ref={ref}
          className="bg-[#1d1d29] overflow-hidden flex  borsder border-card-lighter flex-col relative"
        >
          <div
            style={{
              background: 'url(/assets/framernoise.png)',
              opacity: 0.9,
              filter: `contrast(70%) brightness(1.5) saturate(0.9) invert(40%)`,
            }}
            className="top-0  left-0 size-full absolute mix-blend-multiply "
          />
          <View className="flex-row gap-2  items-center bg-black/0  backdrop-blur-xl p-1 rounded-full absolute bottom-0 right-0 m-mg drop-shadow z-[99999] ">
            <View className="size-4 overflow-hidden relative z-[999]">
              <img
                src={'/assets/icon-foreground.png'}
                className="size-full "
              />
            </View>
            <Text className="text-white text-xs font-bold pr-2">vybaa.app</Text>
          </View>
          <View className="p-05-mg pb-0 size-full  z-10 flex-row justify-between">
            <View className="flex-row gap-3">
              <View className="">
                <Avatar user={user!} size={40} />
              </View>
              <View className="">
                <Text className="text-white text-sm whitespace-nowrap font-bold">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-card-lighter-2 text-xs">
                  @{user?.username}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              mask: `linear-gradient( transparent 3%, #000 14%, #000 73%, transparent 93%)`,
            }}
            className=" px-1 relative z-[999]  w-full aspect-[7/10]  gap-1 flex flex-row"
          >
            {/* Left Column */}
            <View className="flex flex-col flex-1 gap-1">
              {/* Box 1 */}
              <Pressable
                onPress={() => handleBoxClick(0, box1 / 100)}
                className="bg-card-lighter-3/10 overflow-hidden relative group flex-shrink-0"
                style={{
                  flex: `0 0 ${box1}%`,
                  height: `${box1}%`,
                }}
              >
                {boxImages[0] ? (
                  <>
                    <View
                      className="relative"
                      style={{
                        background: `url(${boxImages[0]})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <img
                        src={boxImages[0]}
                        alt="Box 1"
                        className="w-full h-full object-cover"
                      />
                      <Noise />
                    </View>
                    <motion.button
                      onClick={(e) => handleRemoveImage(0, e)}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Text className="text-white text-xs">✕</Text>
                    </motion.button>
                  </>
                ) : (
                  <View className="w-full h-full flex flex-col items-center justify-center p-3">
                    <RiImageAddLine size={24} className="text-white/30 mb-2 " />
                    <Text className="text-white/40 text-xs font-bbh text-center leading-tight">
                      {boxHints[0]}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Box 2 */}
              <Pressable
                onPress={() => handleBoxClick(1, box2 / 100)}
                className="bg-card-lighter-3/10 overflow-hidden relative group flex-shrink-0"
                style={{
                  flex: `0 0 ${box2}%`,
                  height: `${box2}%`,
                }}
              >
                {boxImages[1] ? (
                  <>
                    <View
                      className="relative size-full bg-cardd"
                      style={{
                        background: `url(${boxImages[1]})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <img
                        src={boxImages[1]}
                        alt="Box 2"
                        className="w-full h-full object-cover"
                      />
                      <Noise />
                    </View>
                    <motion.button
                      onClick={(e) => handleRemoveImage(1, e)}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Text className="text-white text-xs">✕</Text>
                    </motion.button>
                  </>
                ) : (
                  <View className="w-full h-full flex flex-col items-center justify-center p-3">
                    <RiImageAddLine size={24} className="text-white/30 mb-2" />
                    <Text className="text-white/40 text-xs font-bbh text-center leading-tight">
                      {boxHints[1]}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Right Column */}
            <View className="flex flex-col flex-1 gap-1">
              {/* Box 3 */}
              <Pressable
                onPress={() => handleBoxClick(2, box4 / 100)}
                className="bg-card-lighter-3/10 overflow-hidden size-full relative group flex-shrink-0"
                style={{
                  flex: `0 0 ${box4}%`,
                  height: `${box4}%`,
                }}
              >
                {boxImages[2] ? (
                  <>
                    <View
                      className="relative size-full"
                      style={{
                        background: `url(${boxImages[2]})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <img
                        src={boxImages[2]}
                        alt="Box 3"
                        className="w-full opacity-0 h-full object-cover"
                      />
                      <Noise />
                    </View>
                    <motion.button
                      onClick={(e) => handleRemoveImage(2, e)}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Text className="text-white text-xs">✕</Text>
                    </motion.button>
                  </>
                ) : (
                  <View className="w-full h-full flex flex-col items-center justify-center p-3">
                    <RiImageAddLine size={24} className="text-white/30 mb-2" />
                    <Text className="text-white/40 text-xs font-bbh text-center leading-tight">
                      {boxHints[2]}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Box 4 */}
              <Pressable
                onPress={() => handleBoxClick(3, box3 / 100)}
                className="bg-card-lighter-3/10 overflow-hidden relative group flex-shrink-0"
                style={{
                  flex: `0 0 ${box3}%`,
                  height: `${box3}%`,
                }}
              >
                {boxImages[3] ? (
                  <>
                    <View
                      className="relative"
                      style={{
                        background: `url(${boxImages[3]})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <img
                        src={boxImages[3]}
                        alt="Box 4"
                        className="w-full h-full object-cover"
                      />
                      <Noise />
                    </View>
                    <motion.button
                      onClick={(e) => handleRemoveImage(3, e)}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Text className="text-white text-xs">✕</Text>
                    </motion.button>
                  </>
                ) : (
                  <View className="w-full h-full flex flex-col items-center justify-center p-3">
                    <RiImageAddLine size={24} className="text-white/30 mb-2" />
                    <Text className="text-white/40 text-xs font-bbh text-center leading-tight">
                      {boxHints[3]}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </div>

        <View className="pt-3 w-full flex-row justify-center gap-2">
          <Button onClick={regen} label="New Grid" textClassName="text-sm" />
          {boxImages.some((img) => img !== null) && (
            <Button
              onClick={() => setBoxImages([null, null, null, null])}
              label="Clear All"
              variant="outline"
              textClassName="text-sm"
            />
          )}
        </View>

        {/* Hidden File Inputs */}
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => (fileInputRefs.current[index] = el)}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, index)}
            className="hidden"
          />
        ))}
      </View>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {imageToCrop && (
          <ImageCropper
            image={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={cropAspectRatio}
          />
        )}
      </AnimatePresence>
    </View>
  )
}
