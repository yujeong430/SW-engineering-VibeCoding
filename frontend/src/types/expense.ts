export interface ExpenseSummary {
  id: number
  title: string
  amount: number
  payerId: number
  payerName: string
  createdAt: string
  shareMemberIds: number[]
}

export interface ShareItem {
  memberId: number
  shareAmount: number
}

export interface ExpenseDetail {
  id: number
  title: string
  amount: number
  payerId: number
  shares: ShareItem[]
}
