import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { ClientsPage } from "@/components/ClientsPage";
import { ProjectsPage } from "@/components/ProjectsPage";
import { ProjectDetailPage } from "@/components/ProjectDetailPage";
import { InvoicesPage } from "@/components/InvoicesPage";
import { InvoiceGenerator } from "@/components/InvoiceGenerator";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [invoiceProjectId, setInvoiceProjectId] = useState<string | null>(null);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage("project-detail");
  };

  const handleGenerateInvoice = (projectId: string) => {
    setInvoiceProjectId(projectId);
    setShowInvoiceGenerator(true);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setCurrentPage("projects");
  };

  const renderCurrentPage = () => {
    if (showInvoiceGenerator && invoiceProjectId) {
      return (
        <InvoiceGenerator
          projectId={invoiceProjectId}
          onBack={handleBackToProjects}
          onClose={() => {
            setShowInvoiceGenerator(false);
            setInvoiceProjectId(null);
          }}
        />
      );
    }

    switch (currentPage) {
      case "clients":
        return <ClientsPage />;
      case "projects":
        return <ProjectsPage onProjectSelect={handleProjectSelect} />;
      case "project-detail":
        return selectedProjectId ? (
          <ProjectDetailPage
            projectId={selectedProjectId}
            onBack={handleBackToProjects}
            onGenerateInvoice={handleGenerateInvoice}
          />
        ) : (
          <ProjectsPage onProjectSelect={handleProjectSelect} />
        );
      case "invoices":
        return <InvoicesPage />;
      case "settings":
        return <div>Settings Page - Coming Soon</div>;
      default:
        return <Dashboard onProjectSelect={handleProjectSelect} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

export default Index;
