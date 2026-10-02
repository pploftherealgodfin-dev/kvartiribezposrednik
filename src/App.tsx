import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { FavoritesProvider } from "./lib/favorites/FavoritesProvider";


function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <AuthProvider>
          <FavoritesProvider>
            <AppRoutes />
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;