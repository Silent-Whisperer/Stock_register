import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import type { NavigationPage } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceReviewPage } from './pages/InvoiceReviewPage';
import { StockRegisterPage } from './pages/StockRegisterPage';
import { ProductsPage } from './pages/ProductsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { getInvoices } from './services/invoiceService';

/**
 * Main application coordinator routing between overview, invoices, review, stock, products, and suppliers.
 */
export const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPendingCount = async () => {
    try {
      const invs = await getInvoices();
      const count = invs.filter((i) => i.status === 'PENDING_APPROVAL').length;
      setPendingCount(count);
    } catch {
      // Ignore count fetch errors
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshPendingCount();
    }
  }, [isAuthenticated, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500 font-medium">
        Initializing Invoice Processing Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleOpenReview = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setCurrentPage('review');
  };

  const handleExtractionSuccess = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    refreshPendingCount();
    setCurrentPage('review');
  };

  const handleApprovedSuccess = () => {
    setSelectedInvoiceId(null);
    refreshPendingCount();
    setCurrentPage('invoices');
  };

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={(page) => {
        setSelectedInvoiceId(null);
        setCurrentPage(page);
      }}
      pendingCount={pendingCount}
    >
      {currentPage === 'overview' && (
        <DashboardPage
          onNavigate={setCurrentPage}
          onSelectInvoice={handleOpenReview}
        />
      )}

      {currentPage === 'invoices' && (
        <InvoicesPage
          onSelectInvoice={handleOpenReview}
          onNavigateToUpload={() => setCurrentPage('upload')}
        />
      )}

      {currentPage === 'upload' && (
        <UploadPage onExtractionSuccess={handleExtractionSuccess} />
      )}

      {currentPage === 'review' && selectedInvoiceId && (
        <InvoiceReviewPage
          invoiceId={selectedInvoiceId}
          onBack={() => setCurrentPage('invoices')}
          onApproved={handleApprovedSuccess}
        />
      )}

      {currentPage === 'stock' && <StockRegisterPage />}

      {currentPage === 'products' && <ProductsPage />}

      {currentPage === 'suppliers' && <SuppliersPage />}
    </AppLayout>
  );
};

export default App;
