import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import EmailList from '../components/emails/EmailList';
import EmailDetail from '../components/emails/EmailDetail';
import ComposePage from '../components/emails/ComposePage';
import { emailsApi } from '../services/api';
import type { ActiveTab, EmailJob, StatsResponse } from '../types';

type View = 'list' | 'detail' | 'compose';

export default function Dashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('scheduled');
  const [view, setView] = useState<View>('list');
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scheduled, sent, statsData] = await Promise.all([
        emailsApi.getScheduled(),
        emailsApi.getSent(),
        emailsApi.getStats(),
      ]);
      setScheduledEmails(scheduled.data);
      setSentEmails(sent.data);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setView('list');
    setSelectedEmail(null);
  };

  const handleEmailClick = (email: EmailJob) => {
    setSelectedEmail(email);
    setView('detail');
  };

  const handleCompose = () => {
    setView('compose');
    setSelectedEmail(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedEmail(null);
  };

  const handleComposeSuccess = () => {
    setView('list');
    setActiveTab('scheduled');
    fetchData();
  };

  const handleStarToggle = (id: string, currentStarred: boolean) => {
    const updater = (emails: EmailJob[]) =>
      emails.map((e) =>
        e.id === id ? { ...e, isStarred: !currentStarred } : e,
      );
    setScheduledEmails(updater);
    setSentEmails(updater);
  };

  const emails = activeTab === 'scheduled' ? scheduledEmails : sentEmails;

  if (view === 'compose' && user) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden">
        <Toaster position="top-right" />
        <ComposePage
          userEmail={user.email}
          userName={user.name}
          onBack={handleBack}
          onSuccess={handleComposeSuccess}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toaster position="top-right" />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onCompose={handleCompose}
          stats={stats}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto border-l border-gray-200">
          {view === 'detail' && selectedEmail && user ? (
            <EmailDetail
              email={selectedEmail}
              userName={user.name}
              userAvatar={user.avatar}
              onBack={handleBack}
            />
          ) : (
            <EmailList
              emails={emails}
              isLoading={isLoading}
              activeTab={activeTab}
              onCompose={handleCompose}
              onEmailClick={handleEmailClick}
              onRefresh={fetchData}
              onStarToggle={handleStarToggle}
            />
          )}
        </main>
      </div>
    </div>
  );
}
