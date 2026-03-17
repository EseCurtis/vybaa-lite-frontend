import { EmptyList } from '@/components/common/empty-list.component'
import { Spinner } from '@/components/common/spinner.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { TemplateCard } from '@/components/custom/community/template-card.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { GoalTemplate } from '@/shared/api/community.api'
import { RiFileList3Line } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'

interface TemplatesTabProps {
  templates: GoalTemplate[]
  isLoading: boolean
  isMember: boolean
  userRole?: 'OWNER' | 'MOD' | 'MEMBER' | null
  onCreateTemplate: () => void
  onStartGoal: (template: GoalTemplate) => void
  hasNextPage?: boolean
  onLoadMore?: () => void
  isPreview?: boolean
  onShowAll?: () => void
}

export function TemplatesTab({
  templates,
  isLoading,
  isMember,
  userRole,
  onCreateTemplate,
  onStartGoal,
  hasNextPage,
  onLoadMore,
  isPreview,
  onShowAll,
}: TemplatesTabProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    )
  }

  if (templates.length === 0) {
    return (
      <EmptyList
        icon={<RiFileList3Line size={48} className="text-white/40" />}
        title="No templates yet"
        description={
          isMember && (userRole === 'OWNER' || userRole === 'MOD')
            ? 'Create the first template for this community!'
            : 'No templates have been created yet.'
        }
        action={
          isMember && (userRole === 'OWNER' || userRole === 'MOD')
            ? {
                label: 'Create Template',
                onPress: onCreateTemplate,
              }
            : undefined
        }
      />
    )
  }

  // Preview mode on community page: simple list (no virtualization)
  if (isPreview) {
    return (
      <View className="py-4 space-y-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPress={(template) => {
              router.navigate({
                to: `/app/community/templates/${template.id}`,
              })
            }}
            onStart={onStartGoal}
          />
        ))}
        {onShowAll && (
          <View className="mt-2">
            <Pressable
              onPress={onShowAll}
              className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-3 font-bold"
            >
              <Text className="whitespace-nowrap text-sm">
                Show all templates
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    )
  }

  // Full page: keep virtualization
  return (
    <View className="py-4">
      <VirtualList
        items={templates}
        estimateSize={120}
        height={520}
        renderItem={(template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPress={(template) => {
              router.navigate({
                to: `/app/community/templates/${template.id}`,
              })
            }}
            onStart={onStartGoal}
          />
        )}
        footer={
          hasNextPage ? (
            <View className="mt-4 mb-2">
              <Pressable
                onPress={onLoadMore}
                className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-3 font-bold"
              >
                <Text className="whitespace-nowrap text-sm">Load more</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  )
}
