import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * Shell shared by every authenticated screen: fixed sidebar, sticky header and
 * a scrollable content area where routed pages render through <Outlet />.
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-lavender-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-6 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
