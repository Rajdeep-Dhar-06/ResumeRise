import { createBrowserRouter } from "react-router";
import Protected from "./components/auth/Protected.jsx";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/interview/Home.jsx";
import Interview from "./pages/interview/Interview.jsx";
import Dashboard from "./pages/interview/Dashboard.jsx";

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
      <Protected>
        <Home />
      </Protected>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <Interview />
      </Protected>
    ),
  }
]);
