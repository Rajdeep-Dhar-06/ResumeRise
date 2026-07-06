import { createBrowserRouter } from "react-router";
import Protected from "./components/auth/Protected.jsx";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/interview/Home.jsx";
import Interview from "./pages/interview/Interview.jsx";

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
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <Interview />
      </Protected>
    ),
  }
]);
