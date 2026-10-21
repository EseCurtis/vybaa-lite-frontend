import { RiCheckLine, RiLockLine, RiTimeLine } from '@remixicon/react'
import type { ReactElement } from 'react'

import type { Goal } from '@/shared/api/goal.api'
import { taskRewardSummary } from '@/shared/goal/task-presentation'
import { seededColor } from '@/shared/utils/helpers.util'

export function TaskRewards({ goal }: { goal: Goal }): ReactElement {
  return (
    <section aria-label="Task rewards" className="space-y-5">
      <div>
        <h2 className="text-base font-bold">Play Points</h2>
        <p className="mt-2 text-lg font-semibold">
          {taskRewardSummary(goal.reward)}
        </p>
      </div>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold text-card-lighter-3">
          Reward details
        </summary>
        <div className="space-y-4 pt-2">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-card-lighter-3">Added to Play Points</dt>
              <dd>{goal.reward.releasedPoints.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-card-lighter-3">Pending</dt>
              <dd>{goal.reward.pendingPoints.toFixed(2)}</dd>
            </div>
            {goal.reward.forfeitedPoints ? (
              <div className="flex justify-between gap-4">
                <dt className="text-card-lighter-3">Forfeited</dt>
                <dd>{goal.reward.forfeitedPoints.toFixed(2)}</dd>
              </div>
            ) : null}
          </dl>
          {!goal.reward.eligible ? (
            <p className="leading-relaxed text-card-lighter-3">
              This task doesn’t earn Play Points. Eligibility depends on its
              duration and scheduled check-ins.
            </p>
          ) : (
            <>
              <p className="leading-relaxed text-card-lighter-3">
                {goal.reward.releasePolicy === 'ON_COMPLETION'
                  ? 'Pending points are added when you finish this task.'
                  : 'Eligible milestones add points as you reach them.'}
              </p>
              {goal.missPolicy.forfeitPendingOnMiss ? (
                <p className="text-sm text-card-lighter-3">
                  Missed check-ins can forfeit pending points.
                </p>
              ) : null}
            </>
          )}
          {goal.reward.milestones.map((milestone, index) => {
            const percentage = milestone.triggerPercentage ?? 20
            const previous = index
              ? (goal.reward.milestones[index - 1]?.triggerPercentage ?? 0)
              : 0
            const progress = Math.max(
              0,
              Math.min(
                100,
                ((goal.progress.percentage - previous) /
                  Math.max(percentage - previous, 1)) *
                  100,
              ),
            )
            const labels = {
              FORFEITED: 'Forfeited',
              LOCKED: 'Not reached',
              PENDING: 'Pending',
              RELEASED: 'Added',
            }
            return (
              <div key={milestone.id} className="space-y-2 py-2">
                <div className="flex items-start gap-2">
                  {milestone.status === 'RELEASED' ? (
                    <RiCheckLine size={18} className="text-success-400" />
                  ) : milestone.status === 'PENDING' ? (
                    <RiTimeLine size={18} className="text-warning-400" />
                  ) : (
                    <RiLockLine size={18} className="text-card-lighter-3" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{milestone.name}</p>
                    <p className="mt-1 text-xs text-card-lighter-3">
                      {labels[milestone.status]} · {milestone.triggerPercentage}
                      %
                    </p>
                  </div>
                  <span className="tabular-nums">
                    +{milestone.points.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-card-light">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: seededColor(JSON.stringify(milestone)),
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </details>
    </section>
  )
}
