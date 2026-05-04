import { useState } from "react";
import Header from "../components/Header";
import TopNav from "../components/TopNav";

import "../styles/layout.css";

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  return (
    <div className={`app-layout ${collapsed ? "collapsed" : ""}`}>
      <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />

      {/* RIGHT SIDE */}
      <div className="main-area">
        <TopNav />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
