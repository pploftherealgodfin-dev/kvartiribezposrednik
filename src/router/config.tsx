import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/home/page';
import ComingSoon from '@/pages/ComingSoon';
import Search from '@/pages/search/page';
import Login from '@/pages/login/page';
import ProfileRedirect from '@/pages/profile/page';
import ListingDetailPage from '@/pages/listing/page';
import OwnerPanelPage from '@/pages/panel/owner/page';
import TenantPanelPage from '@/pages/panel/tenant/page';
import AdminPanelPage from '@/pages/admin/page';
import RequireRole from '@/components/feature/RequireRole';
import PrivacyPolicy from '@/pages/legal/privacy/page';
import CookiePolicy from '@/pages/legal/cookies/page';
import Terms from '@/pages/legal/terms/page';
import LegalNotice from '@/pages/legal/notice/page';
import Accessibility from '@/pages/legal/accessibility/page';
import ContentPolicy from '@/pages/legal/content-policy/page';
import Contact from '@/pages/contact/page';
import ReportContent from '@/pages/report/page';
import GuidesPage from '@/pages/guides/page';
import GuideArticlePage from '@/pages/guides/article/page';
import CitiesHubPage from '@/pages/cities/page';
import CityLandingPage from '@/pages/cities/city/page';

const routes: RouteObject[] = [
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
    element: <ComingSoon title="Как работи" />,
  },
  {
    path: '/kak-da-razpoznaem-posrednik',
    element: <ComingSoon title="Как да разпознаем посредник" />,
  },
  {
    path: '/kachi-obiava',
    element: (
      <RequireRole allow={['owner', 'admin']}>
        <Navigate to="/panel/naemodatel" replace />
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
      <RequireRole allow={['admin']}>
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
    element: <ComingSoon title="Квартири в квартал" />,
  },
  {
    path: '/stai-bez-posrednik/:grad',
    element: <ComingSoon title="Стаи под наем без посредник" />,
  },
  {
    path: '/kvartiri-bez-posrednik/:grad/pri-universitet/:universitet',
    element: <ComingSoon title="Квартири до университет" />,
  },
  {
    path: '/za-nas',
    element: <ComingSoon title="За нас" />,
  },
  {
    path: '/faq',
    element: <ComingSoon title="Често задавани въпроси" />,
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