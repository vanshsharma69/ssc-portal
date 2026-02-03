import { Menu, Bell, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  
  useEffect(() => {
    const body = document.body;
    if (open) {
      body.classList.add("overflow-hidden");
    } else {
      body.classList.remove("overflow-hidden");
    }
    return () => body.classList.remove("overflow-hidden");
  }, [open]);

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Members", path: "/members" },
    { name: "Attendance", path: "/attendance" },
    { name: "Events", path: "/events" },
    { name: "Leaderboard", path: "/leaderboard" },
  ];

  return (
    <div className="flex">

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md
        flex flex-col justify-between 
        transform transition-transform duration-300 ease-in-out z-50
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >

        {/* TOP HEADER */}
        <div>
          <div className="flex items-center justify-between p-6 text-2xl font-bold md:block">
            SSC Portal
            <X
              className="w-6 h-6 cursor-pointer md:hidden"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Navigation */}
         <nav className="flex flex-col gap-2 p-4 font-medium">
            {navItems.map((item) => {
              
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`p-3 rounded-md transition-all 
                    ${isActive
                      ? "bg-gray-200 font-semibold border-l-4 border-black"
                      : "hover:bg-gray-100 border-l-4 border-transparent"
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* BOTTOM LOGOUT BUTTON */}
        <div className="py-4 px-2 border-t border-gray-200">
          <p className="mb-6 text-gray-600 text-sm">Made with ❤️ by <a className="text-blue-300 underline" href="https://www.linkedin.com/in/vansh-sharma-sde/ ">Vansh Sharma</a></p>
          <button
            onClick={logout}
            className="w-full p-3 rounded-md bg-red-50 text-red-600 font-medium 
            hover:bg-red-100 transition"
          >
            Logout
          </button>
        </div>

      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 h-screen overflow-y-auto bg-gray-100 relative">

        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between border-b border-gray-200 p-4 bg-white shadow-sm">
          <Menu className="w-6 h-6 cursor-pointer" onClick={() => setOpen(true)} />
          <div className="text-xl font-bold">SSC Portal</div>
          <Bell className="w-6 h-6" />
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
