import { createBrowserRouter } from "react-router";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/home/Home.jsx";
import InterviewReport from "./pages/interview/InterviewReport.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/interview/:reportId",
    element: (
      <ProtectedRoute>
        <InterviewReport />
      </ProtectedRoute>
    ),
  }
]);

