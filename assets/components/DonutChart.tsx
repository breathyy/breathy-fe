import React from 'react';

interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
    sublabel?: string;
  }[];
  title: string;
}

export default function DonutChart({ data, title }: DonutChartProps) {
  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Create SVG path for donut chart
  let cumulativeAngle = 0;
  const radius = 80;
  const innerRadius = 50;
  const centerX = 100;
  const centerY = 100;

  const paths = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    cumulativeAngle += angle;
    
    return (
      <path
        key={index}
        d={pathData}
        fill={item.color}
        className="transition-opacity hover:opacity-80"
      />
    );
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="flex items-center gap-8">
        {/* Chart */}
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {paths}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <div className="text-sm font-medium text-gray-700">{item.label}</div>
                {item.sublabel && (
                  <div className="text-xs text-gray-500">{item.sublabel}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}