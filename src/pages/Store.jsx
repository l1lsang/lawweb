import {
  collection,
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

export default function Store() {
  const [balance, setBalance] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingUserItems, setLoadingUserItems] = useState(true);
  const [userItems, setUserItems] = useState({});

  const user = auth.currentUser;

  /* 🔹 auth 체크 */
  if (!user) {
    return (
      <div className="store-center">
        <p className="text-sub">로그인 정보를 불러오는 중...</p>
      </div>
    );
  }

  /* 🔹 1. 지갑 구독 */
  useEffect(() => {
    const walletRef = doc(db, "user_wallets", user.uid);

    const initWallet = async () => {
      const snap = await getDoc(walletRef);
      if (!snap.exists()) {
        await setDoc(walletRef, {
          balance: 0,
          createdAt: serverTimestamp(),
        });
      }
      setLoadingWallet(false);
    };

    initWallet();

    const unsub = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) setBalance(snap.data().balance ?? 0);
    });

    return () => unsub();
  }, []);

  /* 🔹 2. user_items 구독 */
  useEffect(() => {
    const ref = doc(db, "user_items", user.uid);

    const initItems = async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(
          ref,
          {
            global_chat: 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      setLoadingUserItems(false);
    };

    initItems();

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setUserItems(snap.data());
    });

    return () => unsub();
  }, []);

  /* 🔹 3. 상점 아이템 */
  useEffect(() => {
    const ref = collection(db, "store_items");

    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setItems(list);
      setLoadingItems(false);
    });

    return () => unsub();
  }, []);

  /* 🔹 4. 구매 처리 */
  const handlePurchase = async (item) => {
    try {
      await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, "user_wallets", user.uid);
        const itemRef = doc(db, "user_items", user.uid);
        const purchaseRef = doc(collection(db, "purchases"));

        const walletSnap = await transaction.get(walletRef);
        const itemSnap = await transaction.get(itemRef);

        if (!walletSnap.exists()) throw new Error("지갑 정보 없음");

        const currentBalance = walletSnap.data().balance ?? 0;
        const globalChat = itemSnap.exists()
          ? itemSnap.data().global_chat ?? 0
          : 0;

        if (currentBalance < item.priceCoins)
          throw new Error("코인이 부족합니다.");

        transaction.update(walletRef, {
          balance: currentBalance - item.priceCoins,
        });

        if (item.type === "global_chat_3") {
          transaction.set(
            itemRef,
            {
              global_chat: globalChat + 3,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        transaction.set(purchaseRef, {
          userId: user.uid,
          itemId: item.id,
          itemName: item.name,
          priceCoins: item.priceCoins,
          type: item.type,
          createdAt: serverTimestamp(),
        });
      });

      window.alert(`"${item.name}"을 구매했습니다.`);
    } catch (err) {
      window.alert(err.message);
    }
  };

  /* 🔹 로딩 */
  if (loadingWallet || loadingItems || loadingUserItems) {
    return (
      <div className="store-center">
        <div className="loader" />
        <p className="text-sub">상점 정보를 불러오는 중...</p>
      </div>
    );
  }

  /* 🔹 렌더 */
  return (
    <div className="store">
      {/* 지갑 */}
      <div className="wallet-card">
        <p className="wallet-label">보유 코인</p>
        <p className="wallet-value">{balance} 코인</p>
      </div>

      <div className="wallet-card">
        <p className="wallet-label">전역 채팅 이용권</p>
        <p className="wallet-value">{userItems.global_chat ?? 0} 회</p>
      </div>

      {/* 상품 */}
      <h2 className="section-title">구매 가능 상품</h2>

      {items.map((item) => (
        <div key={item.id} className="item-card">
          <p className="item-title">{item.name}</p>
          <p className="item-desc">{item.description}</p>
          <p className="item-price">{item.priceCoins} 로비</p>

          <button
            className="buy-button"
            onClick={() => handlePurchase(item)}
          >
            구매하기
          </button>
        </div>
      ))}
    </div>
  );
}
