import { NavLink } from "react-router-dom";
import { Ionicons } from "@expo/vector-icons";
import "./bottomTabs.css";

export default function BottomTabs() {
  const tabs = [
    { to: "/", label: "홈", on: "home", off: "home-outline" },
    {
      to: "/chat",
      label: "채팅",
      on: "chatbubble-ellipses",
      off: "chatbubble-ellipses-outline",
    },
    { to: "/store", label: "상점", on: "cart", off: "cart-outline" },
    {
      to: "/community",
      label: "커뮤니티",
      on: "people",
      off: "people-outline",
    },
  ];

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `tab-item ${isActive ? "active" : ""}`
          }
        >
          {({ isActive }) => (
            <>
              <Ionicons
                name={isActive ? tab.on : tab.off}
                size={24}
                color={isActive ? "#2F6FFF" : "#999"}
              />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
