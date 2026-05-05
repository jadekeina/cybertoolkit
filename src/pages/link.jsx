import { useState } from "react";
import '../index.css';

// Google Safe Browsing API v4
// Ajoute dans ton .env : VITE_SAFE_BROWSING_KEY=ta_clé
async function checkUrl(url) {
    const API_KEY = import.meta.env.VITE_SAFE_BROWSING_KEY || "";

    if (!API_KEY) throw new Error("NO_API_KEY");

    // Normalize URL
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    const body = {
        client: { clientId: "cyber-toolkit", clientVersion: "1.0" },
        threatInfo: {
            threatTypes: [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
                "THREAT_TYPE_UNSPECIFIED",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: normalized }],
        },
    };

    const res = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }
    );

    if (res.status === 400) throw new Error("INVALID_URL");
    if (res.status === 403) throw new Error("INVALID_KEY");
    if (!res.ok) throw new Error("API_ERROR");

    const data = await res.json();
    const threats = data.matches || [];

    // Also do a basic heuristic analysis
    const heuristics = analyzeUrl(normalized);

    return {
        url: normalized,
        safe: threats.length === 0,
        threats,
        heuristics,
    };
}

// Client-side heuristic checks (no API needed)
function analyzeUrl(url) {
    const flags = [];
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const full = url.toLowerCase();

        // Suspicious TLDs
        const badTlds = [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".click", ".loan", ".win", ".download"];
        if (badTlds.some((t) => host.endsWith(t))) flags.push({ type: "warning", label: "TLD suspect", detail: "Ce domaine utilise un TLD souvent associé aux sites malveillants." });

        // IP address instead of domain
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) flags.push({ type: "danger", label: "Adresse IP directe", detail: "Les liens légitimes utilisent rarement une IP brute." });

        // Very long URL
        if (url.length > 150) flags.push({ type: "warning", label: "URL très longue", detail: `${url.length} caractères — peut masquer la vraie destination.` });

        // Punycode (homograph attack)
        if (host.includes("xn--")) flags.push({ type: "danger", label: "Caractères Unicode (homographe)", detail: "Le domaine utilise des caractères qui imitent des lettres latines." });

        // Multiple subdomains
        const parts = host.split(".");
        if (parts.length > 4) flags.push({ type: "warning", label: "Sous-domaines multiples", detail: "Ex: paypal.com.login.evil.com — le vrai domaine est evil.com." });

        // Sensitive keywords in URL
        const phishWords = ["login", "signin", "secure", "account", "update", "verify", "bank", "paypal", "apple", "amazon", "microsoft"];
        const found = phishWords.filter((w) => full.includes(w));
        if (found.length >= 2) flags.push({ type: "warning", label: "Mots-clés sensibles", detail: `Contient : ${found.join(", ")}` });

        // HTTP (not HTTPS)
        if (parsed.protocol === "http:") flags.push({ type: "warning", label: "Pas de HTTPS", detail: "La connexion n'est pas chiffrée." });

        // URL shortener
        const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "short.link", "cutt.ly"];
        if (shorteners.some((s) => host.includes(s))) flags.push({ type: "info", label: "Raccourcisseur d'URL", detail: "La vraie destination est masquée. Impossible de savoir où ce lien mène." });

    } catch {
        flags.push({ type: "danger", label: "URL invalide", detail: "Impossible de parser cette URL." });
    }

    return flags;
}

const THREAT_LABELS = {
    MALWARE: { label: "Malware", color: "#c0392b", icon: "🦠" },
    SOCIAL_ENGINEERING: { label: "Phishing / Ingénierie sociale", color: "#e07b3a", icon: "🎣" },
    UNWANTED_SOFTWARE: { label: "Logiciel indésirable", color: "#8e44ad", icon: "⚠️" },
    POTENTIALLY_HARMFUL_APPLICATION: { label: "Application potentiellement dangereuse", color: "#c0392b", icon: "💀" },
    THREAT_TYPE_UNSPECIFIED: { label: "Menace non spécifiée", color: "#888", icon: "❓" },
};

const FLAG_COLORS = { danger: "#c0392b", warning: "#FDB369", info: "#3498db" };
const FLAG_ICONS = { danger: "🚨", warning: "⚠️", info: "ℹ️" };

export default function LinkChecker() {
    const [url, setUrl] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    const handleCheck = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await checkUrl(url);
            setResult(res);
            setHistory((prev) => [{ url: res.url, safe: res.safe, threats: res.threats.length }, ...prev.slice(0, 4)]);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    const totalFlags = result ? result.heuristics.filter(f => f.type === "danger").length + result.threats.length : 0;
    const riskScore = result
        ? Math.min(100, totalFlags * 25 + result.heuristics.filter(f => f.type === "warning").length * 10)
        : 0;

    return (
        <div className="min-h-screen font-['Syne',sans-serif]" style={{ background: "#FFF6F2" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
                .nav-link { font-size:.75rem; font-weight:600; letter-spacing:.08em; color:#0C0A3E; text-decoration:none; text-transform:uppercase; transition:color .2s; }
                .nav-link:hover, .nav-link-active { color:#FDB369 !important; }
                .logo-box { background:#0C0A3E; color:white; font-size:.7rem; font-weight:800; letter-spacing:.1em; padding:6px 12px; text-transform:uppercase; text-decoration:none; line-height:1.4; }

                .input-wrap { display:flex; max-width:540px; margin:0 auto; }
                .input-field { background:#FDB369; border:none; outline:none; flex:1; padding:14px 16px; font-family:'Syne',sans-serif; font-size:.85rem; color:#0C0A3E; width:100%; }
                .input-field::placeholder { color:#8a5a2a; }
                .btn-check { background:#0C0A3E; color:white; border:none; padding:14px 22px; font-family:'Syne',sans-serif; font-size:.7rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:background .2s; white-space:nowrap; }
                .btn-check:hover:not(:disabled) { background:#FDB369; color:#0C0A3E; }
                .btn-check:disabled { opacity:.5; cursor:not-allowed; }

                .diagonal-section { background:#0C0A3E; clip-path:polygon(0 6%,100% 0%,100% 94%,0% 100%); padding:80px 40px 90px; color:white; margin-top:32px; }

                .result-banner { padding:20px 24px; display:flex; align-items:center; gap:16px; margin-bottom:20px; animation:fadeIn .4s ease; }
                .result-safe { background:rgba(76,175,80,.15); border-left:4px solid #4caf50; }
                .result-danger { background:rgba(192,57,43,.15); border-left:4px solid #c0392b; }
                .result-warning { background:rgba(253,179,105,.15); border-left:4px solid #FDB369; }

                .risk-bar-wrap { background:rgba(255,255,255,.1); height:6px; border-radius:3px; width:100%; margin-bottom:24px; }
                .risk-bar-fill { height:6px; border-radius:3px; transition:width .8s ease; }

                .flag-row { padding:10px 14px; margin-bottom:8px; display:flex; align-items:flex-start; gap:10px; animation:fadeIn .3s ease; }
                .threat-row { background:rgba(192,57,43,.15); border-left:3px solid #c0392b; padding:12px 16px; margin-bottom:8px; }

                .history-item { background:rgba(255,255,255,.05); padding:10px 14px; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; font-size:.75rem; }

                .no-key-box { background:#fff3e0; border-left:4px solid #FDB369; padding:18px 22px; margin-top:20px; font-size:.82rem; color:#5a3a00; line-height:1.7; animation:fadeIn .4s ease; max-width:540px; margin-left:auto; margin-right:auto; }
                .no-key-box code { background:#ffe0b2; padding:1px 6px; font-size:.78rem; font-family:monospace; }

                .pulse { animation:pulse 1.2s infinite; }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

                .section-label { font-size:.65rem; font-weight:800; letter-spacing:.18em; text-transform:uppercase; opacity:.5; margin-bottom:10px; }
            `}</style>

            {/* Navbar */}
            <nav className="flex justify-center flex-row w-1/2 px-8 py-5 ">
                <div className="flex justify-center gap-10">
                    <a href="/" className="nav-link">Password</a>
                    <a href="/email" className="nav-link">Email</a>
                    <a href="/file" className="nav-link">File</a>
                    <a href="/link" className="nav-link">Link</a>
                    <a href="/quiz" className="nav-link">Course</a>
                    <a href="/resources" className="nav-link">Cyber resource</a>
                </div>
            </nav>

            {/* Hero */}
            <section className="px-8 pt-10 pb-4 text-center">
                <h1 className="text-2xl font-extrabold tracking-widest uppercase mb-3" style={{ color: "#0C0A3E", lineHeight: 1.4 }}>
                    CE LIEN EST-IL<br />DANGEREUX ?
                </h1>
                <p className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: "#9a7a5a" }}>
                    Analyse via Google Safe Browsing + détection heuristique locale
                </p>

                <div className="input-wrap">
                    <input
                        type="text"
                        placeholder="https://exemple-suspect.com/login..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        className="input-field"
                    />
                    <button onClick={handleCheck} className="btn-check" disabled={loading}>
                        {loading ? <span className="pulse">...</span> : "ANALYSER"}
                    </button>
                </div>

                {/* No API Key */}
                {error === "NO_API_KEY" && (
                    <div className="no-key-box">
                        <strong>🔑 Clé API manquante</strong><br /><br />
                        1. Active <strong>Safe Browsing API</strong> sur <strong>console.cloud.google.com</strong><br />
                        2. Crée une clé API (APIs & Services → Credentials)<br />
                        3. Ajoute dans <code>.env</code> : <code>VITE_SAFE_BROWSING_KEY=ta_clé</code><br />
                        4. Redémarre le serveur dev
                    </div>
                )}
                {error === "INVALID_KEY" && (
                    <div className="no-key-box">❌ Clé API invalide. Vérifie <code>VITE_SAFE_BROWSING_KEY</code>.</div>
                )}
                {error === "INVALID_URL" && (
                    <div className="no-key-box">❌ URL invalide ou non supportée par l'API.</div>
                )}
                {error === "API_ERROR" && (
                    <div className="no-key-box">❌ Erreur API. Réessaie dans quelques secondes.</div>
                )}
            </section>

            {/* Results */}
            {result && (
                <div className="diagonal-section">
                    <div style={{ maxWidth: 540, margin: "0 auto" }}>

                        {/* URL display */}
                        <div className="text-xs font-mono opacity-40 mb-4 truncate text-white">{result.url}</div>

                        {/* Main verdict */}
                        <div className={`result-banner ${result.threats.length > 0 ? "result-danger" : result.heuristics.filter(f => f.type !== "info").length > 0 ? "result-warning" : "result-safe"}`}>
                            <span className="text-3xl">
                                {result.threats.length > 0 ? "🚨" : result.heuristics.filter(f => f.type !== "info").length > 0 ? "⚠️" : "✅"}
                            </span>
                            <div>
                                <div className="font-extrabold text-sm uppercase tracking-widest text-white">
                                    {result.threats.length > 0
                                        ? "URL DANGEREUSE"
                                        : result.heuristics.filter(f => f.type !== "info").length > 0
                                            ? "INDICES SUSPECTS"
                                            : "AUCUNE MENACE DÉTECTÉE"}
                                </div>
                                <div className="text-xs opacity-60 mt-1 text-white">
                                    {result.threats.length > 0
                                        ? `Signalée par Google Safe Browsing — ${result.threats.length} menace(s)`
                                        : result.heuristics.filter(f => f.type !== "info").length > 0
                                            ? "Safe Browsing OK, mais des indices méritent attention"
                                            : "Google Safe Browsing + analyse heuristique : tout est bon"}
                                </div>
                            </div>
                        </div>

                        {/* Risk score bar */}
                        {riskScore > 0 && (
                            <div className="mb-6">
                                <div className="flex justify-between mb-1">
                                    <span className="section-label text-white">Score de risque</span>
                                    <span className="text-xs font-bold" style={{ color: riskScore > 60 ? "#c0392b" : riskScore > 30 ? "#FDB369" : "#4caf50" }}>
                                        {riskScore}/100
                                    </span>
                                </div>
                                <div className="risk-bar-wrap">
                                    <div
                                        className="risk-bar-fill"
                                        style={{
                                            width: `${riskScore}%`,
                                            background: riskScore > 60 ? "#c0392b" : riskScore > 30 ? "#FDB369" : "#4caf50"
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Google threats */}
                        {result.threats.length > 0 && (
                            <div className="mb-6">
                                <div className="section-label text-white">Menaces Google Safe Browsing</div>
                                {result.threats.map((t, i) => {
                                    const meta = THREAT_LABELS[t.threatType] || { label: t.threatType, color: "#888", icon: "⚠️" };
                                    return (
                                        <div key={i} className="threat-row">
                                            <div className="flex items-center gap-2">
                                                <span>{meta.icon}</span>
                                                <span className="font-bold text-sm text-white">{meta.label}</span>
                                            </div>
                                            <div className="text-xs opacity-50 mt-1 text-white">
                                                Plateforme : {t.platformType} — Type : {t.threatEntryType}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Heuristic flags */}
                        {result.heuristics.length > 0 && (
                            <div className="mb-6">
                                <div className="section-label text-white">Analyse heuristique locale</div>
                                {result.heuristics.map((flag, i) => (
                                    <div key={i} className="flag-row" style={{ background: `${FLAG_COLORS[flag.type]}18`, borderLeft: `3px solid ${FLAG_COLORS[flag.type]}` }}>
                                        <span className="text-base">{FLAG_ICONS[flag.type]}</span>
                                        <div>
                                            <div className="font-bold text-xs text-white uppercase tracking-wide">{flag.label}</div>
                                            <div className="text-xs opacity-60 mt-0.5 text-white">{flag.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {result.heuristics.length === 0 && result.threats.length === 0 && (
                            <div className="flag-row" style={{ background: "rgba(76,175,80,.1)", borderLeft: "3px solid #4caf50" }}>
                                <span>✅</span>
                                <div className="text-xs text-white opacity-70">Aucun indice suspect détecté lors de l'analyse heuristique.</div>
                            </div>
                        )}

                        {/* Recent history */}
                        {history.length > 1 && (
                            <div className="mt-8">
                                <div className="section-label text-white">Analyses récentes</div>
                                {history.slice(1).map((h, i) => (
                                    <div key={i} className="history-item">
                                        <span className="text-white opacity-50 truncate flex-1 mr-4 font-mono">{h.url}</span>
                                        <span style={{ color: h.safe ? "#4caf50" : "#c0392b", fontWeight: 700, fontSize: ".7rem" }}>
                                            {h.safe ? "SAFE" : `🚨 ${h.threats} menace(s)`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ height: 60, background: "#FFF6F2" }} />
        </div>
    );
}