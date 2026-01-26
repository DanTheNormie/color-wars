import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import LobbyPage from "@/pages/LobbyPage";
import RoomPage from "@/pages/RoomPage";
import "./App.css";
import ErrorBoundary from "./components/ErrorBoundary";


const router = createBrowserRouter([
  {
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <LobbyPage />,
      },
      {
        path: "/room/:roomId",
        element: <RoomPage />,
      },
      {
        element:<div 
        className={`
          text-[#D71E22]
          text-[#1D3CE9]
          text-[#FF63D4]
          text-[#FF8D1C]
          text-[#FFFF67]
          text-[#4A565E]
          text-[#5470FF]
          text-[#1B913E]
          text-[#80582D]
          text-[#44FFF7]
          text-[#6C2B3D]
          text-[#EC7578]
        `}>

        </div>
      }
    ],
  },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
