import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/workspaces")
      .then((res) => setWorkspaces(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load workspaces"),
      )
      .finally(() => setLoading(false));
  }, []);

  const createWorkspace = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/workspaces", { name });
      navigate(`/workspaces/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create workspace");
    }
  };

  const joinWorkspace = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/workspaces/join", { inviteCode });
      navigate(`/workspaces/${data.workspaceId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not join workspace");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Welcome, {user.name}!</h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <form
            onSubmit={createWorkspace}
            className="bg-white p-4 rounded-xl shadow space-y-3"
          >
            <h3 className="font-semibold">Create a workspace</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
              required
              className="w-full border rounded p-2"
            />
            <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
              Create
            </button>
          </form>

          <form
            onSubmit={joinWorkspace}
            className="bg-white p-4 rounded-xl shadow space-y-3"
          >
            <h3 className="font-semibold">Join with invite code</h3>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code"
              required
              className="w-full border rounded p-2"
            />
            <button className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700">
              Join
            </button>
          </form>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Your workspaces</h3>
          {loading ? (
            <p>Loading...</p>
          ) : workspaces.length === 0 ? (
            <p className="text-gray-500">
              No workspaces yet. Create one or join with a code.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workspaces.map((w) => (
                <Link
                  key={w._id}
                  to={`/workspaces/${w._id}`}
                  className="bg-white p-4 rounded-xl shadow hover:shadow-md"
                >
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-sm text-gray-500">
                    Created {new Date(w.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
