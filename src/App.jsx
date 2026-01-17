import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./config/firebase";

/* ===== 기존 페이지 (건들지 않음) ===== */
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Store from "./pages/Store";
import Community from "./pages/Community";
import BottomTabs from "./components/BottomTabs";

/* ===== 새로 만든 페이지 ===== */
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CommunityDetail from "./pages/CommunityDetail";
import CommunityWrite from "./pages/CommunityWrite";
import QuickStart from "./pages/QuickStart";
import Waiting from "./pages/Waiting";
import ChatRoom from "./pages/ChatRoom";
import Policy from "./pages/Policy";
import PaymentSuccess from "./pages/PaymentSuccess";
/* ===== 공통 컴포넌트 ===== */
import Footer from "./components/Footer";

/* ===============================
   공통 레이아웃
================================ */
function LayoutWithTabs({ children }) {
  const location = useLocation();
  const { pathname } = location;

  /* ===============================
     BottomTabs 노출 조건
     =============================== */
  const showTabs =
    pathname === "/home" ||
    pathname === "/chat" ||
    pathname === "/store" ||
    pathname === "/community";

  /* ===============================
     Footer 노출 조건 (앱 기준)
     =============================== */
  const showFooter =
    pathname === "/" ||                 // 랜딩
    pathname.startsWith("/auth") ||     // 로그인 / 회원가입
    pathname === "/store";              // 상점

  return (
    <div className="app-layout">
      <div className="page-scroll">
        {children}
        {showFooter && <Footer />}
      </div>

      {showTabs && <BottomTabs />}
    </div>
  );
}




export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      setCheckingAuth(false);
    });
    return unsub;
  }, []);

  if (checkingAuth) return null; // 초기 깜빡임 방지

  return (
    <BrowserRouter>
      <LayoutWithTabs>
        <Routes>
          {/* 🔓 비로그인 */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />

          {/* 📜 정책 페이지 */}
          <Route path="/policy" element={<Policy />} />

          {/* 🔐 로그인 후 메인 */}
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/store" element={<Store />} />
           <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/community" element={<Community />} />

          {/* 🧩 커뮤니티 */}
          <Route path="/community/write" element={<CommunityWrite />} />
          <Route path="/community/:id" element={<CommunityDetail />} />

          {/* ⚡ 빠른 상담 */}
         <Route path="/quick/start" element={<QuickStart />} />
<Route path="/quick/chat" element={<QuickStart />} />

          <Route path="/waiting" element={<Waiting />} />

          {/* 💬 채팅방 */}
          <Route path="/chat/:id" element={<ChatRoom />} />
        </Routes>
      </LayoutWithTabs>
    </BrowserRouter>
  );
}
