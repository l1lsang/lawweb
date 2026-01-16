import { useParams, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import "./CommunityDetail.css";

/* 댓글 익명 등급 색상 */
const PROFILE_LEVELS = {
  general: { color: "#000000" },
  silver: { color: "#64748B" },
  gold: { color: "#D97706" },
  platinum: { color: "#4F46E5" },
};

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingPost, setLoadingPost] = useState(true);
  const [sending, setSending] = useState(false);

  /* 게시글 구독 */
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "community_posts", id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
      setLoadingPost(false);
    });
  }, [id]);

  /* 댓글 구독 */
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "community_posts", id, "comments"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [id]);

  /* 댓글 작성 */
  const handleAddComment = async () => {
    if (!user) return window.alert("로그인이 필요합니다.");
    if (!commentText.trim())
      return window.alert("댓글 내용을 입력해주세요.");

    try {
      setSending(true);
      const userId = user.uid;
      const postRef = doc(db, "community_posts", id);

      // 익명 번호
      const anonMapRef = doc(
        db,
        "community_posts",
        id,
        "anon_map",
        userId
      );
      const anonSnap = await getDoc(anonMapRef);

      let anonNumber;
      if (anonSnap.exists()) {
        anonNumber = anonSnap.data().number;
      } else {
        const allSnap = await getDocs(
          collection(db, "community_posts", id, "anon_map")
        );
        let max = 0;
        allSnap.forEach((d) => (max = Math.max(max, d.data().number ?? 0)));
        anonNumber = max + 1;
        await setDoc(anonMapRef, { number: anonNumber });
      }

      // 유저 등급
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const authorLevel = userSnap.exists()
        ? userSnap.data().level ?? "general"
        : "general";

      // 댓글 저장
      await addDoc(
        collection(db, "community_posts", id, "comments"),
        {
          uid: userId,
          content: commentText.trim(),
          anon: anonNumber,
          authorLevel,
          createdAt: serverTimestamp(),
        }
      );

      await updateDoc(postRef, { commentCount: increment(1) });
      setCommentText("");
      setSending(false);
    } catch (e) {
      setSending(false);
      window.alert("댓글 작성 중 문제가 발생했습니다.");
    }
  };

  if (loadingPost || !post) {
    return (
      <div className="center">
        <p className="sub">게시글을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="detail">
      {/* 헤더 */}
      <div className="header">
        <button className="back" onClick={() => navigate(-1)}>
          <IoChevronBack size={26} />
        </button>
        <h1>게시글 상세</h1>
      </div>

      {/* 게시글 */}
      <div className="card">
        <h2 className="title">{post.title}</h2>
        <p className="content">{post.content}</p>
        <p className="meta">
          {post.createdAt
            ? post.createdAt.toDate().toLocaleString()
            : "시간 정보 없음"}{" "}
          · 댓글 {post.commentCount ?? 0}개
        </p>
      </div>

      {/* 댓글 */}
      <h3 className="section">댓글</h3>

      {comments.length === 0 && (
        <p className="empty">
          아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요!
        </p>
      )}

      {comments.map((c) => {
        const level =
          PROFILE_LEVELS[c.authorLevel] || PROFILE_LEVELS.general;

        return (
          <div key={c.id} className="comment">
            <span className="anon" style={{ color: level.color }}>
              익명{c.anon}
            </span>
            <p className="comment-text">{c.content}</p>
            <span className="time">
              {c.createdAt
                ? c.createdAt.toDate().toLocaleString()
                : "방금 전"}
            </span>
          </div>
        );
      })}

      {/* 입력 */}
      <div className="input-wrap">
        {!user && (
          <p className="hint">로그인 후 댓글을 작성할 수 있습니다.</p>
        )}

        {user && (
          <>
            <textarea
              className="input"
              placeholder="댓글을 입력하세요"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              className="submit"
              disabled={sending}
              onClick={handleAddComment}
            >
              {sending ? "작성 중..." : "댓글 등록"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
