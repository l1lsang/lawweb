import { FaHome, FaComments, FaStore, FaUsers } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "./bottomTabs.css";

export default function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/home", label: "홈", icon: <FaHome /> },
    { path: "/chat", label: "채팅", icon: <FaComments /> },
    { path: "/store", label: "상점", icon: <FaStore /> },
    { path: "/community", label: "커뮤니티", icon: <FaUsers /> },
  ];

  return (
    <nav className="bottom-tabs">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            className={active ? "active" : ""}
            onClick={() => navigate(tab.path)}
          >
            <span className="icon">{tab.icon}</span>
            <span className="label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
