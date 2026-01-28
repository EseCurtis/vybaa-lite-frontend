import { TaskCard, type FrontendTaskStatus } from '@/components/home/task-card';
import { Text } from '@/components/layout/text.component';
import { View } from '@/components/layout/view.component';

export function TaskList({
  tasks,
  onDone,
  onSkip,
  onEdit,
  onSeeMore,
  hasNextPage
}: {
  tasks: Array<{ id: string; title: string; frequency: string; status: FrontendTaskStatus }>
  onDone: (id: string) => void
  onSkip: (id: string) => void
  onEdit: (id: string) => void
  onSeeMore?: () => void
  hasNextPage?: boolean;
}) {
  const sorted = [...tasks].sort((a, b) => {
    const rank = (s: FrontendTaskStatus) => (s === 'pending' ? 0 : s === 'completed' ? 1 : 2)
    return rank(a.status) - rank(b.status)
  })

  const limited = sorted.slice(0, 10)

  // const completed = tasks.filter((t) => t.status === 'completed').length
  // const pending = tasks.filter((t) => t.status === 'pending').length
  //pending === 0 && completed > 0

  if (tasks.length < 0) {
    return (
      <View className="bg-card-600 rounded-2xl p-6 text-center">
        <Text className="text-white text-lg font-bbh mb-2"> All done!</Text>
        <Text className="text-white/70 text-sm font-outfit">You've completed all your tasks for today. Great job!</Text>
      </View>
    )
  }

  return (
    <View className="gap-3">
      {limited.map((task) => (
        <TaskCard key={task.id} id={task.id} title={task.title} frequency={task.frequency} status={task.status} onDone={onDone} onSkip={onSkip} onEdit={onEdit} />
      ))}

      {hasNextPage && (
        <View className="items-center pt-2">
          <Text className="text-white font-bbh cursor-pointer" onClick={onSeeMore}>
            See All tasks →
          </Text>
        </View>
      )}
    </View>
  )
}


