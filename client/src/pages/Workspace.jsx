import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // workspace details (members, role, invite code)
  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}`)
      .then((res) => setWorkspace(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load workspace"),
      );
  }, [workspaceId, refresh]);

  // projects (search + pagination)
  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}/projects`, { params: { search, page } })
      .then((res) => {
        setProjects(res.data.projects);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load projects"),
      );
  }, [workspaceId, search, page, refresh]);

  const isAdmin = workspace?.myRole === "admin";
  const isOwner = workspace?.owner === user.id;

  const deleteWorkspace = async () => {
    if (
      !window.confirm(
        `Delete "${workspace.name}" with all its projects and tasks? This cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete workspace");
    }
  };

  const run = async (action) => {
    try {
      setError("");
      await action();
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const createProject = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post(`/workspaces/${workspaceId}/projects`, {
        name,
        description,
      });
      setName("");
      setDescription("");
      setPage(1);
    });
  };

  const deleteProject = (id) => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    run(() => api.delete(`/workspaces/${workspaceId}/projects/${id}`));
  };

  const changeRole = (userId, role) =>
    run(() =>
      api.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role }),
    );

  const removeMember = (userId) => {
    if (!window.confirm("Remove this member?")) return;
    run(() => api.delete(`/workspaces/${workspaceId}/members/${userId}`));
  };

  const newInviteCode = () =>
    run(() => api.post(`/workspaces/${workspaceId}/invite-code`));

  const copyCode = async () => {
    await navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-5xl mx-auto p-6">
          {error ? (
            <>
              <p className="bg-red-100 text-red-700 p-2 rounded text-sm">
                {error}
              </p>
              <Link to="/" className="text-blue-600 mt-4 inline-block">
                ← Back to workspaces
              </Link>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-5xl mx-auto p-6 space-y-4">
        <Link to="/" className="text-blue-600 text-sm">
          ← All workspaces
        </Link>

        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{workspace.name}</h2>
          <span className="text-xs bg-gray-200 rounded px-2 py-1 uppercase">
            {workspace.myRole}
          </span>
          {isOwner && (
            <button
              onClick={deleteWorkspace}
              className="ml-auto text-red-600 text-sm"
            >
              Delete workspace
            </button>
          )}
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</p>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* PROJECTS */}
          <section className="md:col-span-2 space-y-4">
            <form
              onSubmit={createProject}
              className="bg-white p-4 rounded-xl shadow space-y-3"
            >
              <h3 className="font-semibold">New project</h3>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                required
                className="w-full border rounded p-2"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full border rounded p-2"
              />
              <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                Add project
              </button>
            </form>

            <form onSubmit={submitSearch} className="flex gap-2">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search projects..."
                className="flex-1 border rounded p-2 bg-white"
              />
              <button className="bg-gray-800 text-white rounded px-4">
                Search
              </button>
            </form>

            {projects.length === 0 ? (
              <p className="text-gray-500">No projects found.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white p-4 rounded-xl shadow flex justify-between items-start"
                  >
                    <Link
                      to={`/workspaces/${workspaceId}/projects/${p._id}`}
                      className="flex-1"
                    >
                      <p className="font-semibold">{p.name}</p>
                      {p.description && (
                        <p className="text-sm text-gray-600">{p.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        by {p.createdBy?.name} · {p.status}
                      </p>
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => deleteProject(p._id)}
                        className="text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 bg-white rounded shadow disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-white rounded shadow disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-4">
            {isAdmin && (
              <div className="bg-white p-4 rounded-xl shadow space-y-2">
                <h3 className="font-semibold">Invite code</h3>
                <p className="font-mono bg-gray-100 rounded p-2 text-center">
                  {workspace.inviteCode}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={copyCode}
                    className="flex-1 bg-gray-800 text-white rounded py-1"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={newInviteCode}
                    className="flex-1 border rounded py-1"
                  >
                    New code
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow space-y-3">
              <h3 className="font-semibold">
                Members ({workspace.members.length})
              </h3>
              {workspace.members.map((m) => {
                const memberIsOwner = m.user._id === workspace.owner;
                return (
                  <div key={m.user._id} className="text-sm">
                    <p className="font-medium">
                      {m.user.name}{" "}
                      {memberIsOwner && (
                        <span className="text-xs text-gray-500">(owner)</span>
                      )}
                    </p>
                    <p className="text-gray-500">{m.user.email}</p>
                    {isAdmin && !memberIsOwner ? (
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={m.role}
                          onChange={(e) =>
                            changeRole(m.user._id, e.target.value)
                          }
                          className="border rounded px-1"
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          onClick={() => removeMember(m.user._id)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs uppercase text-gray-400">
                        {m.role}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
