import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./routes/AppLayout";
import { HomePage } from "./routes/HomePage";
import { RecordsPage } from "./routes/RecordsPage";
import { SettingsPage } from "./routes/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "records", element: <RecordsPage /> },
    ],
  },
]);
