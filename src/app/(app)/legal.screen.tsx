import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { publicUrls, type LegalDocumentType } from '@/shared/config/public-urls.config'
import { useNavigate } from '@tanstack/react-router'

interface LegalScreenProps {
  documentType: LegalDocumentType
}

const legalCopy: Record<LegalDocumentType, { title: string; subtitle: string }> = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we protect your data',
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Terms and conditions',
  },
}

export function LegalScreen({ documentType }: LegalScreenProps) {
  const navigate = useNavigate()
  const copy = legalCopy[documentType]
  const url = documentType === 'terms'
    ? publicUrls.termsOfService
    : publicUrls.privacyPolicy

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader
          canGoBack
          onBack={() => navigate({ replace: true, to: '/app/sub-profile/settings' })}
          title={copy.title}
        />
        <View className="px-mg pb-4">
          <Text className="text-white/50 text-xs font-bbh">{copy.subtitle}</Text>
        </View>
        <View className="flex-1 mx-mg mb-safe rounded-2xl overflow-hidden bg-white">
          <iframe
            className="size-full border-0 bg-white"
            src={url}
            title={copy.title}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}
