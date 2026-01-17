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
  const [widgets, setWidgets] = useState(null); // ⭐ 토스 위젯 상태

  /* 🔐 로그인 체크 */
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

  /* 🔥 토스 결제 위젯 초기화 + 렌더 (중요) */
  useEffect(() => {
    if (!user) return;

    const clientKey = "test_gck_여기에_네_클라이언트키";
    const tossPayments = TossPayments(clientKey);

    const w = tossPayments.widgets({
      customerKey: user.uid,
    });

    const initWidgets = async () => {
      await w.setAmount({
        currency: "KRW",
        value: PRICE_PER_LOBBY,
      });

      // ⭐ 여기서 렌더 (절대 클릭 안에서 X)
      await w.renderPaymentMethods({
        selector: "#payment-method",
        variantKey: "DEFAULT",
      });

      await w.renderAgreement({
        selector: "#agreement",
        variantKey: "AGREEMENT",
      });

      setWidgets(w);
    };

    initWidgets();
  }, [user]);

  /* 🔹 결제 요청 (requestPayment만!) */
  const purchaseLobby = async () => {
    if (!widgets) {
      alert("결제 위젯이 아직 준비되지 않았습니다.");
      return;
    }

    const ok = window.confirm(
      `1로비를 ${PRICE_PER_LOBBY.toLocaleString()}원에 구매하시겠습니까?\n(결제 후 즉시 지급되며 환불이 제한됩니다)`
    );
    if (!ok) return;

    await widgets.requestPayment({
      orderId: crypto.randomUUID(), // ⚠️ 실서비스에선 서버 생성 권장
      orderName: "상담 이용권 1회",
      successUrl: `${window.location.origin}/success.html`,
      failUrl: `${window.location.origin}/fail.html`,
      customerEmail: user.email ?? "user@example.com",
      customerName: "사용자",
    });
  };

  /* 🔄 로딩 상태 */
  if (loading || !userItems) {
    return (
      <div className="store-center">
        <div className="loader" />
        <p className="text-sub">상점 정보를 불러오는 중...</p>
      </div>
    );
  }

  /* 🖥️ UI */
  return (
    <div className="store">
      {/* ⭐ 결제 위젯 DOM (항상 존재해야 함) */}
      <div id="payment-method"></div>
      <div id="agreement"></div>

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
