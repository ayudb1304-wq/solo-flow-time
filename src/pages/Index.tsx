import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { ClientsPage } from "@/components/ClientsPage";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "clients":
        return <ClientsPage />;
      case "projects":
        return <div>Projects Page - Coming Soon</div>;
      case "invoices":
        return <div>Invoices Page - Coming Soon</div>;
      case "settings":
        return <div>Settings Page - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

export default Index;
