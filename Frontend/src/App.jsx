import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./Pages/LandingPage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import SignUpPage from "./Pages/SignUpPage.jsx";
import RegisterPage from "./Pages/RegisterPage.jsx";
import VerifyEmailPage from "./Pages/VerifyEmailPage.jsx";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./Pages/ResetPasswordPage.jsx";
import CompleteProfilePage from "./Pages/CompleteProfilePage.jsx";
import AddDetailsManually from "./Pages/AddDetailsManually.jsx";
import UploadBiodataPage from "./Pages/UploadBiodataPage.jsx";
import BrowseMatchScreen from "./Pages/BrowseMatchScreen.jsx";
import DetailsPage_BrowsematchScreen from "./Pages/DetailsPage_BrowsematchScreen.jsx";
import SentInterestsDashboard from "./Pages/SentInterestsDashboard.jsx";
import InterestsReceivedDashboard from "./Pages/InterestsReceivedDashboard.jsx";
import Chatapp from "./Pages/Chatapp.jsx";
import MyProfile from "./Pages/MyProfile.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import HomePage from "./Pages/HomePage.jsx";
import ShortlistPage from "./Pages/ShortlistPage.jsx";
import NotificationsPage from "./Pages/NotificationsPage.jsx";
import SettingsPage from "./Pages/SettingsPage.jsx";
import AdminDashboard from "./Pages/AdminDashboard.jsx";
import NotFoundPage from "./Pages/NotFoundPage.jsx";
import ErrorBoundary from "./Components/ErrorBoundary.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignUpPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-otp" element={<RegisterPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-details"
            element={
              <ProtectedRoute>
                <AddDetailsManually />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-biodata"
            element={
              <ProtectedRoute>
                <UploadBiodataPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse-matches"
            element={
              <ProtectedRoute>
                <BrowseMatchScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match-details/:id"
            element={
              <ProtectedRoute>
                <DetailsPage_BrowsematchScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match-details"
            element={
              <ProtectedRoute>
                <DetailsPage_BrowsematchScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sent-interests"
            element={
              <ProtectedRoute>
                <SentInterestsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interests-received"
            element={
              <ProtectedRoute>
                <InterestsReceivedDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chatapp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-profile"
            element={<Navigate to="/profile" replace />}
          />
          <Route
            path="/shortlist"
            element={
              <ProtectedRoute>
                <ShortlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
