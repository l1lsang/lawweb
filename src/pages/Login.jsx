import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../config/firebase";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pw) {
      return window.alert("이메일과 비밀번호를 입력해주세요.");
    }

    try {
      setLoading(true);

      const userCred = await signInWithEmailAndPassword(auth, email, pw);
      const uid = userCred.user.uid;

      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        setLoading(false);
        return window.alert("유저 정보가 존재하지 않습니다.");
      }

      const user = snap.data();

      // 🔁 사용자 타입 분기
      if (user.type === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (user.type === "lawyer") {
        navigate("/lawyer/dashboard", { replace: true });
        return;
      }

      // 일반 유저
      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      window.alert("로그인 실패. 이메일 또는 비밀번호를 확인하세요.");
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* 🔵 Hero */}
      <div className="login-hero">
        <h1>법서</h1>
        <p>안전하고 간편한 법률 상담</p>
      </div>

      {/* ⚪ 로그인 카드 */}
      <div className="login-card">
        <input
          type="email"
          placeholder="이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div
          className="signup-link"
          onClick={() => navigate("/auth/signup")}
        >
          아직 계정이 없나요? 회원가입 →
        </div>
      </div>
    </div>
  );
}
