import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";

const PRICE_PER_LOBBY = 1000;

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = Number(params.get("amount"));

    if (!paymentKey || !orderId || amount !== PRICE_PER_LOBBY) {
      alert("잘못된 결제 요청입니다.");
      navigate("/store");
      return;
    }

    const confirmAndGrant = async () => {
      /* =========================
         1️⃣ 서버에 결제 승인 요청
         ========================= */
      const res = await fetch("/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      if (!res.ok) {
        alert("결제 승인에 실패했습니다.");
        navigate("/store");
        return;
      }

      /* =========================
         2️⃣ 로비 지급 (Firestore)
         ========================= */
      const user = auth.currentUser;
      if (!user) {
        alert("로그인이 필요합니다.");
        navigate("/store");
        return;
      }

      await runTransaction(db, async (tx) => {
        const ref = doc(db, "user_items", user.uid);
        const snap = await tx.get(ref);

        const current = snap.exists()
          ? snap.data().global_chat ?? 0
          : 0;

        // 로비 지급
        tx.set(
          ref,
          {
            global_chat: current + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 구매 기록 (orderId 기준 → 중복 방지)
        tx.set(doc(db, "purchases", orderId), {
          userId: user.uid,
          itemType: "global_chat",
          quantity: 1,
          priceWon: PRICE_PER_LOBBY,
          createdAt: serverTimestamp(),
        });
      });

      /* =========================
         3️⃣ 앱(WebView)에 결제 성공 알림
         ========================= */
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "PAYMENT_SUCCESS",
            orderId,
            amount,
          })
        );
      }

      alert("✅ 결제가 완료되고 로비가 지급되었습니다!");
      navigate("/store");
    };

    confirmAndGrant();
  }, [navigate]);

  return (
    <div className="store-center">
      <div className="loader" />
      <p className="text-sub">결제를 처리 중입니다...</p>
    </div>
  );
}
