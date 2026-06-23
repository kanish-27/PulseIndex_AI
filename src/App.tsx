import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPage } from './features/auth/AuthPage';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './features/dashboard/DashboardView';
import { VaultView } from './features/vault/VaultView';
import { ConsentView } from './features/consent/ConsentView';
import { EmergencyView } from './features/emergency/EmergencyView';
import { AuditView } from './features/audit/AuditView';
import { GuardianView } from './features/guardian/GuardianView';

const AppContent: React.FC = () => {
  const { user, activeTab } = useApp();

  // If user is not logged in, render the AuthPage
  if (!user) {
    return <AuthPage />;
  }

  // Render the appropriate sub-view inside the Layout template
  return (
    <Layout>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'vault' && <VaultView />}
      {activeTab === 'consent' && <ConsentView />}
      {activeTab === 'guardian' && <GuardianView />}
      {activeTab === 'emergency' && <EmergencyView />}
      {activeTab === 'audit' && <AuditView />}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
