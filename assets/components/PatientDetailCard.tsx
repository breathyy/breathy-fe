import React from 'react';
import Image from 'next/image';

interface PatientDetail {
  id: string;
  name: string;
  status: 'Ringan' | 'Sedang' | 'Berat';
  date: string;
  image?: string;
  description: string;
  symptoms: string;
  recommendations: string[];
  doctorName: string;
  doctorType: string;
}

interface PatientDetailCardProps {
  patient: PatientDetail | null;
  onClose: () => void;
}

export default function PatientDetailCard({ patient, onClose }: PatientDetailCardProps) {
  if (!patient) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ringan':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Sedang':  
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Berat':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ringan':
        return '🟢';
      case 'Sedang':
        return '🟡';
      case 'Berat':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Detail</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Patient Info Header */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
          <span className="text-pink-600 font-semibold text-lg">
            {patient.name.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{patient.name}</h4>
          <p className="text-sm text-gray-600">{patient.date}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </button>
          <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor(patient.status)}`}>
          <span>{getStatusIcon(patient.status)}</span>
          <span>Kasus {patient.status}</span>
          <span className="text-xs opacity-75">{patient.date}</span>
        </div>
      </div>

      {/* Case Image */}
      {patient.image && (
        <div className="mb-6">
          <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <Image 
              src={patient.image} 
              alt="Case image" 
              width={400} 
              height={200}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">
          {patient.description}
        </p>
      </div>

      {/* Symptoms */}
      <div className="mb-6">
        <p className="text-gray-700">
          <span className="font-medium">Saya juga melihat ada sedikit bercak kemeahan (darah tua).</span> {patient.symptoms}
        </p>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h5 className="font-medium text-gray-800 mb-3">Saran:</h5>
        <ul className="space-y-2">
          {patient.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-gray-400 mt-1">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Analysis Status */}
      <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-sm font-medium">Analisis diterima oleh</span>
        </div>
      </div>

      {/* Doctor Info */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
          <span className="text-pink-600 font-semibold">
            {patient.doctorName.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1">
          <h6 className="font-medium text-gray-800">{patient.doctorName}</h6>
          <p className="text-sm text-gray-600">{patient.doctorType}</p>
        </div>

        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </button>
      </div>

      {/* Additional Cases */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">Kasus Sedang</span>
            <span className="text-xs text-gray-500 ml-2">31 Agustus 2025 9:00</span>
          </div>
          <button className="text-pink-500 text-sm font-medium">View Details</button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">Kasus Sedang</span>
            <span className="text-xs text-gray-500 ml-2">1 Agustus 2025 9:00</span>
          </div>
          <button className="text-pink-500 text-sm font-medium">View Details</button>
        </div>
      </div>
    </div>
  );
}