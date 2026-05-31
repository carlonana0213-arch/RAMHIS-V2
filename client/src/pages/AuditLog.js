import { useEffect, useState } from "react";
import { getAuditLogs, getAuditLocations } from "../services/auditLogService";
import "../styles/auditLog.css";

const moduleFilters = [
  "All",
  "Authentication",
  "Registration",
  "Consultation",
  "Medicine Release",
  "Inventory",
  "Accounts",
  "Events",
];

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [locations, setLocations] = useState([]);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const result = await getAuditLogs({
        search,
        module: moduleFilter,
        location: locationFilter,
      });

      setLogs(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const result = await getAuditLocations();
      setLocations(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to load audit locations:", error);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, moduleFilter, locationFilter]);

  return (
    <div className="audit-page">
      {/* HEADER */}
      <div className="audit-header-card">
        <h1>Audit Log</h1>
        <p>
          Monitor system activities including registrations, consultations,
          medicine release, inventory updates, account changes, and event actions.
        </p>
      </div>

      {/* SEARCH */}
      <div className="audit-search-row">
        <input
          type="text"
          placeholder="Search by user, action, location, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER */}
      <div className="audit-filter-row">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          {moduleFilters.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Modules" : item}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="All">All Locations</option>

          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="audit-table-card">
        <table className="audit-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="audit-empty">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="audit-empty">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const date = new Date(log.createdAt);

                return (
                  <tr key={log._id}>
                    <td>
                      <strong>{log.userName || "System"}</strong>
                      <span>{log.userRole || "-"}</span>
                    </td>

                    <td>
                      <strong>{log.action}</strong>
                      <span>{log.description}</span>
                    </td>

                    <td>{date.toLocaleDateString()}</td>
                    <td>{date.toLocaleTimeString()}</td>
                    <td>{log.location || "System"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;