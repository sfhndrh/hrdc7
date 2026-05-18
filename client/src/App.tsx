import { Navigate, Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { ClientLayout } from "@/layouts/ClientLayout";
import { TrainerLayout } from "@/layouts/TrainerLayout";

import AdminClientDetailPage from "@/screens/AdminClientDetailPage";
import AdminClientsPage from "@/screens/AdminClientsPage";
import AdminDashboardPage from "@/screens/AdminDashboardPage";
import AdminPaymentsPage from "@/screens/AdminPaymentsPage";
import AdminProfilePage from "@/screens/AdminProfilePage";
import AdminTrainerDetailPage from "@/screens/AdminTrainerDetailPage";
import AdminTrainerReviewPage from "@/screens/AdminTrainerReviewPage";
import AdminTrainersPage from "@/screens/AdminTrainersPage";
import AdminNotificationsPage from "@/screens/AdminNotificationsPage";
import AdminSettingsPage from "@/screens/admin-settings/page";
import AdminTrainingProvidersPage from "@/screens/AdminTrainingProvidersPage";
import ClientDashboardPage from "@/screens/ClientDashboardPage";
import ClientProfileEditPage from "@/screens/ClientProfileEditPage";
import ClientProfilePage from "@/screens/ClientProfilePage";
import ClientSubscriptionPage from "@/screens/ClientSubscriptionPage";
import ClientTrainerDetailPage from "@/screens/ClientTrainerDetailPage";
import ClientTrainersPage from "@/screens/ClientTrainersPage";
import ClientCalendarPage from "@/screens/client-calendar/page";
import ClientMessagesPage from "@/screens/client-messages/page";
import ClientSubscriptionCheckoutPage from "@/screens/client-subscription-checkout/page";
import HomePage from "@/screens/HomePage";
import LoginPage from "@/screens/LoginPage";
import PostLoginPage from "@/screens/PostLoginPage";
import RegisterClientPage from "@/screens/RegisterClientPage";
import RegisterTrainerPage from "@/screens/RegisterTrainerPage";
import TrainerCalendarPage from "@/screens/trainer-calendar/page";
import TrainerCertificatePage from "@/screens/trainer-certificate/page";
import TrainerDashboardPage from "@/screens/TrainerDashboardPage";
import TrainerMessagesPage from "@/screens/trainer-messages/page";
import TrainerProfileEditPage from "@/screens/TrainerProfileEditPage";
import TrainerProfilePage from "@/screens/TrainerProfilePage";
import TrainerPromotionsPage from "@/screens/trainer-promotions/page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/post-login" element={<PostLoginPage />} />
      <Route path="/register/client" element={<RegisterClientPage />} />
      <Route path="/register/trainer" element={<RegisterTrainerPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="trainers" element={<AdminTrainersPage />} />
        <Route path="trainers/:id" element={<AdminTrainerDetailPage />} />
        <Route path="trainers/:id/review" element={<AdminTrainerReviewPage />} />
        <Route path="approval" element={<AdminNotificationsPage />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="clients/:id" element={<AdminClientDetailPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="training-providers" element={<AdminTrainingProvidersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      <Route path="/trainer" element={<TrainerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TrainerDashboardPage />} />
        <Route path="profile" element={<TrainerProfilePage />} />
        <Route path="profile/edit" element={<TrainerProfileEditPage />} />
        <Route path="certificate" element={<TrainerCertificatePage />} />
        <Route path="messages" element={<TrainerMessagesPage />} />
        <Route path="inquiries" element={<Navigate to="/trainer/messages" replace />} />
        <Route path="calendar" element={<TrainerCalendarPage />} />
        <Route path="promotions" element={<TrainerPromotionsPage />} />
      </Route>

      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboardPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
        <Route path="profile/edit" element={<ClientProfileEditPage />} />
        <Route path="trainers" element={<ClientTrainersPage />} />
        <Route path="trainers/:id" element={<ClientTrainerDetailPage />} />
        <Route path="messages" element={<ClientMessagesPage />} />
        <Route path="calendar" element={<ClientCalendarPage />} />
        <Route path="subscription" element={<ClientSubscriptionPage />} />
        <Route path="subscription/checkout" element={<ClientSubscriptionCheckoutPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
