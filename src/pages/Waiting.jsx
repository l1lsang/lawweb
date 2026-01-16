import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../config/firebase";
import "./Waiting.css";

export default function Waiting() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestId = params.get("requestId");

  useEffect(() => {
    if (!requestId) return;

    const ref = doc(db, "consult_requests", requestId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      // 🔥 변호사 배정 → 채팅방 이동
      if (data.status === "assigned" && data.roomId) {
        navigate(`/chat/${data.roomId}`, { replace: true });
      }
    });

    return () => unsub();
  }, [requestId, navigate]);

  return (
    <div className="waiting">
      {/* 로딩 */}
      <div className="spinner" />

      {/* 안내 카드 */}
      <div className="waiting-card">
        <h2>상담 요청이 접수되었습니다</h2>
        <p>
          관리자가 상황에 맞는 변호사를
          <br />
          배정하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}
