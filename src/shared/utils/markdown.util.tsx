import type { ReactElement } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

const markdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      className="text-cyan-300 underline"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <View className="border-l-2 border-card-lighter-2 pl-4">
      <Text className="text-base italic leading-7 text-card-lighter-2">
        {children}
      </Text>
    </View>
  ),
  code: ({ children }) => (
    <Text className="rounded bg-cardx px-1.5 py-0.5 font-mono text-sm text-card-lighter-2">
      {children}
    </Text>
  ),
  em: ({ children }) => <Text className="italic">{children}</Text>,
  h1: ({ children }) => (
    <Text className="font-display text-2xl font-bold text-white">
      {children}
    </Text>
  ),
  h2: ({ children }) => (
    <Text className="font-display text-xl font-bold text-white">
      {children}
    </Text>
  ),
  h3: ({ children }) => (
    <Text className="font-display text-lg font-bold text-white">
      {children}
    </Text>
  ),
  li: ({ children }) => (
    <View className="flex-row gap-2">
      <Text className="text-base leading-7 text-card-lighter-2">•</Text>
      <Text className="min-w-0 flex-1 text-base leading-7 text-white/90">
        {children}
      </Text>
    </View>
  ),
  ol: ({ children }) => <View className="gap-1 pl-1">{children}</View>,
  p: ({ children }) => (
    <Text className="text-base leading-7 text-white/90">{children}</Text>
  ),
  pre: ({ children }) => (
    <View className="overflow-x-auto rounded-xl bg-cardx p-4">
      <Text className="font-mono text-sm leading-6 text-card-lighter-2">
        {children}
      </Text>
    </View>
  ),
  strong: ({ children }) => (
    <Text className="font-bold text-white">{children}</Text>
  ),
  ul: ({ children }) => <View className="gap-1 pl-1">{children}</View>,
}

export function MarkdownContent({ content }: { content: string }): ReactElement {
  return (
    <ReactMarkdown
      components={markdownComponents}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  )
}
