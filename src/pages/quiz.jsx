import { useState, useEffect } from "react";
import '../index.css';


const TOTAL = 10;

const FALLBACK_QUESTIONS = [
    {
        question: "D'après vous quel est le nombre de caractère minimum pour un mot de passe ?",
        options: ["6 caractères", "8 caractères", "12 caractères"],
        answer: 2,
        fact: "Les experts recommandent au moins 12 caractères. Un mot de passe long est exponentiellement plus difficile à craquer par brute-force.",
    },
    {
        question: "Lequel de ces mots de passe est le plus sécurisé ?",
        options: ["Password123!", "J8#kL!qZ2@xP", "MonChien2024"],
        answer: 1,
        fact: "Un mot de passe aléatoire mêlant majuscules, minuscules, chiffres et symboles est bien plus robuste qu'un mot du dictionnaire modifié.",
    },
    {
        question: "Qu'est-ce qu'un gestionnaire de mots de passe ?",
        options: [
            "Un carnet papier pour noter ses mots de passe",
            "Un logiciel qui génère et stocke des mots de passe chiffrés",
            "Un antivirus",
        ],
        answer: 1,
        fact: "Des outils comme Bitwarden ou 1Password chiffrent vos mots de passe localement. Vous n'avez qu'à retenir un seul mot de passe maître.",
    },
    {
        question: "Que signifie '2FA' (double authentification) ?",
        options: [
            "Deux mots de passe différents",
            "Un second facteur de vérification en plus du mot de passe",
            "Un chiffrement double",
        ],
        answer: 1,
        fact: "Le 2FA ajoute une couche de sécurité : même si votre mot de passe est volé, l'attaquant ne peut pas accéder à votre compte sans le second facteur.",
    },
    {
        question: "Combien de temps faut-il pour craquer 'abc123' ?",
        options: ["Quelques secondes", "1 heure", "1 jour"],
        answer: 0,
        fact: "'abc123' est l'un des mots de passe les plus utilisés au monde. Il figure dans toutes les listes de mots de passe courants et peut être cracké instantanément.",
    },
    {
        question: "Qu'est-ce qu'un 'phishing' (hameçonnage) ?",
        options: [
            "Un virus informatique",
            "Une technique pour voler vos identifiants via de faux sites/emails",
            "Un type de pare-feu",
        ],
        answer: 1,
        fact: "Le phishing imite des sites légitimes pour vous faire entrer vos identifiants. Vérifiez toujours l'URL et l'expéditeur d'un email suspect.",
    },
    {
        question: "Est-il sécurisé de réutiliser le même mot de passe sur plusieurs sites ?",
        options: ["Oui, c'est pratique", "Non, si un site est piraté, tous vos comptes sont en danger", "Seulement sur les sites de confiance"],
        answer: 1,
        fact: "Le 'credential stuffing' consiste à utiliser des identifiants volés sur un site pour accéder à d'autres. Utilisez un mot de passe unique par service.",
    },
    {
        question: "Quelle est la meilleure façon de stocker ses mots de passe ?",
        options: [
            "Dans un fichier texte sur le bureau",
            "Dans un gestionnaire de mots de passe chiffré",
            "Dans un email à soi-même",
        ],
        answer: 1,
        fact: "Un gestionnaire de mots de passe chiffré (Bitwarden, KeePass) est la seule méthode vraiment sécurisée pour stocker de nombreux mots de passe forts.",
    },
    {
        question: "Qu'est-ce qu'une 'passphrase' ?",
        options: [
            "Un mot de passe à usage unique",
            "Une suite de mots aléatoires formant un mot de passe long et mémorisable",
            "Un code PIN",
        ],
        answer: 1,
        fact: "Ex: 'Cheval-Correctif-Batterie-Agrafe'. Facile à retenir, très difficile à craquer grâce à sa longueur. Concept popularisé par XKCD.",
    },
    {
        question: "Que faire si vous apprenez que votre mot de passe a été divulgué ?",
        options: [
            "Ne rien faire si le site n'est pas important",
            "Changer immédiatement le mot de passe sur tous les sites où vous l'utilisez",
            "Attendre que le site vous contacte",
        ],
        answer: 1,
        fact: "Agissez immédiatement ! Changez le mot de passe compromis et tous ses doublons. Activez le 2FA si disponible et vérifiez l'activité de votre compte.",
    },
];

async function generateQuestions() {
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: `Génère exactement 10 questions de quiz sur la cybersécurité des mots de passe (en français).
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires, exactement dans ce format:
[{"question":"...","options":["...","...","..."],"answer":0,"fact":"..."}]
- answer est l'index (0,1,2) de la bonne réponse
- fact est une explication courte (2 phrases max) après la réponse
- Les questions doivent être variées et éducatives`,
                    },
                ],
            }),
        });
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        const cleaned = text.replace(/```json|```/g, "").trim();
        const questions = JSON.parse(cleaned);
        if (Array.isArray(questions) && questions.length === 10) return questions;
        return FALLBACK_QUESTIONS;
    } catch {
        return FALLBACK_QUESTIONS;
    }
}

export default function Quiz() {
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [validated, setValidated] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generateQuestions().then((q) => {
            setQuestions(q);
            setLoading(false);
        });
    }, []);

    const handleValidate = () => {
        if (selected === null) return;
        setValidated(true);
        if (selected === questions[current].answer) {
            setScore((s) => s + 1);
        }
    };

    const handleNext = () => {
        if (current + 1 >= TOTAL) {
            setFinished(true);
        } else {
            setCurrent((c) => c + 1);
            setSelected(null);
            setValidated(false);
        }
    };

    const handleRestart = () => {
        setLoading(true);
        setCurrent(0);
        setSelected(null);
        setValidated(false);
        setScore(0);
        setFinished(false);
        generateQuestions().then((q) => {
            setQuestions(q);
            setLoading(false);
        });
    };

    const q = questions[current];

    return (
        <div className="min-h-screen font-['Syne',sans-serif]" style={{ background: "#FFF6F2" }}>

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

            {/* Loading */}
            {loading && (
                <div className="text-center py-24">
                    <div className="flex justify-center gap-2 mb-4">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="loading-dot w-3 h-3 rounded-full"
                                style={{ background: "#e07b3a", animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                    <p className="text-sm font-bold tracking-widest uppercase" style={{ color: "#1a1a2e" }}>
                        Génération du quiz...
                    </p>
                </div>
            )}

            {/* Finished */}
            {!loading && finished && (
                <div className="text-center px-8 py-16">
                    <h2 className="text-lg font-extrabold tracking-widest uppercase mb-8" style={{ color: "#1a1a2e" }}>
                        QUIZ TERMINÉ !
                    </h2>
                    <div className="score-circle">
                        <span className="text-white font-extrabold text-3xl">{score}</span>
                        <span className="text-white text-xs font-600">/ {TOTAL}</span>
                    </div>
                    <p className="text-sm font-semibold mb-8" style={{ color: "#1a1a2e" }}>
                        {score >= 8 ? "🏆 Expert en sécurité !" : score >= 5 ? "💪 Bon niveau, continue !" : "📚 Tu peux progresser !"}
                    </p>
                    <button onClick={handleRestart} className="validate-btn">
                        Recommencer
                    </button>
                </div>
            )}

            {/* Quiz */}
            {!loading && !finished && q && (
                <>
                    {/* Orange diagonal section */}
                    <div className="diagonal-section mx-0">
                        <div style={{ maxWidth: 440, margin: "0 auto" }}>
                            <p className="text-center font-extrabold tracking-widest uppercase text-white text-sm mb-6">
                                APRENNONS ENSEMBLE !
                            </p>

                            {/* Progress */}
                            <div className="progress-bar-wrap">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${((current) / TOTAL) * 100}%` }}
                                />
                            </div>

                            <p className="text-center text-white text-xs font-bold tracking-widest mb-2">
                                {current + 1} / {TOTAL}
                            </p>
                            <p
                                className="text-center font-bold text-sm uppercase tracking-wide text-white mb-6"
                                style={{ lineHeight: 1.5 }}
                            >
                                {q.question}
                            </p>

                            {/* Options */}
                            {q.options.map((opt, i) => {
                                let cls = "option-btn";
                                if (validated) {
                                    if (i === q.answer) cls += " option-correct";
                                    else if (i === selected) cls += " option-wrong";
                                } else if (i === selected) {
                                    cls += " option-selected";
                                }
                                return (
                                    <button
                                        key={i}
                                        className={cls}
                                        disabled={validated}
                                        onClick={() => setSelected(i)}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}

                            {/* Verdict + fact */}
                            {validated && (
                                <div style={{ animation: "slideUp 0.3s ease" }}>
                                    <div className="verdict-row">
                                        <button
                                            className={`verdict-btn ${selected === q.answer ? "verdict-exact" : ""}`}
                                            style={{ opacity: selected === q.answer ? 1 : 0.3 }}
                                        >
                                            EXACTEMENT !!
                                        </button>
                                        <button
                                            className={`verdict-btn ${selected !== q.answer ? "verdict-faux" : ""}`}
                                            style={{ opacity: selected !== q.answer ? 1 : 0.3 }}
                                        >
                                            FAUX !!
                                        </button>
                                    </div>
                                    <div className="fact-box">
                                        <div className="fact-title">LE SAVIEZ VOUS ?</div>
                                        {q.fact}
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex justify-center mt-6 gap-4">
                                {!validated ? (
                                    <button
                                        className="validate-btn"
                                        onClick={handleValidate}
                                        disabled={selected === null}
                                    >
                                        VALIDER
                                    </button>
                                ) : (
                                    <button className="validate-btn" onClick={handleNext}>
                                        {current + 1 >= TOTAL ? "VOIR MON SCORE" : "SUIVANT →"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ height: 60, background: "#f5f0ea" }} />
                </>
            )}
        </div>
    );
}