import React from 'react';

interface CategoryCardProps {
  category: {
    name: string;
    color: string;
    description: string;
    status: 'Ringan' | 'Sedang' | 'Berat';
  };
  onViewDetails: () => void;
}

export default function CategoryCard({ category, onViewDetails }: CategoryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ringan':
        return '#3ADB16';
      case 'Sedang':
        return '#FFD738';
      case 'Berat':
        return '#FF4C4C';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Color indicator */}
          <div 
            className="w-6 h-6 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: getStatusColor(category.status) }}
          />
          
          {/* Category info */}
          <div>
            <h3 className="font-bold text-gray-900 mb-1">{category.name}</h3>
            <p className="text-gray-600 text-sm">{category.description}</p>
          </div>
        </div>
        
        {/* View Details button */}
        <button 
          onClick={onViewDetails}
          className="text-pink-500 hover:text-pink-600 text-sm font-medium transition-colors flex-shrink-0"
        >
          View Details
        </button>
      </div>
    </div>
  );
}