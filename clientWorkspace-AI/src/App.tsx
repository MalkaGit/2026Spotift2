import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/Layout/ProtectedRoute';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoginPage } from '@/routes/LoginPage';
import { LibraryPage } from '@/routes/LibraryPage';
import { OnboardingFavoritesPage } from '@/routes/OnboardingFavoritesPage';
import { SearchPage } from '@/routes/SearchPage';
import { ArtistOverviewPage } from '@/routes/ArtistOverviewPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter so login can use useNavigate(). */}
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/library" replace />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="onboarding/favorites" element={<OnboardingFavoritesPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="artist/:artistId" element={<ArtistOverviewPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
