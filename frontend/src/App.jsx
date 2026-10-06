import { useEffect, useState } from "react";
import ApplicationForm from "./ApplicationForm";
import { API_URL, STATUSES } from "./constants";

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Re-runs whenever the filter or search text changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("q", search);

    setLoading(true);
    setError(null);
    fetch(`${API_URL}/applications?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => setApplications(data))
      .catch(() => setError("Could not load applications. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  function handleAdd(newApplication) {
    setApplications((prev) => [newApplication, ...prev]);
  }

  async function handleStatusChange(id, newStatus) {
    const res = await fetch(`${API_URL}/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  async function handleDelete(id) {
    const res = await fetch(`${API_URL}/applications/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div>
      <h1>Job Applications</h1>
      <ApplicationForm onAdd={handleAdd} />

      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or role"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <p>No applications found.</p>
      )}

      <ul>
        {applications.map((app) => (
          <li key={app.id}>
            {app.company} - {app.role}{" "}
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(app.id, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>{" "}
            <button onClick={() => handleDelete(app.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;