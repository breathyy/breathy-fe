"use client";

import React, { useState } from 'react';

interface Patient {
  id: string;
  name: string;
  phone: string;
  date: string;
  status: 'Ringan' | 'Sedang' | 'Berat';
  color: string;
}

interface PatientTableProps {
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
}

const ITEMS_PER_PAGE = 5;

export default function PatientTable({ patients, onPatientSelect }: PatientTableProps) {
  const [activeTab, setActiveTab] = useState('Seluruh Pasien');
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = ['Seluruh Pasien', 'Kategori Berat', 'Kategori Sedang', 'Kategori Ringan'];

  // Filter patients based on active tab
  const filteredPatients = patients.filter(patient => {
    if (activeTab === 'Seluruh Pasien') return true;
    if (activeTab === 'Kategori Berat') return patient.status === 'Berat';
    if (activeTab === 'Kategori Sedang') return patient.status === 'Sedang';
    if (activeTab === 'Kategori Ringan') return patient.status === 'Ringan';
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ringan':
        return 'text-green-600';
      case 'Sedang':
        return 'text-yellow-600';
      case 'Berat':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Pasien</h3>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Pasien
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nomor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kasus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: patient.color }}
                    />
                    <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {patient.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {patient.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => onPatientSelect(patient)}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              ◀ Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}