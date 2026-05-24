import { BrowserRouter, Route, Routes } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import CreateGroupPage from './pages/CreateGroupPage'
import GroupCreatedPage from './pages/GroupCreatedPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/groups/new" element={<CreateGroupPage />} />
          <Route path="/groups/new/done" element={<GroupCreatedPage />} />
          {/* 이후 페이지 추가 예정 */}
        </Routes>
      </div>
    </BrowserRouter>
  )
}
