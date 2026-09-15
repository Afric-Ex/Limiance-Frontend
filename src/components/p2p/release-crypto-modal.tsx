import React from "react";
import { Modal, Button, PinInput } from "@mantine/core";

interface ReleaseCryptoModalProps {
  opened: boolean;
  onClose: () => void;
  quantity: number;
  asset: string;
  counterpartyName: string;
  fiatAmount: number;
  fiat: string;
  otpRequested: boolean;
  otpValue: string;
  setOtpValue: (val: string) => void;
  isRequestingCode: boolean;
  isReleasing: boolean;
  handleRequestOtp: () => void;
  handleRelease: () => void;
  showFinalConfirm: boolean;
  setShowFinalConfirm: (val: boolean) => void;
}

export function ReleaseCryptoModal({
  opened,
  onClose,
  quantity,
  asset,
  counterpartyName,
  fiatAmount,
  fiat,
  otpRequested,
  otpValue,
  setOtpValue,
  isRequestingCode,
  isReleasing,
  handleRequestOtp,
  handleRelease,
  showFinalConfirm,
  setShowFinalConfirm,
}: ReleaseCryptoModalProps) {
  const handleClose = () => {
    setShowFinalConfirm(false);
    onClose();
  };

  const onOtpComplete = () => {
    if (otpValue.length === 6) {
      setShowFinalConfirm(true);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Security Verification Required"
      centered
      classNames={{
        content: "bg-elevated border border-white/10",
        header: "bg-elevated border-b border-white/5",
        title: "text-white font-bold",
        close: "text-white/50 hover:text-white",
      }}
    >
      <div className="flex flex-col gap-4 pt-2">
        {!showFinalConfirm ? (
          <>
            <div className="text-white/60 text-sm">
              To release <span className="text-white font-bold">{quantity.toLocaleString()} {asset}</span>, enter the verification code sent to your email/phone.
            </div>

            {!otpRequested ? (
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold mt-2" loading={isRequestingCode} onClick={handleRequestOtp}>
                Send Verification Code
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <PinInput
                  length={6}
                  type="number"
                  value={otpValue}
                  onChange={setOtpValue}
                  onComplete={onOtpComplete}
                  classNames={{ input: "bg-white/10 border-white/20 text-white text-center w-10 h-12 text-lg focus:border-yellow-500" }}
                />
                <Button 
                  className="w-full bg-buy hover:bg-buy/90 text-white font-bold mt-2" 
                  disabled={otpValue.length < 6}
                  onClick={() => setShowFinalConfirm(true)}
                >
                  Verify Code
                </Button>
                <Button 
                  variant="subtle" 
                  className="w-full text-yellow-500 hover:bg-white/5" 
                  loading={isRequestingCode} 
                  onClick={handleRequestOtp}
                >
                  Resend Code
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center mb-2">
              <div className="text-red-400 font-bold text-lg mb-2">Final Confirmation</div>
              <div className="text-white text-sm">
                You are about to release<br/>
                <span className="text-2xl font-bold text-white my-1 block">{quantity.toLocaleString()} {asset}</span>
                to <span className="text-yellow-400 font-bold">{counterpartyName}</span>
              </div>
              <div className="mt-4 text-white/50 text-xs text-left border-t border-white/10 pt-3">
                <p>By clicking confirm, you acknowledge:</p>
                <ul className="list-disc pl-4 mt-1">
                  <li>You have successfully received {fiatAmount.toLocaleString()} {fiat} in your bank account.</li>
                  <li>Crypto releases are IRREVERSIBLE.</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/20 text-white" onClick={() => setShowFinalConfirm(false)}>Back</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold" loading={isReleasing} onClick={handleRelease}>
                Release Now
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
