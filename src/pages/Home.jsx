import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* 🔵 Hero 영역 */}
      <div className="hero">
        <h1>상담 옵션 선택</h1>
        <p>상황에 맞는 상담을 빠르게 시작하세요</p>
      </div>

      {/* ⚪ 옵션 카드 영역 */}
      <div className="options">
        <button
          className="option"
          onClick={() => navigate("/quick/chat")}
        >
          ⚡ 빠른 상담
        </button>

        <button
          className="option"
          onClick={() => navigate("/category/real-estate")}
        >
          🏠 부동산
        </button>

        <button
          className="option"
          onClick={() => navigate("/category/criminal")}
        >
          ⚖️ 형사
        </button>

        <button
          className="option"
          onClick={() => navigate("/category/civil")}
        >
          📄 민사
        </button>
      </div>
    </div>
  );
}
