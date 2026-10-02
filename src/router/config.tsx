import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const NotFound = lazy(() => import('@/pages/NotFound'));
const Home = lazy(() => import('@/pages/home/page'));
const InfoPage = lazy(() => import('@/pages/info/page'));
const LocationPage = lazy(() => import('@/pages/cities/location'));
const Search = lazy(() => import('@/pages/search/page'));
const Login = lazy(() => import('@/pages/login/page'));
const ProfileRedirect = lazy(() => import('@/pages/profile/page'));
const ListingDetailPage = lazy(() => import('@/pages/listing/page'));
const OwnerPanelPage = lazy(() => import('@/pages/panel/owner/page'));
const TenantPanelPage = lazy(() => import('@/pages/panel/tenant/page'));
const AdminPanelPage = lazy(() => import('@/pages/admin/page'));
import RequireRole from '@/components/feature/RequireRole';
const PrivacyPolicy = lazy(() => import('@/pages/legal/privacy/page'));
const CookiePolicy = lazy(() => import('@/pages/legal/cookies/page'));
const Terms = lazy(() => import('@/pages/legal/terms/page'));
const LegalNotice = lazy(() => import('@/pages/legal/notice/page'));
const Accessibility = lazy(() => import('@/pages/legal/accessibility/page'));
const ContentPolicy = lazy(() => import('@/pages/legal/content-policy/page'));
const Contact = lazy(() => import('@/pages/contact/page'));
const ReportContent = lazy(() => import('@/pages/report/page'));
const GuidesPage = lazy(() => import('@/pages/guides/page'));
const GuideArticlePage = lazy(() => import('@/pages/guides/article/page'));
const CitiesHubPage = lazy(() => import('@/pages/cities/page'));
const CityLandingPage = lazy(() => import('@/pages/cities/city/page'));

const FavoritesPage = lazy(() => import('@/pages/favorites/page'));
const UploadPage = lazy(() => import('@/pages/upload/page'));
const SettingsPage = lazy(() => import('@/pages/settings/page'));
const MessagesPage = lazy(() => import('@/pages/messages/page'));

const routes: RouteObject[] = [
  { path: '/lyubimi', element: <RequireRole allow={['owner','tenant','admin','moderator']}><FavoritesPage /></RequireRole> },
  { path: '/nastroyki', element: <RequireRole allow={['owner','tenant','admin','moderator']}><SettingsPage /></RequireRole> },
  { path: '/saobshteniya', element: <RequireRole allow={['owner','tenant','admin','moderator']}><MessagesPage /></RequireRole> },
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/tarsene',
    element: <Search />,
  },
  {
    path: '/saveti',
    element: <GuidesPage />,
  },
  {
    path: '/saveti/:slug',
    element: <GuideArticlePage />,
  },
  {
    path: '/kak-raboti',
    element: <InfoPage />,
  },
  {
    path: '/kak-da-razpoznaem-posrednik',
    element: <InfoPage />,
  },
  {
    path: '/kachi-obiava',
    element: (
      <RequireRole allow={['owner', 'tenant', 'admin']}>
        <UploadPage />
      </RequireRole>
    ),
  },
  {
    path: '/panel/naemodatel',
    element: (
      <RequireRole allow={['owner', 'admin']}>
        <OwnerPanelPage />
      </RequireRole>
    ),
  },
  {
    path: '/panel/naematel',
    element: (
      <RequireRole allow={['tenant']}>
        <TenantPanelPage />
      </RequireRole>
    ),
  },
  {
    path: '/admin',
    element: (
      <RequireRole allow={['admin', 'moderator']}>
        <AdminPanelPage />
      </RequireRole>
    ),
  },
  {
    path: '/moi-profil',
    element: <ProfileRedirect />,
  },
  {
    path: '/vhod',
    element: <Login />,
  },
  {
    path: '/obiava/:slug',
    element: <ListingDetailPage />,
  },
  {
    path: '/kvartiri-bez-posrednik',
    element: <CitiesHubPage />,
  },
  {
    path: '/kvartiri-bez-posrednik/:grad',
    element: <CityLandingPage />,
  },
  {
    path: '/kvartiri-bez-posrednik/:grad/:kvartal',
    element: <LocationPage />,
  },
  {
    path: '/stai-bez-posrednik/:grad',
    element: <LocationPage />,
  },
  {
    path: '/kvartiri-bez-posrednik/:grad/pri-universitet/:universitet',
    element: <LocationPage />,
  },
  {
    path: '/za-nas',
    element: <InfoPage />,
  },
  {
    path: '/faq',
    element: <InfoPage />,
  },
  {
    path: '/obshi-usloviya',
    element: <Terms />,
  },
  {
    path: '/politika-za-poveritelnost',
    element: <PrivacyPolicy />,
  },
  {
    path: '/biskvitki',
    element: <CookiePolicy />,
  },
  {
    path: '/pravna-informaciya',
    element: <LegalNotice />,
  },
  {
    path: '/dostapnost',
    element: <Accessibility />,
  },
  {
    path: '/pravila-za-sadarzhanie',
    element: <ContentPolicy />,
  },
  {
    path: '/dokladvane',
    element: <ReportContent />,
  },
  {
    path: '/kontakti',
    element: <Contact />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;