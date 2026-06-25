import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppRouter from "./routes/AppRouter";

/**
 * App root: wires up routing (BrowserRouter) and the mock auth session
 * (AuthProvider) around the route tree.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
