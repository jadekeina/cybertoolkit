import { useState } from "react";
import { checkPassword } from "../services/servicePassword";
import '../index.css';

export default function Home() {
    const [password, setPassword] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
        if (!password.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await checkPassword(password);
            setResult(res);
        } catch (e) {
            setResult({ error: true });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen font-['Syne',sans-serif]" style={{ background: "#FFF6F2" }}>
            {/* Google Font */}

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
                    className="text-2xl font-extrabold tracking-widest uppercase mb-8"
                    style={{ color: "#1a1a2e", lineHeight: 1.4 }}
                >
                    EST CE QUE TON MOT DE PASSE<br />EST SÉCURISÉ ?
                </h1>

                {/* Input */}
                <div className="flex mx-auto" style={{ maxWidth: 420 }}>
                    <input
                        type="password"
                        placeholder="Entrez votre mot de passe..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        className="input-field"
                    />
                    <button onClick={handleCheck} className="btn-test" disabled={loading}>
                        {loading ? <span className="pulse">...</span> : "TESTER"}
                    </button>
                </div>

                {/* Result */}
                {result && !result.error && (
                    <div
                        className={`result-box mx-auto ${result.compromised ? "result-danger" : "result-safe"}`}
                        style={{ maxWidth: 420 }}
                    >
                        {result.compromised ? (
                            <>
                                ⚠️ Mot de passe compromis{" "}
                                <strong>{result.count.toLocaleString()}</strong> fois dans des fuites de données !
                            </>
                        ) : (
                            <>✅ Mot de passe non trouvé dans les fuites connues.</>
                        )}
                    </div>
                )}
                {result?.error && (
                    <div className="result-box result-danger mx-auto" style={{ maxWidth: 420 }}>
                        ❌ Une erreur est survenue. Réessayez.
                    </div>
                )}
            </section>

            {/* Diagonal dark section */}
            <section className="diagonal-section mt-8">
                <p
                    className="text-base font-bold tracking-widest uppercase mb-8"
                    style={{ letterSpacing: "0.15em" }}
                >
                    VOUS VOULEZ COMPRENDRE COMMENT SÉCURISER<br />VOTRE MOT DE PASSE ?
                </p>
                <a href="/quiz" className="btn-learn">
                    COMMENCER LE QUIZ
                </a>
            </section>

            {/* Bottom spacer */}
            <div style={{ height: 60, background: "#f5f0ea" }} />
        </div>
    );
}