import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../config/firebase";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!nickname.trim()) {
      return window.alert("닉네임을 입력해주세요!");
    }

    if (!email || !pw) {
      return window.alert("이메일과 비밀번호를 입력해주세요!");
    }

    if (pw !== pwCheck) {
      return window.alert("비밀번호가 일치하지 않습니다!");
    }

    try {
      setLoading(true);

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        pw
      );
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email,
        type: "user",
        nickname,
        createdAt: serverTimestamp(),
      });

      window.alert("회원가입 성공!");
      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      window.alert("회원가입 실패. 입력 정보를 다시 확인해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="signup">
      {/* 🔵 Hero */}
      <div className="signup-hero">
        <h1>회원가입</h1>
        <p>간단한 정보로 빠르게 시작하세요</p>
      </div>

      {/* ⚪ 카드 */}
      <div className="signup-card">
        <input
          placeholder="닉네임 (관리자만 확인)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <input
          type="email"
          placeholder="이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="비밀번호 입력"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={pwCheck}
          onChange={(e) => setPwCheck(e.target.value)}
          autoComplete="new-password"
        />

        <button onClick={handleSignup} disabled={loading}>
          {loading ? "가입 중..." : "회원가입 완료"}
        </button>

        <div
          className="login-link"
          onClick={() => navigate("/auth/login")}
        >
          이미 계정이 있나요? 로그인 →
        </div>
      </div>
    </div>
  );
}
