import { useState } from "react";
import Header from "../components/Header";
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

      <main className="app-content">{children}</main>
    </div>
  );
}

export default AppLayout;
