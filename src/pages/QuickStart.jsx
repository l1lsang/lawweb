import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../config/firebase";
import "./QuickStart.css";

export default function QuickStart() {
  const navigate = useNavigate();

  useEffect(() => {
    startQuickChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuickChat = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/login", { replace: true });
        return;
      }

      /* 1️⃣ 상담 요청 생성 */
      const requestRef = await addDoc(
        collection(db, "consult_requests"),
        {
          userId: user.uid,
          category: "quick",
          subCategory: "빠른 상담",
          status: "waiting",
          createdAt: serverTimestamp(),
        }
      );

      const requestId = requestRef.id;

      /* 🔔 관리자 알림 (실패해도 진행) */
      try {
        await fetch("https://naranweb.vercel.app/api/sendPush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "consult",
            message: "새 빠른 상담 요청이 접수되었습니다.",
            consultId: requestId,
          }),
        });
      } catch (e) {
        console.log("⚠️ 알림 전송 실패:", e);
      }

      /* 2️⃣ 채팅방 생성 */
      const roomRef = await addDoc(collection(db, "chat_rooms"), {
        clientId: user.uid,
        lawyerId: null,
        users: [user.uid],
        requestId,
        lastMessage: "",
        lastMessageTime: null,
        createdAt: serverTimestamp(),
      });

      const roomId = roomRef.id;

      /* 3️⃣ 요청 문서에 roomId 저장 */
      await updateDoc(doc(db, "consult_requests", requestId), {
        roomId,
      });

      /* 4️⃣ 대기 화면 이동 */
      navigate(`/waiting?requestId=${requestId}`, { replace: true });
    } catch (err) {
      console.error("빠른 상담 오류:", err);
    }
  };

  return (
    <div className="quick">
      {/* 로딩 */}
      <div className="spinner" />

      {/* 안내 카드 */}
      <div className="quick-card">
        <h2>빠른 상담 요청 중입니다</h2>
        <p>
          요청을 처리하고 있습니다.
          <br />
          잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}
