import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-600 text-white text-sm">
            T
          </span>
          TeamBoard
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-gray-200 font-semibold">
            {initial}
          </span>
          <span className="hidden sm:inline text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-gray-500 hover:text-red-600">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
