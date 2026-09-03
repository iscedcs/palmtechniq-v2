"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateCertificateQrDataUrl,
  getCertificateVerificationUrl,
} from "@/lib/certificate/qr-generator";

interface CertificateQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentialId: string;
  studentName?: string;
  certificateTitle?: string;
}

export function CertificateQrModal({
  isOpen,
  onClose,
  credentialId,
  studentName,
  certificateTitle,
}: CertificateQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [darkColor, setDarkColor] = useState("#000000");

  const verificationUrl = credentialId
    ? getCertificateVerificationUrl(credentialId)
    : "";

  useEffect(() => {
    if (isOpen && credentialId) {
      setLoading(true);
      generateCertificateQrDataUrl(credentialId, {
        width: 600,
        margin: 2,
        darkColor,
        lightColor: "#ffffff",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR Code:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, credentialId, darkColor]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `palmtechniq-qr-${credentialId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code downloaded as high-res PNG!");
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    toast.success("Verification URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopiedImage(true);
      toast.success("QR Code image copied! You can paste it directly into Canva / Figma / Photoshop.");
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
      // Fallback: download
      handleDownload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card border-white/10 max-w-md text-white sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/40">
              <QrCode className="w-3.5 h-3.5 mr-1" />
              Certificate QR Code
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            Verification QR Code
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Download or copy this QR code to place on your certificate design. Scanning this QR code instantly verifies the certificate authenticity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Certificate metadata */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Credential ID:</span>
              <code className="font-mono font-bold text-neon-blue">
                {credentialId}
              </code>
            </div>
            {studentName && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Recipient:</span>
                <span className="text-white font-medium">{studentName}</span>
              </div>
            )}
            {certificateTitle && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Title:</span>
                <span className="text-white truncate max-w-[220px]">{certificateTitle}</span>
              </div>
            )}
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-white/80">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${credentialId}`}
                  className="w-56 h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                  {loading ? "Generating QR Code..." : "No Code"}
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1 font-mono text-center">
              Scan opens: <span className="text-gray-300 truncate max-w-[280px]">{verificationUrl}</span>
            </p>
          </div>

          {/* Color Selector */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-gray-400">QR Color Theme:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDarkColor("#000000")}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                  darkColor === "#000000"
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                }`}>
                Classic Black
              </button>
              <button
                type="button"
                onClick={() => setDarkColor("#064e3b")}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                  darkColor === "#064e3b"
                    ? "bg-emerald-950 text-emerald-300 font-semibold border-emerald-500"
                    : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                }`}>
                Palm Forest Green
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyUrl}
            className="border-white/20 text-gray-300 hover:text-white text-xs h-10 flex-1">
            {copiedUrl ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-neon-blue" />
            )}
            Copy Link
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyImage}
            className="border-white/20 text-white hover:bg-white/10 text-xs h-10 flex-1">
            {copiedImage ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5 text-neon-purple" />
            )}
            Copy Image
          </Button>

          <Button
            type="button"
            onClick={handleDownload}
            className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs h-10 font-semibold flex-1 shadow-lg shadow-neon-blue/20">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
