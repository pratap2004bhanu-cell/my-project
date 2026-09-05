import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Fab from '../common/Fab';

const FabHiddenPages = [
  '/nearby', '/lets-go', '/checkin', '/chat',
];

const AppLayout = () => {
  const location = useLocation();
  const hideFab = FabHiddenPages.some(p => location.pathname.startsWith(p));

  return (
    <div className="page-container aurora">
      <Header />
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <MobileNav />
      {!hideFab && <Fab />}
    </div>
  );
};

export default AppLayout;