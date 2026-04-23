import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./routes/AppLayout";
import { AboutPage } from "./routes/AboutPage";
import { HomePage } from "./routes/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
    ],
  },
]);
