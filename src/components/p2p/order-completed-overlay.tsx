"use client";

import React, { useEffect, useState } from "react";
import { Button, Modal, Textarea } from "@mantine/core";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";

interface OrderCompletedOverlayProps {
  isBuyer: boolean;
  cryptoAmount: number;
  asset: string;
  fiatAmount: number;
  fiat: string;
  counterparty: string;
  fee: number;
  onGoToWallet: () => void;
  onSkipFeedback?: () => void;
  onSubmitFeedback: (rating: "POSITIVE" | "NEGATIVE", tags: string[], comment: string) => void;
  isSubmittingFeedback?: boolean;
  initialSubmitted?: boolean;
}

export const OrderCompletedOverlay = ({
  isBuyer,
  cryptoAmount,
  asset,
  fiatAmount,
  fiat,
  counterparty,
  fee,
  onGoToWallet,
  onSkipFeedback,
  onSubmitFeedback,
  isSubmittingFeedback = false,
  initialSubmitted = false,
}: OrderCompletedOverlayProps) => {
  const [rating, setRating] = useState<"POSITIVE" | "NEGATIVE" | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(initialSubmitted);

  useEffect(() => {
    setSubmitted(initialSubmitted);
  }, [initialSubmitted]);

  const positiveTags = ["Fast payment", "Friendly", "Professional", "Smooth trade", "Would trade again"];
  const negativeTags = ["Slow response", "Payment issues", "Unresponsive"];

  const currentTags = rating === "POSITIVE" ? positiveTags : rating === "NEGATIVE" ? negativeTags : [];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (rating) {
      onSubmitFeedback(rating, selectedTags, comment);
    }
  };

  return (
    <Modal
      opened
      onClose={() => onSkipFeedback?.()}
      title="Trade Completed"
      centered
      classNames={{
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold",
        close: "text-white hover:bg-white/10",
        body: "max-h-[80vh] overflow-y-auto",
      }}
    >
      <div className="flex flex-col gap-5 pt-1">
        <div className="text-center">
          <div className="w-16 h-16 bg-buy/20 text-buy rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>

          <div className="bg-black/20 p-5 rounded-xl border border-white/5 text-left">
            {isBuyer ? (
              <>
                <p className="text-white text-base mb-3">
                  <span className="font-bold text-buy">{cryptoAmount.toLocaleString()} {asset}</span> has been added to your Funding Account.
                </p>
                <p className="text-white/50 text-xs mb-4">
                  Transfer to Spot Account to trade, or leave in Funding Account to withdraw.
                </p>
                <Button
                  className="w-full bg-buy hover:bg-buy/90 text-white"
                  size="md"
                  onClick={onGoToWallet}
                >
                  Go to Wallet
                </Button>
              </>
            ) : (
              <>
                <p className="text-white text-base mb-2">
                  <span className="font-bold text-buy">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}</span> received.
                </p>
                <p className="text-white text-base mb-3">
                  <span className="font-bold text-[#F6465D]">{cryptoAmount.toLocaleString()} {asset}</span> released.
                </p>
                <p className="text-white/50 text-xs">
                  Trade fee: {fee.toLocaleString()} {asset} deducted
                </p>
              </>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-white/10" />

        {!submitted ? (
          <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
            <h3 className="text-base font-bold text-white text-center mb-4">
              How was your experience with {counterparty}?
            </h3>

            <div className="flex gap-3 mb-4">
              <button
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  rating === "POSITIVE" ? "bg-buy/20 border-buy text-buy" : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                }`}
                onClick={() => { setRating("POSITIVE"); setSelectedTags([]); }}
              >
                <FaThumbsUp size={20} />
                <span className="font-semibold text-sm">Positive</span>
              </button>
              <button
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  rating === "NEGATIVE" ? "bg-[#F6465D]/20 border-[#F6465D] text-[#F6465D]" : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                }`}
                onClick={() => { setRating("NEGATIVE"); setSelectedTags([]); }}
              >
                <FaThumbsDown size={20} />
                <span className="font-semibold text-sm">Negative</span>
              </button>
            </div>

            {rating && (
              <div className="mb-4 animate-fade-in">
                <div className="text-xs text-white/70 mb-2">Tags (select all that apply):</div>
                <div className="flex flex-wrap gap-2">
                  {currentTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                        selectedTags.includes(tag)
                          ? rating === "POSITIVE"
                            ? "bg-buy/20 border-buy text-buy"
                            : "bg-[#F6465D]/20 border-[#F6465D] text-[#F6465D]"
                          : "bg-black/20 border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <Textarea
                placeholder="Leave a comment (optional)..."
                value={comment}
                onChange={(e) => setComment(e.currentTarget.value)}
                maxLength={200}
                minRows={3}
                classNames={{
                  input: "bg-black/40 border-white/10 text-white focus:border-primary"
                }}
              />
              <div className="text-right text-xs text-white/40 mt-1">{comment.length}/200</div>
            </div>

            <div className="flex gap-3">
              <Button variant="light" color="gray" className="flex-1 bg-transparent hover:bg-white/5 text-white/70" onClick={onSkipFeedback}>
                Skip
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!rating}
                onClick={handleSubmit}
                loading={isSubmittingFeedback}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 p-5 rounded-xl text-center text-white/70">
            Thank you for your feedback!
          </div>
        )}
      </div>
    </Modal>
  );
};
