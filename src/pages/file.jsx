import { useState, useRef } from "react";
import sha1 from "crypto-js/sha1";
import sha256 from "crypto-js/sha256";
import '../index.css';

// Read file as ArrayBuffer then hash with SHA-1 (same algo as HIBP password check)
async function hashFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Convert to WordArray for crypto-js
                const arr = new Uint8Array(e.target.result);
                let wordArray = { words: [], sigBytes: arr.length };
                for (let i = 0; i < arr.length; i++) {
                    if (i % 4 === 0) wordArray.words.push(0);
                    wordArray.words[Math.floor(i / 4)] |= arr[i] << (24 - (i % 4) * 8);
                }
                const sha1Hash = sha1(wordArray).toString().toUpperCase();
                const sha256Hash = sha256(wordArray).toString().toUpperCase();
                resolve({ sha1: sha1Hash, sha256: sha256Hash });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Check SHA-1 hash against HIBP (same k-anonymity as password check)
async function checkHashAgainstHIBP(sha1Hash) {
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error("API_ERROR");

    const text = await res.text();
    const lines = text.split("\n");

    for (const line of lines) {
        const [hashSuffix, count] = line.trim().split(":");
        if (hashSuffix === suffix) {
            return { found: true, count: parseInt(count) };
        }
    }
    return { found: false, count: 0 };
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
    if (type.includes("image")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "🗜️";
    if (type.includes("text")) return "📝";
    if (type.includes("video")) return "🎬";
    if (type.includes("audio")) return "🎵";
    if (type.includes("spreadsheet") || type.includes("excel")) return "📊";
    if (type.includes("word") || type.includes("document")) return "📃";
    return "📁";
}

export default function FileChecker() {
    const [files, setFiles] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState({});
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef();

    const processFiles = async (newFiles) => {
        const arr = Array.from(newFiles);
        setFiles((prev) => {
            const existing = new Set(prev.map((f) => f.name + f.size));
            return [...prev, ...arr.filter((f) => !existing.has(f.name + f.size))];
        });

        for (const file of arr) {
            const key = file.name + file.size;
            setLoading((prev) => ({ ...prev, [key]: true }));
            try {
                const { sha1: sha1Hash, sha256: sha256Hash } = await hashFile(file);
                const hibp = await checkHashAgainstHIBP(sha1Hash);
                setResults((prev) => ({
                    ...prev,
                    [key]: { sha1: sha1Hash, sha256: sha256Hash, hibp, error: null },
                }));
            } catch (e) {
                setResults((prev) => ({
                    ...prev,
                    [key]: { error: e.message || "Erreur" },
                }));
            }
            setLoading((prev) => ({ ...prev, [key]: false }));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleRemove = (key) => {
        setFiles((prev) => prev.filter((f) => f.name + f.size !== key));
        setResults((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };

    const checkedCount = Object.values(results).filter((r) => !r?.error).length;
    const foundCount = Object.values(results).filter((r) => r?.hibp?.found).length;

    return (
        <div className="min-h-screen font-['Syne',sans-serif]" style={{ background: "#FFF6F2" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
                .nav-link {
                    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em;
                    color: #0C0A3E; text-decoration: none; text-transform: uppercase;
                    transition: color 0.2s;
                }
                .nav-link:hover { color: #FDB369; }
                .nav-link-active { color: #FDB369 !important; }
                .logo-box {
                    background: #0C0A3E; color: white; font-size: 0.7rem;
                    font-weight: 800; letter-spacing: 0.1em; padding: 6px 12px;
                    text-transform: uppercase; text-decoration: none; line-height: 1.4;
                }

                .drop-zone {
                    border: 2px dashed #FDB369;
                    background: ${dragging ? "rgba(253,179,105,0.1)" : "transparent"};
                    padding: 48px 32px;
                    text-align: center;
                    cursor: pointer;
                    transition: background 0.2s, border-color 0.2s;
                    position: relative;
                }
                .drop-zone:hover { background: rgba(253,179,105,0.07); }
                .drop-zone-active { background: rgba(253,179,105,0.15) !important; border-color: #0C0A3E !important; }

                .file-row {
                    background: #0C0A3E;
                    padding: 16px 20px;
                    margin-bottom: 10px;
                    animation: fadeIn 0.3s ease;
                }
                .file-row-safe { border-left: 4px solid #4caf50; }
                .file-row-danger { border-left: 4px solid #c0392b; }
                .file-row-loading { border-left: 4px solid #FDB369; }
                .file-row-error { border-left: 4px solid #888; }

                .hash-text {
                    font-family: monospace; font-size: 0.62rem;
                    color: rgba(255,255,255,0.4); word-break: break-all;
                    line-height: 1.6;
                }

                .remove-btn {
                    background: none; border: none; color: rgba(255,255,255,0.3);
                    cursor: pointer; font-size: 1rem; padding: 0 4px;
                    transition: color 0.2s;
                }
                .remove-btn:hover { color: #c0392b; }

                .btn-upload {
                    background: #0C0A3E; color: white; border: none;
                    padding: 12px 28px; font-family: 'Syne', sans-serif;
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em;
                    text-transform: uppercase; cursor: pointer; transition: background 0.2s;
                }
                .btn-upload:hover { background: #FDB369; color: #0C0A3E; }

                .info-box {
                    background: rgba(253,179,105,0.12);
                    border-left: 3px solid #FDB369;
                    padding: 14px 18px; font-size: 0.78rem;
                    color: #5a3a00; line-height: 1.7;
                }

                .diagonal-section {
                    background: #0C0A3E;
                    clip-path: polygon(0 5%, 100% 0%, 100% 95%, 0% 100%);
                    padding: 80px 40px 90px;
                    color: white;
                    margin-top: 40px;
                }

                .stat-pill {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: rgba(253,179,105,0.15);
                    border: 1px solid rgba(253,179,105,0.3);
                    padding: 8px 16px;
                }

                .spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(253,179,105,0.3);
                    border-top-color: #FDB369;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    display: inline-block;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
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
                    ANALYSE TES FICHIERS<br />POUR DÉTECTER DES RISQUES
                </h1>
                <p className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: "#9a7a5a" }}>
                    Le fichier ne quitte jamais ton navigateur — seul son empreinte SHA-1 est envoyée
                </p>

                {/* How it works */}
                <div className="info-box mx-auto text-left mb-8" style={{ maxWidth: 500 }}>
                    <strong>🔒 Comment ça fonctionne ?</strong><br />
                    Ton fichier est hashé localement (SHA-1). On envoie uniquement les 5 premiers caractères du hash à HaveIBeenPwned
                    pour vérifier si ce fichier figure dans des bases de données malveillantes connues.
                    Ton fichier ne quitte <strong>jamais</strong> ton appareil.
                </div>

                {/* Drop zone */}
                <div
                    className={`drop-zone mx-auto ${dragging ? "drop-zone-active" : ""}`}
                    style={{ maxWidth: 500 }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => processFiles(e.target.files)}
                    />
                    <div className="text-4xl mb-4">📂</div>
                    <p className="font-bold text-sm tracking-widest uppercase mb-2" style={{ color: "#0C0A3E" }}>
                        Glisse tes fichiers ici
                    </p>
                    <p className="text-xs mb-4" style={{ color: "#9a7a5a" }}>
                        ou clique pour sélectionner
                    </p>
                    <button className="btn-upload" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                        CHOISIR DES FICHIERS
                    </button>
                </div>
            </section>

            {/* Results */}
            {files.length > 0 && (
                <div className="diagonal-section">
                    <div style={{ maxWidth: 560, margin: "0 auto" }}>

                        {/* Stats */}
                        <div className="flex justify-center gap-4 mb-8 flex-wrap">
                            <div className="stat-pill">
                                <span className="font-extrabold" style={{ color: "#FDB369" }}>{files.length}</span>
                                <span className="text-xs font-bold tracking-widest uppercase text-white opacity-60">Fichiers</span>
                            </div>
                            <div className="stat-pill">
                                <span className="font-extrabold" style={{ color: "#4caf50" }}>{checkedCount - foundCount}</span>
                                <span className="text-xs font-bold tracking-widest uppercase text-white opacity-60">Sains</span>
                            </div>
                            {foundCount > 0 && (
                                <div className="stat-pill" style={{ borderColor: "rgba(192,57,43,0.5)" }}>
                                    <span className="font-extrabold" style={{ color: "#c0392b" }}>{foundCount}</span>
                                    <span className="text-xs font-bold tracking-widest uppercase text-white opacity-60">Suspects</span>
                                </div>
                            )}
                        </div>

                        <div className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">
                            RÉSULTATS D'ANALYSE
                        </div>

                        {files.map((file) => {
                            const key = file.name + file.size;
                            const res = results[key];
                            const isLoading = loading[key];

                            let rowClass = "file-row file-row-loading";
                            if (res && !isLoading) {
                                if (res.error) rowClass = "file-row file-row-error";
                                else if (res.hibp?.found) rowClass = "file-row file-row-danger";
                                else rowClass = "file-row file-row-safe";
                            }

                            return (
                                <div key={key} className={rowClass}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-xl flex-shrink-0">{getFileIcon(file.type)}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-white truncate">{file.name}</span>
                                                    <span className="text-xs opacity-40 text-white flex-shrink-0">
                                                        {formatSize(file.size)}
                                                    </span>
                                                </div>

                                                {isLoading && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="spinner" />
                                                        <span className="text-xs opacity-50 text-white">Analyse en cours...</span>
                                                    </div>
                                                )}

                                                {res && !isLoading && !res.error && (
                                                    <div className="mt-2">
                                                        {/* Status badge */}
                                                        <div className="mb-2">
                                                            {res.hibp.found ? (
                                                                <span className="text-xs font-bold" style={{ color: "#c0392b" }}>
                                                                    ⚠️ Hash trouvé dans {res.hibp.count.toLocaleString()} entrées suspectes
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-bold" style={{ color: "#4caf50" }}>
                                                                    ✅ Aucune correspondance trouvée
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Hashes */}
                                                        <div className="hash-text">
                                                            SHA-1: {res.sha1}<br />
                                                            SHA-256: {res.sha256}
                                                        </div>
                                                    </div>
                                                )}

                                                {res?.error && !isLoading && (
                                                    <span className="text-xs" style={{ color: "#e07b3a" }}>
                                                        ❌ Erreur lors de l'analyse
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button className="remove-btn flex-shrink-0" onClick={() => handleRemove(key)}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add more */}
                        <div className="text-center mt-6">
                            <button
                                className="btn-upload"
                                onClick={() => inputRef.current?.click()}
                                style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                            >
                                + AJOUTER D'AUTRES FICHIERS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: 60, background: "#FFF6F2" }} />
        </div>
    );
}