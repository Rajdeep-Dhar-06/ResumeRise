import { RouterProvider } from "react-router";
import { router } from "./app.routes";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a", // slate-900
              color: "#cbd5e1", // slate-300
              border: "1px solid #1e293b", // slate-800
              fontSize: "14px",
              padding: "12px 16px",
              borderRadius: "12px",
            },
            success: {
              iconTheme: {
                primary: "#6366f1", // indigo-500
                secondary: "#0f172a",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444", // red-500
                secondary: "#0f172a",
              },
            },
          }}
        />
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;
