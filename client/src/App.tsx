import { Navigate, Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { ClientLayout } from "@/layouts/ClientLayout";
import { TrainerLayout } from "@/layouts/TrainerLayout";
import { TpLayout } from "@/layouts/TpLayout";

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
import AdminCoursesPage from "@/screens/AdminCoursesPage";
import AdminCourseDetailPage from "@/screens/AdminCourseDetailPage";
import AdminTrainingProvidersPage from "@/screens/AdminTrainingProvidersPage";
import AdminHrdcProviderDetailPage from "@/screens/AdminHrdcProviderDetailPage";
import ClientDashboardPage from "@/screens/ClientDashboardPage";
import ClientProfileEditPage from "@/screens/ClientProfileEditPage";
import ClientProfilePage from "@/screens/ClientProfilePage";
import ClientSettingsPage from "@/screens/ClientSettingsPage";
import ClientSubscriptionPage from "@/screens/ClientSubscriptionPage";
import ClientCourseDetailPage from "@/screens/ClientCourseDetailPage";
import ClientCoursesPage from "@/screens/ClientCoursesPage";
import ClientMessagesPage from "@/screens/client-messages/page";
import ClientSubscriptionCheckoutPage from "@/screens/client-subscription-checkout/page";
import HomePage from "@/screens/HomePage";
import LoginPage from "@/screens/LoginPage";
import PostLoginPage from "@/screens/PostLoginPage";
import RegisterClientPage from "@/screens/RegisterClientPage";
import RegisterTrainerPage from "@/screens/RegisterTrainerPage";
import RegisterTpPage from "@/screens/RegisterTpPage";
import { AdminTpOrgsRedirect } from "@/screens/AdminTrainingProvidersPage";
import AdminTpOrgDetailPage from "@/screens/AdminTpOrgDetailPage";
import TpDashboardPage from "@/screens/tp/TpDashboardPage";
import TpCoursesPage from "@/screens/tp/TpCoursesPage";
import TpSchedulesPage from "@/screens/tp/TpSchedulesPage";
import TpRatingsPage from "@/screens/tp/TpRatingsPage";
import TpProfilePage from "@/screens/tp/TpProfilePage";
import TpCourseCreatePage from "@/screens/tp/TpCourseCreatePage";
import TpCourseDetailPage from "@/screens/tp/TpCourseDetailPage";
import TpScheduleCreatePage from "@/screens/tp/TpScheduleCreatePage";
import TrainerCalendarPage from "@/screens/trainer-calendar/page";
import TrainerCertificatePage from "@/screens/trainer-certificate/page";
import TrainerDashboardPage from "@/screens/TrainerDashboardPage";
import TrainerMessagesPage from "@/screens/trainer-messages/page";
import TrainerProfileEditPage from "@/screens/TrainerProfileEditPage";
import TrainerProfilePage from "@/screens/TrainerProfilePage";
import TrainerPromotionsPage from "@/screens/trainer-promotions/page";
import TrainerSettingsPage from "@/screens/TrainerSettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/post-login" element={<PostLoginPage />} />
      <Route path="/register/client" element={<RegisterClientPage />} />
      <Route path="/register/trainer" element={<RegisterTrainerPage />} />
      <Route path="/register/tp" element={<RegisterTpPage />} />

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
        <Route path="training-providers/hrdc/:lookupKey" element={<AdminHrdcProviderDetailPage />} />
        <Route path="tp-orgs" element={<AdminTpOrgsRedirect />} />
        <Route path="tp-orgs/:id" element={<AdminTpOrgDetailPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="courses/p/:id" element={<AdminCourseDetailPage />} />
        <Route path="courses/view" element={<AdminCourseDetailPage />} />
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
        <Route path="settings" element={<TrainerSettingsPage />} />
        <Route path="promotions" element={<TrainerPromotionsPage />} />
      </Route>

      <Route path="/tp" element={<TpLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TpDashboardPage />} />
        <Route path="courses" element={<TpCoursesPage />} />
        <Route path="courses/new" element={<TpCourseCreatePage />} />
        <Route path="courses/:id" element={<TpCourseDetailPage />} />
        <Route path="schedules" element={<TpSchedulesPage />} />
        <Route path="schedules/new" element={<TpScheduleCreatePage />} />
        <Route path="ratings" element={<TpRatingsPage />} />
        <Route path="profile" element={<TpProfilePage />} />
      </Route>

      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboardPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
        <Route path="profile/edit" element={<ClientProfileEditPage />} />
        <Route path="courses" element={<ClientCoursesPage />} />
        <Route path="courses/:id" element={<ClientCourseDetailPage />} />
        <Route path="trainers" element={<Navigate to="/client/courses" replace />} />
        <Route path="trainers/:id" element={<Navigate to="/client/courses" replace />} />
        <Route path="messages" element={<ClientMessagesPage />} />
        <Route path="subscription" element={<ClientSubscriptionPage />} />
        <Route path="subscription/checkout" element={<ClientSubscriptionCheckoutPage />} />
        <Route path="settings" element={<ClientSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
