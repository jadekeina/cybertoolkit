import { useState } from "react";
import { checkPassword } from "../services/servicePassword";

function PasswordChecker() {
    const [password, setPassword] = useState("");
    const [result, setResult] = useState(null);

    const handleCheck = async () => {
        const res = await checkPassword(password);
        setResult(res);
    };

    return (
        <div>
            <h1>Password Checker</h1>

            <input
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleCheck}>Vérifier</button>

            {result && (
                <div>
                    {result.compromised ? (
                        <p>
                            Mot de passe compromis {result.count} fois
                        </p>
                    ) : (
                        <p>Mot de passe sécurisé</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default PasswordChecker;