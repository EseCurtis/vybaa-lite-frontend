import { EmptyList } from '@/components/common/empty-list.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewardTransactions } from '@/hooks/use-rewards.hook'
import type { RewardTransaction } from '@/shared/api/rewards.api'
import { colors } from '@/shared/colors.shared'
import { RiArrowDownLine, RiArrowUpLine, RiHistoryLine } from '@remixicon/react'

function transactionLabel(transaction: RewardTransaction): string {
  if (transaction.metadata.milestoneName) {
    return transaction.metadata.milestoneName
  }
  if (transaction.metadata.source === 'legacy_pending_points') {
    return 'Previously earned goal points'
  }
  if (transaction.type === 'BUY_POINTS') return 'Points purchase'
  if (transaction.type === 'WITHDRAW_POINTS') return 'Points withdrawal'
  return 'Play Points adjustment'
}

function transactionDetail(transaction: RewardTransaction): string {
  if (transaction.metadata.milestoneDay) {
    return `Goal milestone · Day ${transaction.metadata.milestoneDay}`
  }
  if (transaction.metadata.source === 'legacy_pending_points') {
    return 'Released when the goal was completed'
  }
  return transaction.status === 'PENDING'
    ? 'Pending goal completion'
    : 'Play Points ledger'
}

function formatTransactionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function RewardActivityRow({
  transaction,
}: {
  transaction: RewardTransaction
}) {
  const isIncoming = transaction.amount >= 0
  const isPending = transaction.status === 'PENDING'

  return (
    <View className="flex-row items-center gap-3 border-b border-white/5 py-4">
      <View
        className="size-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: isIncoming
            ? `${colors['success-green']}20`
            : `${colors.danger[500]}20`,
        }}
      >
        {isIncoming ? (
          <RiArrowDownLine
            size={18}
            style={{ color: colors['success-green'] }}
          />
        ) : (
          <RiArrowUpLine size={18} style={{ color: colors.danger[500] }} />
        )}
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-bbh text-sm font-semibold text-white">
          {transactionLabel(transaction)}
        </Text>
        <Text className="muted font-bbh text-xs">
          {transactionDetail(transaction)}
        </Text>
        <Text className="muted font-bbh text-[11px]">
          {formatTransactionDate(transaction.createdAt)}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text
          className="font-bbh text-sm font-bold"
          style={{
            color: isIncoming ? colors['success-green'] : colors.danger[500],
          }}
        >
          {isIncoming ? '+' : ''}
          {transaction.amount.toLocaleString()} pts
        </Text>
        <Text className="muted font-bbh text-[10px]">
          {isPending ? 'Pending' : 'Completed'}
        </Text>
      </View>
    </View>
  )
}

export function RewardActivityTrail() {
  const transactionsQuery = useRewardTransactions()
  const transactions =
    transactionsQuery.data?.pages.flatMap((page) => page.data.transactions) ??
    []

  return (
    <View className="rounded-[30px] bg-cardx p-6">
      <View className="mb-2 flex-row items-center gap-2">
        <RiHistoryLine size={21} className="text-accent-400" />
        <Text className="font-bbh text-base font-bold text-white">
          Award trail
        </Text>
      </View>
      <Text className="muted mb-2 font-bbh text-xs leading-5">
        Every Play Points award and release that contributes to your balance.
      </Text>

      {transactionsQuery.isLoading ? (
        <View className="gap-3 py-3">
          {[1, 2, 3].map((item) => (
            <View key={item} className="flex-row items-center gap-3 py-2">
              <Skeleton className="size-10" rounded="full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-3 w-2/3" rounded="sm" />
                <Skeleton className="h-3 w-1/2" rounded="sm" />
              </View>
              <Skeleton className="h-3 w-16" rounded="sm" />
            </View>
          ))}
        </View>
      ) : transactions.length === 0 ? (
        <EmptyList
          icon={<RiHistoryLine size={42} className="text-card-lighter-3" />}
          title="No Play Points activity"
          description="Your goal awards will appear here as they are earned."
        />
      ) : (
        <View>
          {transactions.map((transaction) => (
            <RewardActivityRow key={transaction.id} transaction={transaction} />
          ))}
          {transactionsQuery.hasNextPage ? (
            <button
              className="mt-4 w-full rounded-xl bg-card-light/10 px-4 py-3 text-center font-bbh text-xs font-semibold text-white"
              disabled={transactionsQuery.isFetchingNextPage}
              onClick={() => void transactionsQuery.fetchNextPage()}
            >
              {transactionsQuery.isFetchingNextPage
                ? 'Loading more...'
                : 'Load more activity'}
            </button>
          ) : null}
        </View>
      )}
    </View>
  )
}
