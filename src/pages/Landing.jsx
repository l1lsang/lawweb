import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* 🔵 Hero 영역 */}
      <section className="landing-hero">
        <h1 className="landing-title">법서</h1>

        <p className="landing-sub">
          신뢰할 수 있는 변호사와
          <br />
          빠르게 연결됩니다
        </p>
      </section>

      {/* ⚪ CTA 카드 */}
      <section className="landing-cta">
        <button
          className="btn primary"
          onClick={() => navigate("/auth/login")}
        >
          로그인
        </button>

        <button
          className="btn ghost"
          onClick={() => navigate("/auth/signup")}
        >
          회원가입
        </button>
      </section>
    </div>
  );
}
