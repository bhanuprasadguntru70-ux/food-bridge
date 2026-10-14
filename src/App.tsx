import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { HomeView } from './views/HomeView';
import { AvailableFoodView } from './views/AvailableFoodView';
import { DonateFoodView } from './views/DonateFoodView';
import { NgoDirectoryView } from './views/NgoDirectoryView';
import { DonationTrackingView } from './views/DonationTrackingView';
import { ImpactView } from './views/ImpactView';
import { AuthView } from './views/AuthView';
import { AboutAndSafetyView } from './views/AboutAndSafetyView';
import { SmartMatchingView } from './views/SmartMatchingView';

const AppContent: React.FC = () => {
  const { currentPage } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-1">
        {currentPage === 'home' && <HomeView />}
        {currentPage === 'find-food' && <AvailableFoodView />}
        {currentPage === 'smart-matching' && <SmartMatchingView />}
        {currentPage === 'donate' && <DonateFoodView />}
        {currentPage === 'ngo-directory' && <NgoDirectoryView />}
        {currentPage === 'tracking' && <DonationTrackingView />}
        {currentPage === 'impact' && <ImpactView />}
        {currentPage === 'auth' && <AuthView />}
        {currentPage === 'about-safety' && <AboutAndSafetyView />}
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
