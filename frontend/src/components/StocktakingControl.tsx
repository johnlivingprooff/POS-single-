import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stocktakingAPI, StocktakingStatus } from '../services/stocktakingAPI';
import { generateEmptyStocktakingSheet, generateFinalStocktakingReport, downloadStocktakingPDF } from '../utils/stocktakingPDF';
import { useAppToast } from '../hooks/useAppToast';
import { useAuthStore } from '../stores/authStore';
import { useCurrency } from '../utils/setCurrency';
import { ClipboardList, Download, Play, Square, AlertTriangle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const StocktakingControl: React.FC = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { showToast } = useAppToast();
  const { token } = useAuthStore();
  const { currencyValue } = useCurrency(token);
  const queryClient = useQueryClient();

  // Query stocktaking status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<StocktakingStatus>({
    queryKey: ['stocktaking-status'],
    queryFn: () => stocktakingAPI.getStatus(token),
    refetchInterval: 30000, // Check every 30 seconds
    enabled: !!token,
  });

  // Start stocktaking mutation
  const startMutation = useMutation({
    mutationFn: () => stocktakingAPI.start(token),
    onSuccess: (data) => {
      showToast('Stocktaking started successfully. Sales are now blocked.', 'success');
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to start stocktaking', 'error');
    },
  });

  // End stocktaking mutation
  const endMutation = useMutation({
    mutationFn: () => stocktakingAPI.end(token),
    onSuccess: (data) => {
      showToast('Stocktaking ended successfully. Sales are now enabled.', 'success');
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to end stocktaking', 'error');
    },
  });

  const handleStartStocktaking = async () => {
    setIsStarting(true);
    try {
      // First get the report data for PDF generation
      const reportData = await stocktakingAPI.getReport(token);
      
      // Start stocktaking
      await startMutation.mutateAsync();
      
      // Force immediate status refetch
      await refetchStatus();
      
      // Generate and download empty stocktaking sheet
      setIsGeneratingPDF(true);
      const doc = generateEmptyStocktakingSheet({
        generatedAt: new Date(),
        products: reportData.products
      });
      downloadStocktakingPDF(doc, `stocktaking-sheet-${new Date().toISOString().split('T')[0]}.pdf`);
      
      showToast('Empty stocktaking sheet downloaded!', 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to start stocktaking', 'error');
    } finally {
      setIsStarting(false);
      setIsGeneratingPDF(false);
    }
  };

  const handleEndStocktaking = async () => {
    setIsEnding(true);
    try {
      // Get the final report data
      const reportData = await stocktakingAPI.getReport(token);
      
      // End stocktaking
      await endMutation.mutateAsync();
      
      // Force immediate status refetch
      await refetchStatus();
      
      // Generate and download final inventory report
      setIsGeneratingPDF(true);
      const doc = generateFinalStocktakingReport({
        generatedAt: new Date(),
        totalProducts: reportData.totalProducts,
        totalValue: reportData.totalValue,
        products: reportData.products
      }, currencyValue || '$');
      downloadStocktakingPDF(doc, `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      showToast('Final inventory report downloaded!', 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to end stocktaking', 'error');
    } finally {
      setIsEnding(false);
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadCurrentReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const reportData = await stocktakingAPI.getReport(token);
      const doc = generateFinalStocktakingReport({
        generatedAt: new Date(),
        totalProducts: reportData.totalProducts,
        totalValue: reportData.totalValue,
        products: reportData.products
      }, currencyValue || '$');
      downloadStocktakingPDF(doc, `current-inventory-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Current inventory report downloaded!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to generate report', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">Loading stocktaking status...</span>
      </div>
    );
  }

  const isActive = status?.isActive || false;

  return (
    <div className="flex items-center gap-2">
      {/* Stocktaking Status Indicator */}
      {isActive && (
        <div className="flex items-center gap-2 px-3 py-1 text-orange-800 bg-orange-100 border border-orange-200 rounded-md">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Stocktaking Active - Sales Blocked</span>
        </div>
      )}

      {/* Start/End Stocktaking Button */}
      {!isActive ? (
        <button
          onClick={handleStartStocktaking}
          disabled={isStarting || isGeneratingPDF}
          className="flex items-center px-4 py-2 text-white transition-colors bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Stocktaking
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleEndStocktaking}
          disabled={isEnding || isGeneratingPDF}
          className="flex items-center px-4 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnding ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Ending...
            </>
          ) : (
            <>
              <Square className="w-4 h-4 mr-2" />
              End Stocktaking
            </>
          )}
        </button>
      )}

      {/* Download Current Report Button */}
      <button
        onClick={handleDownloadCurrentReport}
        disabled={isGeneratingPDF}
        className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingPDF ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </>
        )}
      </button>
      
      {/* Info about stocktaking */}
      {status?.startedAt && isActive && (
        <div className="text-sm text-gray-600">
          Started: {new Date(status.startedAt).toLocaleString()}
          {status.startedBy && ` by ${status.startedBy}`}
        </div>
      )}
    </div>
  );
};

export default StocktakingControl;
