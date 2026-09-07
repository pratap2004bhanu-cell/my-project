import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout';
import { Logo } from './components/common';

// Lazy-loaded pages (code-split into separate chunks)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const CreateActivityPage = lazy(() => import('./pages/CreateActivityPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NearbyPage = lazy(() => import('./pages/NearbyPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MatchingPage = lazy(() => import('./pages/MatchingPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const KikyPage = lazy(() => import('./pages/KikyPage'));
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const GamificationPage = lazy(() => import('./pages/GamificationPage'));
const ActivityDetailsPage = lazy(() => import('./pages/ActivityDetailsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const CommunityChatPage = lazy(() => import('./pages/CommunityChatPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const PlacesPage = lazy(() => import('./pages/PlacesPage'));
const TrendingPage = lazy(() => import('./pages/TrendingPage'));
const DraftsPage = lazy(() => import('./pages/DraftsPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const IdeasPage = lazy(() => import('./pages/IdeasPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Public Route wrapper - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <Logo size={64} className="text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
        <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          {/* Protected Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>
          
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ExplorePage />} />
          </Route>
          
          <Route
            path="/create-activity"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CreateActivityPage />} />
          </Route>
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfilePage />} />
          </Route>
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="nearby" element={<NearbyPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:userId" element={<ChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="matching" element={<MatchingPage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="kiky" element={<KikyPage />} />
            <Route path="lets-go" element={<Navigate to="/kiky" replace />} />
            <Route path="communities" element={<CommunitiesPage />} />
            <Route path="communities/:id" element={<CommunityPage />} />
            <Route path="communities/:id/chat" element={<CommunityChatPage />} />
            <Route path="safety" element={<SafetyPage />} />
            <Route path="achievements" element={<GamificationPage />} />
            <Route path="activities" element={<ExplorePage />} />
            <Route path="activities/:id" element={<ActivityDetailsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="location" element={<LocationPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="group-chat" element={<GroupChatPage />} />
            <Route path="group-chat/:activityId" element={<GroupChatPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="checkin" element={<CheckInPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="places" element={<PlacesPage />} />
            <Route path="trending" element={<TrendingPage />} />
            <Route path="drafts" element={<DraftsPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="weather" element={<WeatherPage />} />
            <Route path="ideas" element={<IdeasPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/new" element={<CreateEventPage />} />
            <Route path="events/edit/:id" element={<CreateEventPage />} />
            <Route path="events/:id" element={<EventDetailsPage />} />
            <Route path="my-events" element={<MyEventsPage />} />
          </Route>
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
      </SocketProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;