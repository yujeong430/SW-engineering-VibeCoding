import type { Member } from './member'
import type { ExpenseSummary } from './expense'

export type GroupStatus = 'OPEN' | 'SETTLED'

export interface GroupSummary {
  uuid: string
  name: string
  status: GroupStatus
}

export interface GroupDetail extends GroupSummary {
  members: Member[]
  expenses: ExpenseSummary[]
}
