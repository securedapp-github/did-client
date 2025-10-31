import React from 'react';

const CalendarModal = ({ open, onClose, bookingUrl }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b1d19]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[101] w-full max-w-6xl h-[80vh] rounded-3xl bg-white/95 border border-[#14B87D]/20 shadow-[0_30px_80px_-24px_rgba(20,184,125,0.45)] overflow-hidden">
        <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b border-[#14B87D]/10 bg-white/80 backdrop-blur">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Schedule a meeting</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-[#14B87D] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="w-full h-[calc(80vh-60px)] bg-gradient-to-br from-white via-white to-[#ecfdf5]">
          <iframe
            title="Booking Calendar"
            src={bookingUrl}
            className="w-full h-full"
            style={{ border: '0' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
;

export default CalendarModal;
