import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import "./ChatList.css";

/* ===============================
   ⏱ 시간 포맷
================================ */
function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < min) return "방금 전";
  if (diff < hour) return `${Math.floor(diff / min)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ChatList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    let unsubUser;
    let unsubLawyer;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRooms([]);
        return;
      }

      let userRooms = [];
      let lawyerRooms = [];

      const mergeRooms = () => {
        const map = {};

        [...userRooms, ...lawyerRooms].forEach((r) => {
          map[r.id] = r;
        });

        const sorted = Object.values(map).sort(
          (a, b) =>
            (b.lastMessageAt?.seconds ?? 0) -
            (a.lastMessageAt?.seconds ?? 0)
        );

        setRooms(sorted);
      };

      const qUser = query(
        collection(db, "chat_rooms"),
        where("clientId", "==", user.uid),
        orderBy("lastMessageAt", "desc")
      );

      const qLawyer = query(
        collection(db, "chat_rooms"),
        where("lawyerId", "==", user.uid),
        orderBy("lastMessageAt", "desc")
      );

      unsubUser = onSnapshot(qUser, (snap) => {
        userRooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeRooms();
      });

      unsubLawyer = onSnapshot(qLawyer, (snap) => {
        lawyerRooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeRooms();
      });
    });

    return () => {
      unsubAuth();
      unsubUser && unsubUser();
      unsubLawyer && unsubLawyer();
    };
  }, []);

  return (
    <div className="chat-list">
      {/* 타이틀 */}
      <div className="chat-header">
        <h1>내 채팅방</h1>
        <p>진행 중인 상담 목록입니다</p>
      </div>

      {/* 리스트 */}
      <div className="chat-rooms">
        {rooms.map((item) => {
          const unread = item.unreadCount ?? 0;

          return (
            <div
              key={item.id}
              className="chat-card"
              onClick={() => navigate(`/chat/${item.id}`)}
            >
              {/* 상단 */}
              <div className="chat-card-top">
                <div className="chat-title">
                  상담방 #{item.id.slice(0, 6)}
                </div>
                <div className="chat-time">
                  {formatTime(item.lastMessageAt)}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="chat-preview">
                <div className="chat-message">
                  {item.lastMessage ?? "메시지가 없습니다"}
                </div>

                {unread > 0 && (
                  <div className="chat-unread">
                    {unread}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
