import { useParams, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { auth, db, storage } from "../config/firebase";
import ChatBubble from "../components/ChatBubble";
import "./ChatRoom.css";

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = auth.currentUser;
  const myUid = user?.uid;

  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [text, setText] = useState("");
  const [remain, setRemain] = useState(0);

  const bottomRef = useRef(null);

  const isLawyer = !!(myUid && room?.lawyerId && myUid === room.lawyerId);
  const canSend = isLawyer || remain > 0;

  /* ===============================
     🔹 채팅방 정보
     =============================== */
  useEffect(() => {
    if (!id || !myUid) return;

    return onSnapshot(doc(db, "chat_rooms", id), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (
        typeof data.userChatRemain !== "number" &&
        myUid !== data.lawyerId
      ) {
        await updateDoc(doc(db, "chat_rooms", id), {
          userChatRemain: 3,
        });
        setRemain(3);
        setRoom({ id: snap.id, ...data, userChatRemain: 3 });
        return;
      }

      setRoom({ id: snap.id, ...data });
      setRemain(data.userChatRemain ?? 0);
    });
  }, [id, myUid]);

  /* ===============================
     🔹 메시지 실시간
     =============================== */
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "chat_rooms", id, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });
  }, [id]);

  /* ===============================
     🔹 읽음 처리
     =============================== */
  useEffect(() => {
    if (!id || !myUid) return;

    const qUnread = query(
      collection(db, "chat_rooms", id, "messages"),
      where("uid", "!=", myUid),
      where("read", "==", false)
    );

    return onSnapshot(qUnread, async (snap) => {
      if (snap.empty) return;

      snap.docs.forEach((m) =>
        updateDoc(doc(db, "chat_rooms", id, "messages", m.id), {
          read: true,
        }).catch(() => {})
      );

      await updateDoc(doc(db, "chat_rooms", id), {
        unreadCount: 0,
      }).catch(() => {});
    });
  }, [id, myUid]);

  /* ===============================
     🔹 이용권 차감
     =============================== */
  const consumeCredit = async () => {
    if (!room || !myUid) return;
    if (myUid === room.lawyerId) return;

    if (remain <= 0) {
      alert("이 채팅방의 무료 상담 횟수를 모두 사용했어요.");
      throw new Error("NO_CREDIT");
    }

    await runTransaction(db, async (tx) => {
      const ref = doc(db, "chat_rooms", id);
      const snap = await tx.get(ref);
      const current = snap.data()?.userChatRemain ?? 0;
      if (current <= 0) throw new Error("NO_CREDIT");
      tx.update(ref, { userChatRemain: increment(-1) });
    });
  };

  /* ===============================
     🔹 텍스트 전송
     =============================== */
  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      await consumeCredit();
    } catch {
      return;
    }

    const msg = text.trim();
    setText("");

    await addDoc(collection(db, "chat_rooms", id, "messages"), {
      text: msg,
      uid: myUid,
      read: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "chat_rooms", id), {
      lastMessage: msg,
      lastMessageAt: serverTimestamp(),
      unreadCount: increment(1),
    });
  };

  /* ===============================
     🔹 이미지 전송
     =============================== */
  const sendImage = async (file) => {
    if (!file) return;

    try {
      await consumeCredit();
    } catch {
      return;
    }

    const fileRef = ref(
      storage,
      `chat_rooms/${id}/${Date.now()}_${file.name}`
    );

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "chat_rooms", id, "messages"), {
      imageUrl: url,
      uid: myUid,
      read: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "chat_rooms", id), {
      lastMessage: "📷 사진",
      lastMessageAt: serverTimestamp(),
      unreadCount: increment(1),
    });
  };

  if (!room) return <div className="chat-loading">채팅방 로딩 중…</div>;

  return (
    <div className="chat-room">
      <div className="chat-top">
        {isLawyer ? "변호사 모드: 무제한" : `남은 상담 횟수: ${remain}회`}
      </div>

      <div className="chat-list">
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            text={m.text || ""}
            isUser={m.uid === myUid}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => sendImage(e.target.files[0])}
          disabled={!canSend}
        />

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            canSend ? "메시지 입력..." : "이 채팅방 이용권이 없어요"
          }
          disabled={!canSend}
        />

        <button onClick={sendMessage} disabled={!canSend}>
          📩
        </button>
      </div>
    </div>
  );
}
