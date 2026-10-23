import { Browser } from '@capacitor/browser'

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
    <View className="items-center gap-1 px-0">
      <Text className="!text-center text-xs leading-5 text-card-lighter-3 font-bbh">
        By {actionText}, you agree to Vybaa's{' '}
        <span
          // accessibilityLabel="Read Terms of Use and Community Standards"
          className="min-h-11 justify-center"
          onClick={() => openDocument(publicUrls.termsOfService)}
          //type="button"
        >
          <Text className="text-xs font-bbh font-bold text-white">
            Terms &amp; Community Standards
          </Text>
        </span>
        , and acknowledge the{' '}
        <span
          //   accessibilityLabel="Read Privacy Policy"
          className="min-h-11 justify-center"
          onClick={() => openDocument(publicUrls.privacyPolicy)}
          //type="button"
        >
          <Text className="text-xs font-bbh font-bold text-white">
            Privacy Policy
          </Text>
        </span>
      </Text>
      <View className="flex-row items-center justify-center gap-4"></View>
    </View>
  )
}
