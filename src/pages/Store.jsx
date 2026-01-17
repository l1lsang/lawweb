import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import "./Store.css";

const PRICE_PER_LOBBY = 1000;

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
  }, [user.uid]);

  /* 🔹 결제 시작 */
  const purchaseLobby = async () => {
    const ok = window.confirm(
      `1로비를 ${PRICE_PER_LOBBY.toLocaleString()}원에 구매하시겠습니까?\n(결제 후 즉시 지급되며 환불이 제한됩니다)`
    );
    if (!ok) return;

    const clientKey = "test_gck_여기에_네_클라이언트키";
    const tossPayments = TossPayments(clientKey);

    const widgets = tossPayments.widgets({
      customerKey: user.uid,
    });

    await widgets.setAmount({
      currency: "KRW",
      value: PRICE_PER_LOBBY,
    });

    await widgets.renderPaymentMethods({
      selector: "#payment-method",
      variantKey: "DEFAULT",
    });

    await widgets.renderAgreement({
      selector: "#agreement",
      variantKey: "AGREEMENT",
    });

    await widgets.requestPayment({
      orderId: crypto.randomUUID(), // ⚠️ 실서비스에선 서버 생성
      orderName: "상담 이용권 1회",
      successUrl: `${window.location.origin}/payment-success`,
      failUrl: `${window.location.origin}/payment-fail`,
      customerEmail: user.email ?? "user@example.com",
      customerName: "사용자",
    });
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
      {/* 결제 UI 자리 */}
      <div id="payment-method" />
      <div id="agreement" />

      {/* 보유 로비 */}
      <div className="wallet-card">
        <p className="wallet-label">보유 로비</p>
        <p className="wallet-value">
          {userItems.global_chat ?? 0} 회
        </p>
      </div>

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

      <p className="policy-hint">
        결제 시 <a href="/policy">환불 정책</a>에 동의한 것으로 간주됩니다.
      </p>
    </div>
  );
}
