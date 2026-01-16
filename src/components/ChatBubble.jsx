import { useEffect, useState } from "react";
import "./ChatBubble.css";

export default function ChatBubble({ text, isUser }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 직후 애니메이션 트리거
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={[
        "chat-bubble",
        isUser ? "user" : "other",
        visible ? "show" : "",
      ].join(" ")}
    >
      {text}
    </div>
  );
}
