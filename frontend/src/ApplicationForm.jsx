import { useState } from "react";
import { API_URL, STATUSES } from "./constants";

function ApplicationForm({ onAdd }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("wishlist");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault(); // stops the page from reloading
    setError(null);
    try {
      const res = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, status }),
      });
      if (!res.ok) throw new Error("Request failed");
      const created = await res.json();
      onAdd(created);
      setCompany("");
      setRole("");
      setStatus("wishlist");
    } catch {
      setError("Could not add the application.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
        required
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role"
        required
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="submit">Add</button>
      {error && <p>{error}</p>}
    </form>
  );
}

export default ApplicationForm;