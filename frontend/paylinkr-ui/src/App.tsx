import { Routes, Route } from "react-router-dom";
import CreateLink from "./pages/CreateLink";
import PayPage from "./pages/PayPage";
import StatusPage from "./pages/StatusPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateLink />} />
      <Route path="/pay/:id" element={<PayPage />} />
      <Route path="/status/:id" element={<StatusPage />} />
    </Routes>
  );
}
