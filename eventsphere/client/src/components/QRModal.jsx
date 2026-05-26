import React from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Download, QrCode } from 'lucide-react';

export const QRModal = ({
  isOpen,
  onClose,
  qrCodeUrl,
  eventTitle,
  userName
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Entry Pass"
      size="sm"
    >
      <div className="flex flex-col items-center text-center gap-5">
        <div className="text-slate-200">
          <h4 className="text-base font-bold text-slate-100 light:text-slate-900 leading-snug">
            {eventTitle}
          </h4>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Attendee: {userName}
          </p>
        </div>

        {/* QR Frame with glowing accent borders */}
        <div className="relative p-4 bg-white rounded-2xl shadow-xl shadow-indigo-600/5 border border-indigo-500/30">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Event Access QR Code"
              className="w-48 h-48 select-none"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
              <QrCode className="w-16 h-16 animate-pulse" />
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 light:text-slate-500 max-w-[85%] leading-relaxed">
          Please present this QR code at the registration desk upon arrival. A volunteer will scan it to check you in.
        </p>

        {/* Download Action */}
        {qrCodeUrl && (
          <a
            href={qrCodeUrl}
            download={`EventSphere_Pass_${eventTitle.replace(/\s+/g, '_')}.png`}
            className="w-full mt-2"
          >
            <Button variant="primary" className="w-full">
              <Download className="w-4 h-4 mr-2" /> Download PNG Pass
            </Button>
          </a>
        )}
      </div>
    </Modal>
  );
};
