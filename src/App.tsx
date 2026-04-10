import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Homepage from "./ui/home/homepage.js";
import AppShell from "./ui/app-shell.js";

// Thin app entry on purpose: read src/ui/* for workflow-specific UI work.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Homepage />} path="/" />
        <Route element={<AppShell />} path="/app" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </HashRouter>
  );
}
