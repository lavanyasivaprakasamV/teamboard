import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const COLUMNS = [
  {
    key: "todo",
    label: "To Do",
    dot: "bg-slate-400",
    top: "border-t-slate-400",
    empty: "Nothing planned yet. Add a task above.",
  },
  {
    key: "in_progress",
    label: "In Progress",
    dot: "bg-amber-400",
    top: "border-t-amber-400",
    empty: "Nothing in progress right now.",
  },
  {
    key: "done",
    label: "Done",
    dot: "bg-emerald-500",
    top: "border-t-emerald-500",
    empty: "Finished tasks show up here.",
  },
];

const PRIORITY_DOT = {
  low: "bg-slate-400",
  medium: "bg-amber-400",
  high: "bg-red-600",
};

function Avatar({ name }) {
  return (
    <span
      title={name || "Unassigned"}
      className={`grid place-items-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 ${
        name ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
      }`}
    >
      {name ? name.charAt(0).toUpperCase() : "?"}
    </span>
  );
}

export default function Board() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuth();
  const base = `/workspaces/${workspaceId}/projects/${projectId}`;

  const [workspace, setWorkspace] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState("");

  // workspace (members, role) + project details
  useEffect(() => {
    Promise.all([
      api.get(`/workspaces/${workspaceId}`),
      api.get(`/workspaces/${workspaceId}/projects/${projectId}`),
    ])
      .then(([w, p]) => {
        setWorkspace(w.data);
        setProject(p.data);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load project"),
      );
  }, [workspaceId, projectId]);

  // tasks (search + my tasks filter)
  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        params: { search, assignee: onlyMine ? "me" : undefined },
      })
      .then((res) => setTasks(res.data.tasks))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load tasks"),
      );
  }, [workspaceId, projectId, search, onlyMine, refresh]);

  const isAdmin = workspace?.myRole === "admin";
  const canDelete = (task) => isAdmin || task.createdBy === user.id;
  const filtering = Boolean(search) || onlyMine;

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const percent = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;

  const createTask = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await api.post(`${base}/tasks`, {
        title,
        priority,
        assignee: assignee || null,
      });
      setTitle("");
      setPriority("medium");
      setAssignee("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create task");
    }
  };

  const updateTask = async (id, changes) => {
    try {
      setError("");
      const { data } = await api.patch(`${base}/tasks/${id}`, changes);
      setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update task");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      setError("");
      await api.delete(`${base}/tasks/${id}`);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task");
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  if (!workspace || !project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto p-6">
          {error ? (
            <>
              <p className="bg-red-100 text-red-700 p-3 rounded text-sm">
                {error}
              </p>
              <Link
                to={`/workspaces/${workspaceId}`}
                className="text-blue-600 mt-4 inline-block"
              >
                Back to workspace
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
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 space-y-5">
        <Link
          to={`/workspaces/${workspaceId}`}
          className="text-blue-600 text-sm font-medium"
        >
          {workspace.name}
        </Link>

        {/* PROJECT HEADER */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <span className="text-xs bg-gray-200 rounded-full px-2.5 py-1 capitalize">
              {project.status}
            </span>
          </div>
          {project.description && (
            <p className="text-gray-600 max-w-2xl">{project.description}</p>
          )}

          {!filtering && tasks.length > 0 && (
            <div className="max-w-sm">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {doneCount} of {tasks.length} tasks done
                </span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</p>
        )}

        {/* ADD TASK */}
        <form
          onSubmit={createTask}
          className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-2 items-center"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            className="flex-1 min-w-48 border rounded p-2"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border rounded p-2"
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Unassigned</option>
            {workspace.members.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.name}
              </option>
            ))}
          </select>
          <button className="bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700">
            Add task
          </button>
        </form>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 items-center">
          <form onSubmit={submitSearch} className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tasks..."
              className="border rounded p-2"
            />
            <button className="bg-gray-800 text-white rounded px-4">
              Search
            </button>
          </form>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            My tasks only
          </label>
        </div>

        {/* BOARD */}
        <div className="grid md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col, idx) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            const prev = COLUMNS[idx - 1];
            const next = COLUMNS[idx + 1];

            return (
              <section
                key={col.key}
                className={`bg-gray-200/60 rounded-xl p-3 space-y-3 border-t-4 ${col.top}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-semibold">{col.label}</h3>
                  <span className="ml-auto text-xs bg-white rounded-full px-2 py-0.5 text-gray-600">
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center border border-dashed border-gray-400 rounded-lg py-6 px-3">
                    {col.empty}
                  </p>
                )}

                {colTasks.map((t) => (
                  <div
                    key={t._id}
                    className="bg-white rounded-lg shadow p-3 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium leading-snug">{t.title}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 capitalize shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full ${PRIORITY_DOT[t.priority]}`}
                        />
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar name={t.assignee?.name} />
                      <select
                        value={t.assignee?._id || ""}
                        onChange={(e) =>
                          updateTask(t._id, {
                            assignee: e.target.value || null,
                          })
                        }
                        className="flex-1 min-w-0 border rounded p-1 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {workspace.members.map((m) => (
                          <option key={m.user._id} value={m.user._id}>
                            {m.user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                      <div className="flex flex-wrap gap-x-3">
                        {prev && (
                          <button
                            onClick={() =>
                              updateTask(t._id, { status: prev.key })
                            }
                            className="text-gray-600 hover:text-blue-600"
                          >
                            Back to {prev.label}
                          </button>
                        )}
                        {next && (
                          <button
                            onClick={() =>
                              updateTask(t._id, { status: next.key })
                            }
                            className="text-blue-600 font-medium hover:text-blue-700"
                          >
                            Move to {next.label}
                          </button>
                        )}
                      </div>
                      {canDelete(t) && (
                        <button
                          onClick={() => deleteTask(t._id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
