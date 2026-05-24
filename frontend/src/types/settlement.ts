export interface Balance {
  memberId: number
  netBalance: number
}

export interface Transfer {
  fromMemberId: number
  fromName: string
  toMemberId: number
  toName: string
  amount: number
  toAccount: { bankName: string; accountNo: string } | null
}

export interface SettlementResult {
  settledAt: string
  balances: Balance[]
  transfers: Transfer[]
}
