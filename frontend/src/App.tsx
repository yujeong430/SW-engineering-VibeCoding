import { BrowserRouter, Route, Routes } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import CreateGroupPage from './pages/CreateGroupPage'
import MemberSetupPage from './pages/MemberSetupPage'
import GroupCreatedPage from './pages/GroupCreatedPage'
import GroupPage from './pages/GroupPage'
import ExpenseCreatePage from './pages/ExpenseCreatePage'
import AccountRegisterPage from './pages/AccountRegisterPage'
import SettlementPage from './pages/SettlementPage'
import ExpenseHistoryPage from './pages/ExpenseHistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/groups/new" element={<CreateGroupPage />} />
          <Route path="/groups/new/members" element={<MemberSetupPage />} />
          <Route path="/groups/new/done" element={<GroupCreatedPage />} />
          <Route path="/groups/:uuid" element={<GroupPage />} />
          <Route path="/groups/:uuid/expenses/new" element={<ExpenseCreatePage />} />
          <Route path="/groups/:uuid/expenses/:expenseId/edit" element={<ExpenseCreatePage />} />
          <Route path="/groups/:uuid/settlement" element={<SettlementPage />} />
          <Route path="/groups/:uuid/expenses" element={<ExpenseHistoryPage />} />
          <Route
            path="/groups/:uuid/members/:memberId/account"
            element={<AccountRegisterPage />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
