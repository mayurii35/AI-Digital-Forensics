import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, FolderOpen, FileCheck2, Plus, ShieldCheck } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import Loading from "../components/Loading.jsx";
import { fetchCases, fetchAuditLogs } from "../services/api.js";

const statusTone = (status) => String(status).toLowerCase() === "closed" ? "badge-success" : String(status).toLowerCase() === "open" ? "badge-warning" : "badge-neutral";
export default function Dashboard() {
  const navigate = useNavigate(); const [data, setData] = useState({ cases: [], audits: [] }); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const [cases, audits] = await Promise.all([fetchCases(), fetchAuditLogs()]); setData({ cases, audits }); } catch { setError("Could not load dashboard data."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  if (loading) return <Loading label="Loading investigation workspace…" />;
  const { cases, audits } = data, recent = [...cases].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  const open = cases.filter(c => String(c.status).toLowerCase() === "open").length, closed = cases.filter(c => String(c.status).toLowerCase() === "closed").length;
  return <section className="page-shell"><div className="page-heading"><div><p className="eyebrow">COMMAND CENTER</p><h1>Investigation Dashboard</h1><p>Monitor active matters, evidence, and chain-of-custody activity.</p></div><button className="btn btn-primary" onClick={() => navigate("/cases/create")}><Plus size={17}/> New Case</button></div>
    {error && <div className="error-card">{error}<button className="btn btn-ghost" onClick={load}>Retry</button></div>}
    <div className="stats-grid"><StatCard label="Total Cases" value={cases.length} icon={<BriefcaseBusiness/>} tone="neutral"/><StatCard label="Open Cases" value={open} icon={<FolderOpen/>} tone="warning"/><StatCard label="Closed Cases" value={closed} icon={<FileCheck2/>} tone="success"/><StatCard label="Total Audit Logs" value={audits.length} icon={<ShieldCheck/>} tone="neutral"/></div>
    <div className="card table-card"><div className="card-heading"><div><h2>Recent Cases</h2><p>Your five most recently created investigations.</p></div><button className="text-button" onClick={() => navigate("/cases")}>View all</button></div>{recent.length ? <div className="table-wrap"><table><thead><tr><th>Case Name</th><th>Category</th><th>Status</th><th>Created</th></tr></thead><tbody>{recent.map(c => <tr key={c.case_id} onClick={() => navigate(`/cases/${c.case_id}`)} className="click-row"><td><strong>{c.title}</strong></td><td>{c.crime_category || "—"}</td><td><span className={`badge ${statusTone(c.status)}`}>{c.status}</span></td><td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div> : <div className="empty-state"><FolderOpen size={32}/><p>No cases yet. Start a new investigation to populate your workspace.</p></div>}</div></section>;
}
