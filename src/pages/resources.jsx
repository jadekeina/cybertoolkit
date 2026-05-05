import { useState, useEffect } from "react";
import '../index.css';

// ─── Static curated resources ───────────────────────────────────────────────
const CATEGORIES = [
    {
        id: "platforms",
        label: "Plateformes de pratique",
        icon: "🎯",
        resources: [
            { name: "TryHackMe", url: "https://tryhackme.com", desc: "Apprentissage guidé par des rooms interactives. Parfait pour débuter.", level: "Débutant → Avancé", free: true, tag: "Hands-on" },
            { name: "Hack The Box", url: "https://hackthebox.com", desc: "Machines et challenges CTF réalistes. Communauté très active.", level: "Intermédiaire → Expert", free: true, tag: "CTF" },
            { name: "Root-Me", url: "https://root-me.org", desc: "Plateforme française avec +400 challenges variés. Excellente pour les CTF.", level: "Tous niveaux", free: true, tag: "CTF" },
            { name: "PicoCTF", url: "https://picoctf.org", desc: "CTF permanent pour étudiants. Très bon pour commencer.", level: "Débutant", free: true, tag: "CTF" },
            { name: "PortSwigger Web Academy", url: "https://portswigger.net/web-security", desc: "La référence pour apprendre les vulnérabilités web (XSS, SQLi, SSRF...)", level: "Tous niveaux", free: true, tag: "Web" },
            { name: "Cybrary", url: "https://cybrary.it", desc: "Cours vidéo en cybersécurité, certifications, labs.", level: "Tous niveaux", free: false, tag: "Cours" },
        ],
    },
    {
        id: "roadmaps",
        label: "Roadmaps & Guides",
        icon: "🗺️",
        resources: [
            { name: "Roadmap.sh — Cybersecurity", url: "https://roadmap.sh/cyber-security", desc: "Roadmap visuelle et interactive pour devenir expert en sécu.", level: "Tous niveaux", free: true, tag: "Roadmap" },
            { name: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten", desc: "Les 10 vulnérabilités web les plus critiques. Lecture obligatoire.", level: "Intermédiaire", free: true, tag: "Référence" },
            { name: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework", desc: "Framework de référence pour la gestion des risques en entreprise.", level: "Avancé", free: true, tag: "Framework" },
            { name: "Paul Jerimy — Sec Cert Roadmap", url: "https://pauljerimy.com/security-certification-roadmap", desc: "Roadmap complète de toutes les certifications sécu classées par domaine.", level: "Tous niveaux", free: true, tag: "Certifications" },
        ],
    },
    {
        id: "tools",
        label: "Outils essentiels",
        icon: "🛠️",
        resources: [
            { name: "Kali Linux", url: "https://kali.org", desc: "Distribution Linux dédiée au pentest. Outil de référence.", level: "Intermédiaire", free: true, tag: "OS" },
            { name: "Wireshark", url: "https://wireshark.org", desc: "Analyseur de paquets réseau. Indispensable pour comprendre les protocoles.", level: "Intermédiaire", free: true, tag: "Réseau" },
            { name: "Burp Suite", url: "https://portswigger.net/burp", desc: "Proxy d'intercept pour tester les applications web.", level: "Intermédiaire", free: true, tag: "Web" },
            { name: "Metasploit", url: "https://metasploit.com", desc: "Framework de pentest et exploitation. Standard de l'industrie.", level: "Avancé", free: true, tag: "Exploit" },
            { name: "Nmap", url: "https://nmap.org", desc: "Scanner réseau pour découvrir hôtes et services.", level: "Débutant", free: true, tag: "Réseau" },
        ],
    },
    {
        id: "certifications",
        label: "Certifications",
        icon: "🏆",
        resources: [
            { name: "CompTIA Security+", url: "https://comptia.org/certifications/security", desc: "Certification d'entrée de gamme reconnue. Bon point de départ.", level: "Débutant", free: false, tag: "Cert" },
            { name: "CEH — Certified Ethical Hacker", url: "https://eccouncil.org/programs/certified-ethical-hacker-ceh", desc: "Certification orientée pentest et ethical hacking.", level: "Intermédiaire", free: false, tag: "Cert" },
            { name: "OSCP", url: "https://offsec.com/courses/pen-200", desc: "La référence absolue du pentest. Examen pratique de 24h.", level: "Avancé", free: false, tag: "Cert" },
            { name: "Google Cybersecurity Certificate", url: "https://grow.google/certificates/cybersecurity", desc: "Certification accessible sur Coursera, bonne intro au domaine.", level: "Débutant", free: false, tag: "Cert" },
        ],
    },
];

// ─── RSS feeds via rss2json (CORS-safe, free) ────────────────────────────────
const RSS_FEEDS = [
    { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", color: "#FDB369" },
    { name: "SANS Internet Stormcast", url: "https://isc.sans.edu/rssfeed_full.xml", color: "#4caf50" },
    { name: "Schneier on Security", url: "https://www.schneier.com/feed/atom", color: "#3498db" },
    { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", color: "#c0392b" },
];

async function fetchFeed(feed) {
    const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=3`;
    const res = await fetch(api);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    if (data.status !== "ok") throw new Error("feed error");
    return data.items.map((item) => ({
        title: item.title,
        link: item.link,
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "",
        source: feed.name,
        color: feed.color,
    }));
}

const LEVEL_COLORS = {
    "Débutant": "#4caf50",
    "Débutant → Avancé": "#4caf50",
    "Intermédiaire": "#FDB369",
    "Intermédiaire → Expert": "#e07b3a",
    "Avancé": "#c0392b",
    "Tous niveaux": "#3498db",
    "Expert": "#8e44ad",
};

const TAG_BG = {
    "Hands-on": "#0C0A3E",
    "CTF": "#8e44ad",
    "Web": "#3498db",
    "Cours": "#e07b3a",
    "Roadmap": "#27ae60",
    "Référence": "#c0392b",
    "Framework": "#2980b9",
    "Certifications": "#f39c12",
    "OS": "#1a1a2e",
    "Réseau": "#16a085",
    "Exploit": "#c0392b",
    "Cert": "#8e44ad",
};

export default function CyberResources() {
    const [activeCategory, setActiveCategory] = useState("platforms");
    const [newsItems, setNewsItems] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [activeSource, setActiveSource] = useState(RSS_FEEDS[0].name);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setNewsLoading(true);
        Promise.allSettled(RSS_FEEDS.map(fetchFeed)).then((results) => {
            const all = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
            setNewsItems(all);
            setNewsLoading(false);
        });
    }, []);

    const currentCat = CATEGORIES.find((c) => c.id === activeCategory);
    const filteredResources = currentCat?.resources.filter((r) =>
        search === "" ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase()) ||
        r.tag.toLowerCase().includes(search.toLowerCase())
    );
    const filteredNews = newsItems.filter((n) => activeSource === "all" || n.source === activeSource);

    return (
        <div className="min-h-screen font-['Syne',sans-serif]" style={{ background: "#FFF6F2" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
                .nav-link { font-size:.75rem; font-weight:600; letter-spacing:.08em; color:#0C0A3E; text-decoration:none; text-transform:uppercase; transition:color .2s; }
                .nav-link:hover, .nav-link-active { color:#FDB369 !important; }
                .logo-box { background:#0C0A3E; color:white; font-size:.7rem; font-weight:800; letter-spacing:.1em; padding:6px 12px; text-transform:uppercase; text-decoration:none; line-height:1.4; }

                .cat-btn { background:none; border:2px solid transparent; padding:8px 18px; font-family:'Syne',sans-serif; font-size:.72rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; color:#0C0A3E; transition:all .2s; }
                .cat-btn:hover { border-color:#FDB369; }
                .cat-btn-active { background:#0C0A3E; color:white; border-color:#0C0A3E; }

                .resource-card { background:#0C0A3E; padding:20px; transition:transform .2s, box-shadow .2s; display:flex; flex-direction:column; gap:10px; animation:fadeIn .3s ease; }
                .resource-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(12,10,62,.2); }

                .tag-pill { display:inline-block; font-size:.6rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:2px 10px; color:white; }
                .level-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }

                .search-field { background:#FDB369; border:none; outline:none; padding:12px 16px; font-family:'Syne',sans-serif; font-size:.85rem; color:#0C0A3E; width:100%; max-width:340px; }
                .search-field::placeholder { color:#8a5a2a; }

                .news-card { padding:14px 18px; margin-bottom:8px; border-left:3px solid; transition:background .2s; text-decoration:none; display:block; animation:fadeIn .3s ease; }
                .news-card:hover { background:rgba(253,179,105,.08); }

                .source-btn { background:none; border:none; padding:6px 14px; font-family:'Syne',sans-serif; font-size:.65rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:all .2s; color:rgba(255,255,255,.4); border-bottom:2px solid transparent; }
                .source-btn:hover { color:white; }
                .source-btn-active { color:white; border-bottom-color:#FDB369; }

                .diagonal-top { background:#0C0A3E; clip-path:polygon(0 6%,100% 0%,100% 100%,0% 100%); padding:80px 40px 60px; }
                .diagonal-bottom { background:#0C0A3E; clip-path:polygon(0 0,100% 0,100% 94%,0 100%); padding:60px 40px 80px; margin-top:40px; }

                .loading-dot { animation:blink 1.2s infinite; }
                @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

                .free-badge { font-size:.58rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; padding:2px 7px; }
                .section-label { font-size:.65rem; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
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
                    RESSOURCES<br />CYBERSÉCURITÉ
                </h1>
                <p className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: "#9a7a5a" }}>
                    Plateformes · Roadmaps · Outils · Actus en temps réel
                </p>

                {/* Search */}
                <div className="flex justify-center mb-8">
                    <input
                        type="text"
                        placeholder="Rechercher une ressource..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-field"
                    />
                </div>

                {/* Category tabs */}
                <div className="flex justify-center flex-wrap gap-2 mb-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            className={`cat-btn ${activeCategory === cat.id ? "cat-btn-active" : ""}`}
                            onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Resources grid */}
            <section className="px-8 pb-8" style={{ maxWidth: 900, margin: "0 auto" }}>
                <div className="section-label mb-4" style={{ color: "#0C0A3E" }}>
                    {currentCat?.icon} {currentCat?.label}
                    <span className="ml-3 font-normal opacity-40">({filteredResources?.length || 0} ressources)</span>
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                    {filteredResources?.map((r) => (
                        <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="resource-card" style={{ textDecoration: "none" }}>
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-extrabold text-sm text-white leading-tight">{r.name}</span>
                                <div className="flex gap-1 flex-shrink-0">
                                    {r.free && (
                                        <span className="free-badge" style={{ background: "rgba(76,175,80,.2)", color: "#4caf50" }}>FREE</span>
                                    )}
                                    <span className="tag-pill" style={{ background: TAG_BG[r.tag] || "#333" }}>{r.tag}</span>
                                </div>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,.55)" }}>{r.desc}</p>
                            <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                                <span className="level-dot" style={{ background: LEVEL_COLORS[r.level] || "#888" }} />
                                <span className="text-xs font-semibold" style={{ color: LEVEL_COLORS[r.level] || "#888" }}>{r.level}</span>
                            </div>
                        </a>
                    ))}
                    {filteredResources?.length === 0 && (
                        <div className="col-span-full text-center py-12 opacity-40 text-sm" style={{ color: "#0C0A3E" }}>
                            Aucune ressource trouvée pour "{search}"
                        </div>
                    )}
                </div>
            </section>

            {/* News RSS section */}
            <div className="diagonal-bottom">
                <div style={{ maxWidth: 700, margin: "0 auto" }}>
                    <p className="text-center font-extrabold tracking-widest uppercase text-sm mb-2" style={{ color: "#FDB369" }}>
                        📡 ACTUS SÉCU EN DIRECT
                    </p>
                    <p className="text-center text-xs mb-6 opacity-50 text-white">
                        Flux RSS live — mis à jour à chaque visite
                    </p>

                    {/* Source filter */}
                    <div className="flex justify-center flex-wrap gap-0 mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                        <button
                            className={`source-btn ${activeSource === "all" ? "source-btn-active" : ""}`}
                            onClick={() => setActiveSource("all")}
                        >
                            Tous
                        </button>
                        {RSS_FEEDS.map((f) => (
                            <button
                                key={f.name}
                                className={`source-btn ${activeSource === f.name ? "source-btn-active" : ""}`}
                                onClick={() => setActiveSource(f.name)}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>

                    {/* Loading */}
                    {newsLoading && (
                        <div className="flex justify-center gap-2 py-12">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="loading-dot w-2 h-2 rounded-full"
                                     style={{ background: "#FDB369", animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    )}

                    {/* News items */}
                    {!newsLoading && filteredNews.length === 0 && (
                        <div className="text-center py-8 opacity-40 text-sm text-white">
                            Impossible de charger le flux. Vérifie ta connexion.
                        </div>
                    )}

                    {!newsLoading && filteredNews.map((item, i) => (
                        <a
                            key={i}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-card"
                            style={{ borderLeftColor: item.color }}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold mb-1" style={{ color: item.color }}>
                                        {item.source}
                                    </div>
                                    <div className="font-bold text-sm text-white leading-snug">{item.title}</div>
                                </div>
                                <div className="text-xs opacity-40 flex-shrink-0 text-white mt-1">{item.date}</div>
                            </div>
                        </a>
                    ))}

                    {!newsLoading && filteredNews.length > 0 && (
                        <div className="text-center mt-6 text-xs opacity-30 text-white">
                            {filteredNews.length} articles chargés
                        </div>
                    )}
                </div>
            </div>

            <div style={{ height: 60, background: "#FFF6F2" }} />
        </div>
    );
}