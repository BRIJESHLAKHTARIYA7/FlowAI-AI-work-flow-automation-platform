import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import WorkflowsPage from './pages/WorkflowsPage';
import CreateWorkflowPage from './pages/CreateWorkflowPage';
import WorkflowDetailsPage from './pages/WorkflowDetailsPage';
import ExecutionHistoryPage from './pages/ExecutionHistoryPage';
import SettingsPage from './pages/SettingsPage';
import AiPromptModal from './components/AiPromptModal';
import RunModal from './components/RunModal';
import api from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [health, setHealth] = useState(null);

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [runModalWorkflow, setRunModalWorkflow] = useState(null);
  const [aiDraftWorkflow, setAiDraftWorkflow] = useState(null);

  const fetchHealth = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (e) {
      setHealth({ status: 'offline' });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (view, param = null) => {
    setCurrentView(view);
    if (view === 'details' && param) {
      setSelectedWorkflowId(param);
    }
    if (view === 'runs' && param) {
      setSelectedRunId(param);
    }
  };

  const handleOpenRunModal = (workflow) => {
    setRunModalWorkflow(workflow);
  };

  const handleRunStarted = (runId) => {
    setSelectedRunId(runId);
    setCurrentView('runs');
  };

  const handleApplyAiWorkflow = (workflowData) => {
    setAiDraftWorkflow(workflowData);
    setCurrentView('create');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-muted text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        health={health}
      />

      {/* Main Responsive Dashboard Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentView === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              onOpenRunModal={handleOpenRunModal}
              onSelectRun={(runId) => {
                setSelectedRunId(runId);
                setCurrentView('runs');
              }}
            />
          )}

          {currentView === 'workflows' && (
            <WorkflowsPage
              onNavigate={handleNavigate}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              onOpenRunModal={handleOpenRunModal}
            />
          )}

          {currentView === 'create' && (
            <CreateWorkflowPage
              onNavigate={handleNavigate}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              initialData={aiDraftWorkflow}
            />
          )}

          {currentView === 'details' && (
            <WorkflowDetailsPage
              workflowId={selectedWorkflowId}
              onNavigate={handleNavigate}
              onOpenRunModal={handleOpenRunModal}
              onSelectRun={(runId) => {
                setSelectedRunId(runId);
                setCurrentView('runs');
              }}
            />
          )}

          {currentView === 'runs' && (
            <ExecutionHistoryPage
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
              onRerun={(oldRunId) => {
                api.retryRun(oldRunId).then(res => {
                  if (res.success && res.data?.run_id) {
                    setSelectedRunId(res.data.run_id);
                  }
                });
              }}
            />
          )}

          {currentView === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* AI Workflow Prompt Modal */}
      <AiPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyWorkflow={handleApplyAiWorkflow}
      />

      {/* Trigger Workflow Execution Modal */}
      <RunModal
        isOpen={Boolean(runModalWorkflow)}
        workflow={runModalWorkflow}
        onClose={() => setRunModalWorkflow(null)}
        onRunStarted={handleRunStarted}
      />
    </div>
  );
}
