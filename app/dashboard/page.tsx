"use client";

import React, { useState } from 'react';
import { 
  Navbar, 
  DonutChart, 
  CategoryCard, 
  PatientTable, 
  PatientDetailCard 
} from '../../assets/assets';

// Mock data - in real app this would come from backend
const chartData = [
  { label: 'Sakit Tenggorokan', value: 35, color: '#4C78FF', sublabel: '' },
  { label: 'Sesak Napas', value: 25, color: '#FF82AC', sublabel: '' },
  { label: 'Batuk Berdahak', value: 20, color: '#16DBCC', sublabel: '' },
  { label: 'Lainnya', value: 20, color: '#FFBB38', sublabel: '' }
];

const categories = [
  {
    name: 'Ringan',
    color: '#22C55E',
    description: 'Bening/Putih',
    status: 'Ringan' as const
  },
  {
    name: 'Sedang', 
    color: '#F59E0B',
    description: 'Hijau/Kuning',
    status: 'Sedang' as const
  },
  {
    name: 'Berat',
    color: '#EF4444', 
    description: 'Merah/Cokelat/Hitam',
    status: 'Berat' as const
  }
];

const patientsData = [
  {
    id: '1',
    name: 'Sukma Kalbu',
    phone: '628191827306',
    date: '28 Jan, 12.30 AM',
    status: 'Berat' as const,
    color: '#EF4444'
  },
  {
    id: '2', 
    name: 'Ayu Ningsih',
    phone: '628191827306',
    date: '28 Jan, 12.30 AM',
    status: 'Sedang' as const,
    color: '#F59E0B'
  },
  {
    id: '3',
    name: 'Andi Wiranto', 
    phone: '628191827306',
    date: '28 Jan, 12.30 AM',
    status: 'Ringan' as const,
    color: '#22C55E'
  },
  {
    id: '4',
    name: 'Jajang',
    phone: '628191827306', 
    date: '28 Jan, 12.30 AM',
    status: 'Ringan' as const,
    color: '#22C55E'
  },
  {
    id: '5',
    name: 'Nabila',
    phone: '628191827306',
    date: '28 Jan, 12.30 AM', 
    status: 'Berat' as const,
    color: '#EF4444'
  }
];

const patientDetailData = {
  id: '3',
  name: 'Andi Wiranto',
  status: 'Ringan' as const,
  date: '29 Agustus 2025 9:00',
  image: '/assets/dashboard/case-image.png',
  description: 'Dahak berwarna kuning biasanya menandakan adanya infeksi bakteri pada sistem pernapasan, seperti sinusitis, bronkitis, atau pneumonia. Warna ini berasal dari neutrofil (sel darah putih) yang berkumpul untuk melawan infeksi.',
  symptoms: 'Hal ini bisa mencul karena infeksi tenggorokan saluran batuk terus-menerus atau percampuran saluran pernapasan.',
  recommendations: [
    'Minum banyak air untuk membantu mengencerkan dahak',
    'Istirahat cukup agar daya tahan tubuh tetap kuat'
  ],
  doctorName: 'Dr. Ayanti Putri',
  doctorType: 'Spesialis Paru'
};

interface Patient {
  id: string;
  name: string;
  phone: string;
  date: string;
  status: 'Ringan' | 'Sedang' | 'Berat';
  color: string;
}

interface Category {
  name: string;
  color: string;
  description: string;
  status: 'Ringan' | 'Sedang' | 'Berat';
}

export default function DashboardPage() {
  const [selectedPatient, setSelectedPatient] = useState<typeof patientDetailData | null>(null);

  const handlePatientSelect = (patient: Patient) => {
    // In real app, fetch detailed patient data from backend using patient.id
    console.log('Selected patient:', patient.name);
    setSelectedPatient(patientDetailData);
  };

  const handleCategoryView = (category: Category) => {
    console.log('View category:', category);
    // Handle category view details
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={`${selectedPatient ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'flex justify-center'}`}>
          {/* Main Content */}
          <div className={`${selectedPatient ? 'lg:col-span-2' : 'max-w-5xl w-full'} space-y-8`}>
            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <DonutChart 
                data={chartData} 
                title="Gejala Awal" 
              />
              
              {/* Category Cards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kategori Dahak</h3>
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <CategoryCard 
                      key={index}
                      category={category}
                      onViewDetails={() => handleCategoryView(category)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Table */}
            <PatientTable 
              patients={patientsData}
              onPatientSelect={handlePatientSelect}
            />
          </div>

          {/* Right Column - Patient Details */}
          {selectedPatient && (
            <div className="lg:col-span-1">
              <PatientDetailCard 
                patient={selectedPatient}
                onClose={() => setSelectedPatient(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
