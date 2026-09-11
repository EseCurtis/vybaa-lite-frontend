import { Browser } from '@capacitor/browser'
import { RiCheckLine, RiShieldCheckLine } from '@remixicon/react'

import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { publicUrls } from '@/shared/config/public-urls.config'

interface TermsConsentProps {
  accepted: boolean
  disabled?: boolean
  onChange: (accepted: boolean) => void
}

function openDocument(url: string): void {
  void Browser.open({ presentationStyle: 'fullscreen', url })
}

export function TermsConsent({
  accepted,
  disabled = false,
  onChange,
}: TermsConsentProps) {
  return (
    <View className="rounded-2xl bg-card-light-50 px-4 py-3">
      <Pressable
        accessibilityLabel="Accept Terms of Use and Community Standards"
        aria-pressed={accepted}
        disabled={disabled}
        onPress={() => onChange(!accepted)}
        type="button"
        className="min-h-11 flex-row items-start gap-3"
      >
        <View
          className={`mt-0.5 size-6 shrink-0 items-center justify-center rounded-lg ${accepted ? 'bg-white' : 'bg-card-light-100'}`}
        >
          {accepted ? <RiCheckLine className="text-black" size={17} /> : null}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <RiShieldCheckLine className="text-warning-yellow" size={15} />
            <Text className="text-sm font-bbh font-semibold text-white">
              Keep Vybaa safe
            </Text>
          </View>
          <Text className="mt-1 text-xs leading-5 text-card-lighter-3 font-bbh">
            I agree to the Terms of Use and Community Standards. Abusive,
            hateful, sexual, violent, or otherwise objectionable content is not
            tolerated.
          </Text>
        </View>
      </Pressable>
      <View className="ml-9 mt-1 flex-row gap-4">
        <Pressable
          accessibilityLabel="Read Terms of Use"
          onPress={() => openDocument(publicUrls.termsOfService)}
          type="button"
          className="min-h-11 justify-center"
        >
          <Text className="text-xs font-bbh font-bold text-white">
            Terms of Use
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Read Privacy Policy"
          onPress={() => openDocument(publicUrls.privacyPolicy)}
          type="button"
          className="min-h-11 justify-center"
        >
          <Text className="text-xs font-bbh font-bold text-white">
            Privacy Policy
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
