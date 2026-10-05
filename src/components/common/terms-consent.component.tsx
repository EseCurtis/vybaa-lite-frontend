import { Browser } from '@capacitor/browser'

import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { publicUrls } from '@/shared/config/public-urls.config'

interface TermsConsentProps {
  action: 'login' | 'signup'
}

function openDocument(url: string): void {
  void Browser.open({ presentationStyle: 'fullscreen', url })
}

export function TermsConsent({ action }: TermsConsentProps) {
  const actionText = action === 'login' ? 'logging in' : 'creating an account'

  return (
    <View className="items-center gap-1 px-3">
      <Text className="!text-center text-xs leading-5 text-card-lighter-3 font-bbh">
        By {actionText}, you agree to Vybaa's Terms of Use and Community
        Standards, and acknowledge the Privacy Policy.
      </Text>
      <View className="flex-row items-center justify-center gap-4">
        <TouchableOpacity
          accessibilityLabel="Read Terms of Use and Community Standards"
          className="min-h-11 justify-center"
          onPress={() => openDocument(publicUrls.termsOfService)}
          type="button"
        >
          <Text className="text-xs font-bbh font-bold text-white">
            Terms &amp; Community Standards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Read Privacy Policy"
          className="min-h-11 justify-center"
          onPress={() => openDocument(publicUrls.privacyPolicy)}
          type="button"
        >
          <Text className="text-xs font-bbh font-bold text-white">
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
