import {
  RiCheckboxCircleLine,
  RiChatSmile2Line,
  RiTimeLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import { Button } from '@/components/layout/button.component'
import type { Goal } from '@/shared/api/goal.api'

export function RewindTaskContent({
  goal,
}: {
  goal: Goal
}): ReactElement | null {
  const navigate = useNavigate()
  const link = goal.linkedRewind
  if (!link) return null
  const completed = link.status === 'COMPLETED'
  const missed = link.status === 'MISSED'
  const future = Boolean(
    link.scheduledFor && new Date(link.scheduledFor).getTime() > Date.now(),
  )
  const StatusIcon = completed ? RiCheckboxCircleLine : RiTimeLine
  let status = 'Ready in Rewind'
  if (future) status = 'Scheduled'
  if (completed) status = 'Completed'
  if (missed) status = 'Missed'
  return (
    <div className="flex flex-col gap-5 py-5 font-bbh">
      <RiChatSmile2Line
        size={28}
        className="text-accent-300"
        aria-hidden="true"
      />
      <h1 className="text-xl font-semibold leading-7 text-white">
        {goal.title}
      </h1>
      <p className="flex items-center gap-2 text-sm text-card-lighter-2">
        <StatusIcon
          size={17}
          className={completed ? 'text-success-400' : 'text-warning-400'}
          aria-hidden="true"
        />
        {status}
      </p>
      {link.scheduledFor ? (
        <p className="text-sm text-card-lighter-2">
          {new Date(link.scheduledFor).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      ) : null}
      <p className="text-sm leading-6 text-card-lighter-2">
        {completed
          ? 'Your Rewind cleared this task automatically.'
          : 'This task follows your Rewind schedule and clears automatically.'}
      </p>
      {!missed ? (
        <Button
          label={completed ? 'View reflection' : 'Open Rewind'}
          variant="secondary"
          disabled={future}
          onClick={() => {
            if (future) return
            if (completed)
              void navigate({
                to: '/app/r/$sessionId',
                params: { sessionId: link.sessionId },
                search: { from: 'history' },
              })
            else void navigate({ to: '/app/rewind' })
          }}
        />
      ) : null}
    </div>
  )
}
