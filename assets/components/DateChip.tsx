import React from 'react';

interface DateChipProps {
  date: string;
  className?: string;
}

export default function DateChip({ date, className = '' }: DateChipProps) {
  // Parse tanggal Indonesia format 
  const parseIndonesianDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(' ');
    const monthMap: { [key: string]: number } = {
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3,
      'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
      'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
    };
    return new Date(parseInt(year), monthMap[month], parseInt(day));
  };

  const chipDate = parseIndonesianDate(date);
  const today = new Date();
  
  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  chipDate.setHours(0, 0, 0, 0);
  
  // Get day number for comparison
  const chipDay = chipDate.getDate();  
  const todayDay = today.getDate();
  
  // Determine styling based on date status
  let chipStyle = '';
  let customStyle = {};
  
  if (chipDay < todayDay) {
    // Tanggal yang sudah lewat: text #83636F, bg #CBA6B3
    chipStyle = 'border';
    customStyle = {
      color: '#83636F',
      backgroundColor: '#CBA6B3',
      borderColor: '#CBA6B3'
    };
  } else if (chipDay === todayDay) {
    // Tanggal hari ini: outline dengan warna #BF3B6C
    chipStyle = 'bg-white border-2';
    customStyle = {
      color: '#BF3B6C',
      borderColor: '#BF3B6C'
    };
  } else {
    // Tanggal besok dan seterusnya: outline dan text #CBA6B3
    chipStyle = 'bg-white border-2';
    customStyle = {
      color: '#CBA6B3',
      borderColor: '#CBA6B3'
    };
  }

  return (
    <span 
      className={`inline-block px-4 py-2 rounded-full text-sm font-medium transition-colors ${chipStyle} ${className}`}
      style={customStyle}
    >
      {date}
    </span>
  );
}