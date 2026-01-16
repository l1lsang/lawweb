import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import "./Store.css";

const PRICE_PER_LOBBY = 1000; // 1로비 = 1000원

export default function Store() {
  const user = auth.currentUser;
  const [userItems, setUserItems] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return (
      <div className="store-center">
        <p className="text-sub">로그인이 필요합니다.</p>
      </div>
    );
  }

  /* 🔹 로비 정보 구독 */
  useEffect(() => {
    const ref = doc(db, "user_items", user.uid);

    const init = async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          global_chat: 0,
          updatedAt: serverTimestamp(),
        });
      }
      setLoading(false);
    };

    init();

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setUserItems(snap.data());
    });

    return () => unsub();
  }, []);

  /* 🔹 로비 구매 */
  const purchaseLobby = async () => {
    const ok = window.confirm(
      `1로비를 ${PRICE_PER_LOBBY.toLocaleString()}원에 구매하시겠습니까?\n(결제 후 즉시 지급되며 환불이 제한됩니다)`
    );
    if (!ok) return;

    try {
      /**
       * ⚠️ 실제 결제 연동 위치
       * 지금은 "결제 성공" 가정
       * (나중에 토스 / 카카오페이 붙이면 여기만 교체)
       */

      await runTransaction(db, async (tx) => {
        const ref = doc(db, "user_items", user.uid);
        const snap = await tx.get(ref);

        const current = snap.exists()
          ? snap.data().global_chat ?? 0
          : 0;

        tx.set(
          ref,
          {
            global_chat: current + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(doc(db, "purchases", crypto.randomUUID()), {
          userId: user.uid,
          itemType: "global_chat",
          quantity: 1,
          priceWon: PRICE_PER_LOBBY,
          createdAt: serverTimestamp(),
        });
      });

      window.alert("✅ 1로비가 지급되었습니다!");
    } catch (e) {
      console.error(e);
      window.alert("구매 중 오류가 발생했습니다.");
    }
  };

  if (loading || !userItems) {
    return (
      <div className="store-center">
        <div className="loader" />
        <p className="text-sub">상점 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="store">
      {/* 보유 로비 */}
      <div className="wallet-card">
        <p className="wallet-label">보유 로비</p>
        <p className="wallet-value">
          {userItems.global_chat ?? 0} 회
        </p>
      </div>

      {/* 구매 */}
      <h2 className="section-title">로비 구매</h2>

      <div className="item-card">
        <p className="item-title">상담 이용권 1회</p>
        <p className="item-desc">
          변호사 상담 1회를 이용할 수 있습니다.
        </p>
        <p className="item-price">1,000원</p>

        <button className="buy-button" onClick={purchaseLobby}>
          1로비 구매하기
        </button>
      </div>

      {/* 정책 안내 */}
      <p className="policy-hint">
        결제 시 <a href="/policy">환불 정책</a>에 동의한 것으로
        간주됩니다.
      </p>
    </div>
  );
}
