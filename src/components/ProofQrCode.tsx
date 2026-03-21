import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ProofQrCodeProps {
  url: string;
}

export default function ProofQrCode({ url }: ProofQrCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    async function generateQrCode() {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          margin: 1,
          width: 132,
          color: {
            dark: '#101010',
            light: '#ffffff',
          },
        });

        if (!isCancelled) {
          setQrCodeUrl(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate proof QR code:', error);
      }
    }

    void generateQrCode();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return (
    <div className="rounded-[1.35rem] border border-[#D4AF37]/30 bg-white/95 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="rounded-[1rem] bg-white p-1.5">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR code linking to this Token Forbes certificate"
            className="h-[4.4rem] w-[4.4rem] rounded-[0.85rem]"
          />
        ) : (
          <div className="h-[4.4rem] w-[4.4rem] animate-pulse rounded-[0.85rem] bg-gray-200" />
        )}
      </div>
    </div>
  );
}
