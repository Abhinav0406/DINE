import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Table } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2, Users, Check, AlertCircle, ChefHat } from 'lucide-react';
import Lottie from 'lottie-react';
import cookingAnimation from '../assets/lottie/cooking.json';
import tableAnimation from '../assets/lottie/table.json';

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
    <div className="min-h-screen bg-background-light flex flex-col">
      {/* Header */}
      <div className="bg-primary-50 shadow-md border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center gap-6">
          <a href="https://creamcentre.com/" target="_blank" rel="noopener noreferrer">
            <img src="/images/cream-centre-logo.png" alt="Cream Centre Logo" className="h-16 w-auto" style={{filter: 'drop-shadow(0 2px 4px #daa52033)'}} />
          </a>
          <div className="w-16 h-16">
            <Lottie animationData={cookingAnimation} loop={true} />
          </div>
        </div>
      </div>

      {/* Table Selection */}
      <div className="max-w-7xl mx-auto px-2 py-6">
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
                    bg-white rounded-xl shadow-sm p-8 flex flex-col items-center border border-gray-100
                    ${isAvailable ? 'hover:scale-105 hover:shadow-lg cursor-pointer border-primary-200' : 'opacity-60 cursor-not-allowed border-gray-200'}
                    ${isSelected ? 'ring-4 ring-primary-200 scale-105' : ''}
                    focus:outline-none focus:ring-4 focus:ring-primary-100
                  `}
                >
                  {/* Table Lottie Animation with Table Number Overlay */}
                  <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                    <Lottie animationData={tableAnimation} loop={true} className="absolute inset-0 w-full h-full" />
                  </div>
                  <div className="text-xl font-semibold text-primary-400 mb-1">Table {table.table_number}</div>
                  <div className="flex items-center text-primary-900 mb-2">
                    <Users className="w-5 h-5 mr-1" />
                    {table.capacity} guests
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium mb-3
                    ${table.status === 'available' ? 'bg-primary-100 text-primary-400 border border-primary-200' : table.status === 'occupied' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}
                  `}>
                    {getStatusText(table.status)}
                  </span>
                  <button
                    className={`w-full py-2 rounded-lg font-semibold transition text-base mt-2
                      ${isAvailable ? 'bg-primary-200 text-primary-900 hover:bg-primary-300' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
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
          <div className="fixed bottom-0 left-0 right-0 bg-primary-50 border-t border-primary-100 shadow-2xl p-4 z-30 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-4">
                <span className="block text-lg font-semibold text-primary-400">Selected: Table {selectedTable.table_number}</span>
                <span className="block text-sm text-primary-900">Capacity: {selectedTable.capacity} guests</span>
              </div>
              
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Your Ordering Experience</h3>
                <p className="text-sm text-gray-600">Select how you'd like to order your meal</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleConfirmSelection}
                  className="bg-blue-100 hover:bg-blue-200 border border-blue-200 text-blue-800 font-medium py-4 px-6 rounded-lg shadow-md transition-all"
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">🍽️ Regular Menu</div>
                    <div className="text-sm opacity-90">Browse all items and order freely</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    if (selectedTable) {
                      setCurrentTable({ ...selectedTable, status: 'reserved' });
                      navigate('/staged-menu');
                    }
                  }}
                  className="bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-800 font-medium py-4 px-6 rounded-lg shadow-md transition-all"
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">🥗 Staged Ordering</div>
                    <div className="text-sm opacity-90">Progressive course-by-course ordering</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-16 bg-white rounded-xl p-6 shadow-md max-w-2xl mx-auto border border-gray-100">
          <h3 className="text-lg font-semibold text-primary-400 mb-4">Table Status Legend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-primary-100 border border-primary-200 rounded-full mr-2"></div>
              <span className="text-sm text-primary-400">Available - Ready for booking</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded-full mr-2"></div>
              <span className="text-sm text-red-700">Occupied - Currently in use</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded-full mr-2"></div>
              <span className="text-sm text-yellow-800">Reserved - Temporarily held</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSelectionPage; 