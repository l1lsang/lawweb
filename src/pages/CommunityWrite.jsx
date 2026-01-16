import { useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../config/firebase";
import "./CommunityWrite.css";

export default function CommunityWrite() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  /* 🔒 로그인 체크 */
  if (!user) {
    return (
      <div className="center">
        <div className="login-card">
          로그인 후 글을 작성할 수 있습니다.
        </div>
      </div>
    );
  }

  /* ✏️ 글 등록 */
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return window.alert("제목과 내용을 모두 입력해주세요.");
    }

    try {
      setSaving(true);

      const ref = await addDoc(collection(db, "community_posts"), {
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        commentCount: 0,
      });

      setSaving(false);
      window.alert("글이 등록되었습니다.");
      navigate(`/community/${ref.id}`, { replace: true });
    } catch (e) {
      console.error(e);
      setSaving(false);
      window.alert("글 작성 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="write">
      {/* 헤더 */}
      <div className="header">
        <button className="back" onClick={() => navigate(-1)}>
          <IoChevronBack size={26} />
        </button>
        <h1>익명 글쓰기</h1>
      </div>

      {/* 입력 카드 */}
      <div className="card">
        <input
          className="input"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="input textarea"
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          className="submit"
          disabled={saving}
          onClick={handleSubmit}
        >
          {saving ? "등록 중..." : "등록하기"}
        </button>
      </div>
    </div>
  );
}
