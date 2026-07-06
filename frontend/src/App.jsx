import { RouterProvider } from "react-router";
import { router } from "./app.routes";
import { AuthProvider } from "./context/AuthContext.jsx";
import { InterviewProvider } from "./context/InterviewContext.jsx";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Toaster closeButton position="top-center" richColors theme="dark" duration={1500} />
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;
