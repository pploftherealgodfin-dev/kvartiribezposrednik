import { renderToReadableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AppRoutes } from './router';
import i18n from './i18n';
import { AuthProvider } from './lib/auth/AuthProvider';
import { FavoritesProvider } from './lib/favorites/FavoritesProvider';
export async function render(path: string): Promise<string> {
  let renderError: unknown;
  const stream = await renderToReadableStream(<I18nextProvider i18n={i18n}><StaticRouter location={path}><AuthProvider><FavoritesProvider><AppRoutes /></FavoritesProvider></AuthProvider></StaticRouter></I18nextProvider>, { onError: error => { renderError = error; } });
  await stream.allReady;
  if (renderError) throw renderError;
  return new Response(stream).text();
}
