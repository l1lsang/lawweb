import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import "./CommunityList.css";

/* ===============================
   익명 등급 프로필
================================ */
const PROFILE_LEVELS = {
  general: {
    label: "일반",
    icon: "🙂",
    color: "#94A3B8",
    glow: "transparent",
    border: "#E5E7EB",
  },
  silver: {
    label: "실버",
    icon: "🐬",
    color: "#64748B",
    glow: "rgba(148,163,184,0.35)",
    border: "#94A3B8",
  },
  gold: {
    label: "골드",
    icon: "🦊",
    color: "#D97706",
    glow: "rgba(245,158,11,0.45)",
    border: "#F59E0B",
  },
  platinum: {
    label: "플래티넘",
    icon: "🦄",
    color: "#4F46E5",
    glow: "rgba(99,102,241,0.55)",
    border: "#6366F1",
  },
};

export default function CommunityList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  /* 🔐 Auth 구독 */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  /* 🔥 글 목록 */
  useEffect(() => {
    const q = query(
      collection(db, "community_posts"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setPosts(list);
    });

    return () => unsub();
  }, []);

  return (
    <div className="community">
      {/* 상단 */}
      <div className="community-header">
        <div>
          <h1>익명 커뮤니티</h1>
          <p>자유롭게 고민을 나눠보세요</p>
        </div>

        {user && (
          <button
            className="write-btn"
            onClick={() => navigate("/community/write")}
          >
            글쓰기
          </button>
        )}
      </div>

      {/* 비로그인 안내 */}
      {!user && (
        <div className="login-hint">
          글쓰기와 댓글 기능은 로그인 후 이용할 수 있어요.
        </div>
      )}

      {/* 글 없음 */}
      {posts.length === 0 && (
        <p className="empty-text">아직 작성된 글이 없습니다.</p>
      )}

      {/* 글 목록 */}
      {posts.map((post) => {
        const level =
          PROFILE_LEVELS[post.authorLevel] ||
          PROFILE_LEVELS.general;

        return (
          <div
            key={post.id}
            className="post-card"
            style={{ borderLeftColor: level.border }}
            onClick={() => navigate(`/community/${post.id}`)}
          >
            {/* 프로필 */}
            <div className="post-profile">
              <div
                className="profile-icon"
                style={{ boxShadow: `0 0 12px ${level.glow}` }}
              >
                {level.icon}
              </div>
              <span
                className="profile-label"
                style={{ color: level.color }}
              >
                익명 · {level.label}
              </span>
            </div>

            {/* 제목 */}
            <div className="post-title">
              {post.title ?? "(제목 없음)"}
            </div>

            {/* 내용 */}
            <div className="post-content">
              {post.content ?? ""}
            </div>

            {/* 하단 */}
            <div className="post-footer">
              댓글 {post.commentCount ?? 0}개 ·{" "}
              {post.createdAt
                ? post.createdAt.toDate().toLocaleString()
                : "시간 정보 없음"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
