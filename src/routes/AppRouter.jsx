import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/home";
import PasswordChecker from "../pages/passwordChecker";
import Quiz from "../pages/quiz";
import Email from "../pages/email";
import File from "../pages/file";
import Link from "../pages/link";
import Resources from "../pages/resources";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/password-checker" element={<PasswordChecker />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/email" element={<Email />} />
                <Route path="/file" element={<File />} />
                <Route path="/link" element={<Link />} />
                <Route path="/resources" element={<Resources />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;