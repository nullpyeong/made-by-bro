import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import KakaoCallback from './pages/KakaoCallback'
import Referrals from './pages/Referrals'
import Qna from './pages/Qna'
import Complete from './pages/Complete'
import Course from './pages/Course'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'
import Player from './pages/Player'
import Mypage from './pages/Mypage'
import Stub from './pages/Stub'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/course" element={<Course />} />
        <Route path="/player" element={<Player />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/qna" element={<Qna />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Stub title="페이지를 찾을 수 없어요" />} />
      </Route>
    </Routes>
  )
}
