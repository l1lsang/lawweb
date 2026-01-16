// src/components/Footer.jsx
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-info">
        <span>주식회사 대연아이앤씨</span>
        <span>대표자: 허승우</span>
        <span>사업자등록번호: 665-60-00626</span>
      </div>

      <div className="footer-links">
        <a href="/policy">이용약관</a>
        <a href="/policy">개인정보처리방침</a>
        <a href="/policy">환불정책</a>
      </div>

      <div className="footer-copy">
        © 2026 DAEYEON INC. All rights reserved.
      </div>
    </footer>
  );
}
