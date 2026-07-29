'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { parseExcelFile, ParseResult } from '@/engine/excelParser';
import { useSimStore } from '@/store/useSimStore';

export default function ExcelUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadRoute, resetToDefaultRoute, isCustomRoute, routeName } = useSimStore();

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, file.name);
      setParseResult(result);

      if (result.success) {
        loadRoute(result.ports, result.legs, result.routeName);
      }
    } catch (err) {
      setParseResult({
        success: false,
        ports: [],
        legs: [],
        routeName: file.name,
        errors: [`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`],
        warnings: [],
      });
    }
    setIsProcessing(false);
  }, [loadRoute]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="space-y-4">
      {/* Current route info */}
      {isCustomRoute && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            background: 'var(--cyan-glow)',
            border: '1px solid rgba(56, 217, 200, 0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--cyan)' }} />
            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>
              Custom Route: {routeName}
            </span>
          </div>
          <button
            onClick={() => {
              resetToDefaultRoute();
              setParseResult(null);
            }}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-secondary)',
              background: 'var(--glass-strong)',
              border: '1px solid var(--card-border)',
            }}
          >
            Reset to Hurtigruten
          </button>
        </motion.div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl cursor-pointer transition-all p-8 text-center"
        style={{
          border: `2px dashed ${isDragging ? 'var(--cyan)' : 'var(--card-border)'}`,
          background: isDragging ? 'rgba(56, 217, 200, 0.04)' : 'var(--glass)',
          boxShadow: isDragging ? '0 0 30px rgba(56, 217, 200, 0.08) inset' : 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex justify-center mb-3">
          {isProcessing ? (
            <Loader2 size={32} className="animate-spin text-cyan-400" />
          ) : isDragging ? (
            <Download size={32} className="text-cyan-400" />
          ) : (
            <FileSpreadsheet size={32} className="text-text-muted" />
          )}
        </div>
        <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {isProcessing ? 'Processing...' : 'Drop Excel File Here'}
        </p>
        <p className="text-xs" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>
          or click to browse · .xlsx, .xls, .csv supported
        </p>
        <div className="mt-4 px-4 py-2 rounded-lg inline-block" style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Required columns
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            name · lat · lng · gridTier · portStayMinutes · distanceToNextKm
          </p>
        </div>
      </div>

      {/* Parse results */}
      <AnimatePresence>
        {parseResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Success banner */}
            {parseResult.success && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
                style={{
                  background: 'var(--green-dim)',
                  border: '1px solid rgba(52, 211, 153, 0.15)',
                }}
              >
                <CheckCircle size={20} className="text-green-500" />
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                    Route Loaded Successfully
                  </p>
                  <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {parseResult.ports.length} ports · {parseResult.legs.length} legs ·{' '}
                    {Math.round(parseResult.legs.reduce((s, l) => s + l.distanceKm, 0)).toLocaleString()} km
                  </p>
                </div>
              </div>
            )}

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <div
                className="px-4 py-3 rounded-xl mb-3"
                style={{
                  background: 'var(--red-dim)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--red)', fontFamily: 'var(--font-display)' }}>
                  Errors
                </p>
                {parseResult.errors.map((err, i) => (
                  <p key={i} className="text-xs mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    • {err}
                  </p>
                ))}
              </div>
            )}

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <div
                className="px-4 py-3 rounded-xl"
                style={{
                  background: 'var(--amber-dim)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
                  Warnings ({parseResult.warnings.length})
                </p>
                <div className="max-h-32 overflow-y-auto">
                  {parseResult.warnings.map((warn, i) => (
                    <p key={i} className="text-[11px] mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      • {warn}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
