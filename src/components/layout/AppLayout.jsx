import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Fab from '../common/Fab';

const FabHiddenPages = [
  '/nearby', '/lets-go', '/checkin',
];

const AppLayout = () => {
  const location = useLocation();
  const isChatView =
    /^\/(chat|group-chat)(\/|$)/.test(location.pathname) ||
    /\/communities\/[^/]+\/chat$/.test(location.pathname);
  const hideFab = isChatView || FabHiddenPages.some(p => location.pathname.startsWith(p));

  return (
    <div className="page-container aurora">
      <Header />
      <Sidebar />
      <main className={`main-content ${isChatView ? 'no-mobile-nav' : ''}`}>
        <Outlet />
      </main>
      {!isChatView && <MobileNav />}
      {!hideFab && <Fab />}
    </div>
  );
};

export default AppLayout;