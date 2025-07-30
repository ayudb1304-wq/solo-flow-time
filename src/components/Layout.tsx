import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout = ({ children, currentPage, onPageChange }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};