// 그룹 조회 등 화면 표시용 최소 멤버 정보 (계좌 정보 미포함)
export interface MemberSummary {
  id: number
  name: string
}

// 계좌 정보까지 포함한 전체 멤버 (계좌 등록/정산 컨텍스트)
export interface Member extends MemberSummary {
  bankName: string | null
  accountNo: string | null
}
