import { useState } from "react";
import '../index.css';

async function checkEmail(email) {
    // HIBP v3 API - requires API key for /breachedaccount endpoint
    // We use the public /breaches endpoint filtered client-side for demo,
    // and the real breachedaccount endpoint with the key if available
    const HIBP_KEY = import.meta.env.VITE_HIBP_API_KEY || "";

    if (!HIBP_KEY) {
        // Fallback: use the public /breaches list and pretend (educational demo)
        // In production, user needs a HIBP API key
        throw new Error("NO_API_KEY");
    }

    const res = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        {
            headers: {
                "hibp-api-key": HIBP_KEY,
                "user-agent": "CyberToolkit-App",
            },
        }
    );

    if (res.status === 404) return { breached: false, breaches: [] };
    if (res.status === 401) throw new Error("INVALID_KEY");
    if (!res.ok) throw new Error("API_ERROR");

    const data = await res.json();
    return { breached: true, breaches: data };
}

const SEVERITY_COLORS = {
    high: "#c0392b",
    medium: "#e07b3a",
    low: "#f1c40f",
};

function getSeverity(breach) {
    if (breach.DataClasses?.includes("Passwords")) return "high";
    if (breach.DataClasses?.includes("Email addresses")) return "medium";
    return "low";
}

export default function EmailChecker() {
    const [email, setEmail] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(null);

    const handleCheck = async () => {
        if (!email.trim() || !email.includes("@")) return;
        setLoading(true);
        setResult(null);
        setError(null);
        setExpanded(null);

        try {
            const res = await checkEmail(email.trim());
            setResult(res);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen font-['Syne',sans-serif]" style={{ background: "#FFF6F2" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
                .nav-link {
                    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em;
                    color: #0C0A3E; text-decoration: none; text-transform: uppercase;
                    transition: color 0.2s;
                }
                .nav-link:hover, .nav-link-active { color: #FDB369 !important; }
                .logo-box {
                    background: #0C0A3E; color: white; font-size: 0.7rem;
                    font-weight: 800; letter-spacing: 0.1em; padding: 6px 12px;
                    text-transform: uppercase; text-decoration: none; line-height: 1.4;
                }
                .input-field {
                    background: #FDB369; border: none; outline: none; flex: 1;
                    padding: 14px 16px; font-family: 'Syne', sans-serif;
                    font-size: 0.85rem; color: #0C0A3E; width: 100%;
                }
                .input-field::placeholder { color: #8a5a2a; }
                .btn-check {
                    background: #0C0A3E; color: white; border: none;
                    padding: 14px 22px; font-family: 'Syne', sans-serif;
                    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
                    text-transform: uppercase; cursor: pointer; transition: background 0.2s;
                    white-space: nowrap;
                }
                .btn-check:hover:not(:disabled) { background: #FDB369; color: #0C0A3E; }
                .btn-check:disabled { opacity: 0.5; cursor: not-allowed; }

                .diagonal-section {
                    background: #0C0A3E;
                    clip-path: polygon(0 6%, 100% 0%, 100% 94%, 0% 100%);
                    padding: 80px 40px 90px;
                    color: white;
                }

                .breach-card {
                    background: rgba(255,255,255,0.06);
                    border-left: 3px solid #FDB369;
                    padding: 14px 18px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .breach-card:hover { background: rgba(255,255,255,0.1); }

                .breach-tag {
                    display: inline-block;
                    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.08em;
                    text-transform: uppercase; padding: 2px 8px; margin: 2px;
                    background: rgba(255,255,255,0.12); border-radius: 2px;
                    color: rgba(255,255,255,0.8);
                }

                .status-safe {
                    background: #e8f5e9; border-left: 4px solid #4caf50;
                    color: #2e7d32; padding: 18px 22px; margin-top: 20px;
                    font-weight: 700; font-size: 0.9rem;
                    animation: fadeIn 0.4s ease;
                }

                .no-key-box {
                    background: #fff3e0; border-left: 4px solid #FDB369;
                    padding: 18px 22px; margin-top: 20px; font-size: 0.82rem;
                    color: #5a3a00; line-height: 1.7; animation: fadeIn 0.4s ease;
                }
                .no-key-box code {
                    background: #ffe0b2; padding: 1px 6px; font-size: 0.78rem;
                    font-family: monospace;
                }

                .pulse { animation: pulse 1.2s infinite; }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slideDown { from{opacity:0;height:0} to{opacity:1;height:auto} }

                .breach-details { animation: fadeIn 0.25s ease; }

                .stat-box {
                    background: rgba(253,179,105,0.15);
                    border: 1px solid rgba(253,179,105,0.3);
                    padding: 16px; text-align: center; flex: 1;
                }
                .loading-dot { animation: blink 1.2s infinite; }
                @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
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
                <h1
                    className="text-2xl font-extrabold tracking-widest uppercase mb-3"
                    style={{ color: "#0C0A3E", lineHeight: 1.4 }}
                >
                    TON EMAIL A-T-IL ÉTÉ<br />COMPROMIS ?
                </h1>
                <p className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: "#9a7a5a" }}>
                    Vérifie si ton adresse apparaît dans des fuites de données connues
                </p>

                <div className="flex mx-auto" style={{ maxWidth: 460 }}>
                    <input
                        type="email"
                        placeholder="ton@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        className="input-field"
                    />
                    <button onClick={handleCheck} className="btn-check" disabled={loading}>
                        {loading ? <span className="pulse">...</span> : "VÉRIFIER"}
                    </button>
                </div>

                {/* No API Key message */}
                {error === "NO_API_KEY" && (
                    <div className="no-key-box mx-auto" style={{ maxWidth: 460 }}>
                        <strong>🔑 Clé API manquante</strong><br /><br />
                        L'API HaveIBeenPwned nécessite une clé pour vérifier les emails.<br />
                        1. Obtiens une clé sur <strong>haveibeenpwned.com/API/Key</strong><br />
                        2. Ajoute dans ton <code>.env</code> : <code>VITE_HIBP_API_KEY=ta_clé</code><br />
                        3. Redémarre le serveur
                    </div>
                )}
                {error === "INVALID_KEY" && (
                    <div className="no-key-box mx-auto" style={{ maxWidth: 460 }}>
                        ❌ <strong>Clé API invalide.</strong> Vérifie ta variable <code>VITE_HIBP_API_KEY</code>.
                    </div>
                )}
                {error === "API_ERROR" && (
                    <div className="no-key-box mx-auto" style={{ maxWidth: 460 }}>
                        ❌ Erreur API. Réessaie dans quelques secondes.
                    </div>
                )}

                {/* Safe result */}
                {result && !result.breached && (
                    <div className="status-safe mx-auto" style={{ maxWidth: 460 }}>
                        ✅ Bonne nouvelle ! Cet email n'apparaît dans aucune fuite connue.
                    </div>
                )}
            </section>

            {/* Breaches section */}
            {result && result.breached && (
                <div className="diagonal-section mt-8">
                    <div style={{ maxWidth: 560, margin: "0 auto" }}>

                        {/* Header stats */}
                        <p className="text-center font-extrabold tracking-widest uppercase text-sm mb-2"
                           style={{ color: "#FDB369" }}>
                            ⚠️ FUITES DÉTECTÉES
                        </p>
                        <p className="text-center text-white text-xs mb-8 opacity-70">
                            {email}
                        </p>

                        <div className="flex gap-3 mb-8">
                            <div className="stat-box">
                                <div className="text-3xl font-extrabold" style={{ color: "#FDB369" }}>
                                    {result.breaches.length}
                                </div>
                                <div className="text-xs font-bold tracking-widest uppercase text-white opacity-70 mt-1">
                                    Sites compromis
                                </div>
                            </div>
                            <div className="stat-box">
                                <div className="text-3xl font-extrabold" style={{ color: "#FDB369" }}>
                                    {result.breaches.filter(b => b.DataClasses?.includes("Passwords")).length}
                                </div>
                                <div className="text-xs font-bold tracking-widest uppercase text-white opacity-70 mt-1">
                                    Avec mots de passe
                                </div>
                            </div>
                            <div className="stat-box">
                                <div className="text-3xl font-extrabold" style={{ color: "#FDB369" }}>
                                    {Math.max(...result.breaches.map(b => new Date(b.BreachDate).getFullYear()))}
                                </div>
                                <div className="text-xs font-bold tracking-widest uppercase text-white opacity-70 mt-1">
                                    Fuite la + récente
                                </div>
                            </div>
                        </div>

                        {/* Breach list */}
                        <div className="text-xs font-bold tracking-widest uppercase mb-3 opacity-50">
                            DÉTAIL DES FUITES (cliquez pour voir)
                        </div>

                        {result.breaches
                            .sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate))
                            .map((breach, i) => {
                                const sev = getSeverity(breach);
                                return (
                                    <div
                                        key={breach.Name}
                                        className="breach-card"
                                        style={{ borderLeftColor: SEVERITY_COLORS[sev] }}
                                        onClick={() => setExpanded(expanded === i ? null : i)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-white">{breach.Title}</span>
                                            <span className="text-xs opacity-50 text-white">
                                                {new Date(breach.BreachDate).toLocaleDateString("fr-FR", { year: "numeric", month: "short" })}
                                            </span>
                                        </div>

                                        {expanded === i && (
                                            <div className="breach-details mt-3">
                                                <p className="text-xs opacity-70 mb-3 leading-relaxed text-white"
                                                   dangerouslySetInnerHTML={{ __html: breach.Description?.slice(0, 200) + "..." }} />
                                                <div className="flex flex-wrap gap-1">
                                                    {breach.DataClasses?.map(dc => (
                                                        <span key={dc} className="breach-tag">{dc}</span>
                                                    ))}
                                                </div>
                                                <div className="mt-2 text-xs opacity-50 text-white">
                                                    {breach.PwnCount?.toLocaleString()} comptes exposés
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                        {/* CTA */}
                        <div className="text-center mt-8">
                            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mb-4 text-white">
                                Protège tes comptes maintenant
                            </p>
                            <a href="/quiz" className="inline-block"
                               style={{
                                   background: "#FDB369", color: "#0C0A3E",
                                   padding: "14px 36px", fontFamily: "'Syne', sans-serif",
                                   fontSize: "0.75rem", fontWeight: 800,
                                   letterSpacing: "0.12em", textTransform: "uppercase",
                                   textDecoration: "none"
                               }}>
                                APPRENDRE À SE PROTÉGER →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: 60, background: "#FFF6F2" }} />
        </div>
    );
}