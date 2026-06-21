import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Login from './pages/Login'
import Qna from './pages/Qna'
import Complete from './pages/Complete'
import Course from './pages/Course'
import Admin from './pages/Admin'
import Stub from './pages/Stub'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/course" element={<Course />} />
        <Route path="/player" element={<Stub title="강의실" />} />
        <Route path="/mypage" element={<Stub title="마이페이지" />} />
        <Route path="/cart" element={<Stub title="장바구니" />} />
        <Route path="/checkout" element={<Stub title="결제" />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/login" element={<Login />} />
        <Route path="/qna" element={<Qna />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Stub title="페이지를 찾을 수 없어요" />} />
      </Route>
    </Routes>
  )
}
