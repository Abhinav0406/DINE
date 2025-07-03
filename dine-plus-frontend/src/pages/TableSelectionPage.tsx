import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Table } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2, Users, Check, AlertCircle } from 'lucide-react';

const TableSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { tables, setTables, setCurrentTable, setLoading, setError } = useStore();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTables = async () => {
    try {
      setLoading(true);
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
      setEmpty(!data || data.length === 0);
    } catch (error) {
      setError('Failed to load tables');
      setEmpty(true);
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    if (table.status !== 'available') return;
    setSelectedTable(table);
  };

  const handleConfirmSelection = async () => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      
      // Reserve the table
      const { error } = await supabase
        .from('tables')
        .update({ status: 'reserved' })
        .eq('id', selectedTable.id);

      if (error) throw error;

      // Update local state
      setCurrentTable({ ...selectedTable, status: 'reserved' });
      setTables(tables.map(t => 
        t.id === selectedTable.id 
          ? { ...t, status: 'reserved' }
          : t
      ));

      // Navigate to menu
      navigate('/menu');
    } catch (error) {
      setError('Failed to reserve table');
      console.error('Error reserving table:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-primary-100 border-primary-300 text-primary-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Header */}
      <div className="bg-slate-900 shadow-sm border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome to DINE+</h1>
            <p className="mt-2 text-lg text-slate-300">Select your table to start your dining experience</p>
          </div>
        </div>
      </div>

      {/* Table Selection */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-primary-400 mb-4" />
            <span className="text-lg text-slate-300">Loading tables...</span>
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
            <span className="text-lg text-slate-300">No tables found. Please contact staff.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {tables.map((table) => {
              const isSelected = selectedTable?.id === table.id;
              const isAvailable = table.status === 'available';
              return (
                <div
                  key={table.id}
                  tabIndex={isAvailable ? 0 : -1}
                  aria-disabled={!isAvailable}
                  onClick={() => handleTableSelect(table)}
                  onKeyDown={e => isAvailable && (e.key === 'Enter' || e.key === ' ') && handleTableSelect(table)}
                  className={`
                    bg-slate-800 rounded-2xl shadow-lg p-8 flex flex-col items-center border-2
                    ${isAvailable ? 'hover:scale-105 hover:shadow-2xl cursor-pointer border-green-700' : 'opacity-60 cursor-not-allowed border-slate-700'}
                    ${isSelected ? 'ring-4 ring-green-400 scale-105' : ''}
                    focus:outline-none focus:ring-4 focus:ring-green-300
                  `}
                >
                  <div className={`w-16 h-16 flex items-center justify-center rounded-full text-3xl font-bold mb-3
                    ${isAvailable ? 'bg-green-900 text-green-200' : table.status === 'occupied' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}
                  `}>
                    {table.table_number}
                  </div>
                  <div className="text-xl font-semibold text-white mb-1">Table {table.table_number}</div>
                  <div className="flex items-center text-slate-300 mb-2">
                    <Users className="w-5 h-5 mr-1" />
                    {table.capacity} guests
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium mb-3
                    ${table.status === 'available' ? 'bg-green-700 text-green-100' : table.status === 'occupied' ? 'bg-red-700 text-red-100' : 'bg-yellow-700 text-yellow-100'}
                  `}>
                    {getStatusText(table.status)}
                  </span>
                  <button
                    className={`w-full py-2 rounded-lg font-semibold transition text-base mt-2
                      ${isAvailable ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
                    `}
                    disabled={!isAvailable}
                    onClick={e => { e.stopPropagation(); if (isAvailable) handleTableSelect(table); }}
                    aria-label={isAvailable ? `Select Table ${table.table_number}` : `Table ${table.table_number} unavailable`}
                  >
                    {isSelected ? (
                      <span className="flex items-center justify-center"><Check className="w-5 h-5 mr-1" /> Selected</span>
                    ) : (
                      isAvailable ? 'Select Table' : 'Unavailable'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm Selection Bar */}
        {selectedTable && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl p-4 z-30 animate-fade-in">
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center sm:text-left">
                <span className="block text-lg font-semibold text-green-300">Selected: Table {selectedTable.table_number}</span>
                <span className="block text-sm text-slate-300">Capacity: {selectedTable.capacity} guests</span>
              </div>
              <button
                onClick={handleConfirmSelection}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md transition-all w-full sm:w-auto mt-2 sm:mt-0"
              >
                Confirm & View Menu
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-16 bg-slate-800 rounded-xl p-6 shadow-md max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Table Status Legend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-700 rounded-full mr-2"></div>
              <span className="text-sm text-green-100">Available - Ready for booking</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-700 rounded-full mr-2"></div>
              <span className="text-sm text-red-100">Occupied - Currently in use</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-700 rounded-full mr-2"></div>
              <span className="text-sm text-yellow-100">Reserved - Temporarily held</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSelectionPage; 