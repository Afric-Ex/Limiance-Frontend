"use client";

import React, { useEffect, useState } from "react";
import { Button, Textarea } from "@mantine/core";
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
    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-start p-8 overflow-y-auto">
      <div className="max-w-xl w-full flex flex-col gap-8 mt-10">
        
        <div className="text-center">
          <div className="w-20 h-20 bg-[#0ECB81]/20 text-[#0ECB81] rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Trade Completed!</h2>
          
          <div className="bg-black/20 p-6 rounded-xl border border-white/5 mt-6 text-left">
            {isBuyer ? (
              <>
                <p className="text-white text-lg mb-4">
                  <span className="font-bold text-[#0ECB81]">{cryptoAmount.toLocaleString()} {asset}</span> has been added to your Funding Account.
                </p>
                <p className="text-white/50 text-sm mb-6">
                  Transfer to Spot Account to trade, or leave in Funding Account to withdraw.
                </p>
                <Button 
                  className="w-full bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-white" 
                  size="md"
                  onClick={onGoToWallet}
                >
                  Go to Wallet
                </Button>
              </>
            ) : (
              <>
                <p className="text-white text-lg mb-2">
                  <span className="font-bold text-[#0ECB81]">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}</span> received. 
                </p>
                <p className="text-white text-lg mb-4">
                  <span className="font-bold text-[#F6465D]">{cryptoAmount.toLocaleString()} {asset}</span> released.
                </p>
                <p className="text-white/50 text-sm">
                  Trade fee: {fee.toLocaleString()} {asset} deducted
                </p>
              </>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-white/10" />

        {!submitted ? (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white text-center mb-6">
              How was your experience with {counterparty}?
            </h3>
            
            <div className="flex gap-4 mb-6">
              <button 
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  rating === "POSITIVE" ? "bg-[#0ECB81]/20 border-[#0ECB81] text-[#0ECB81]" : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                }`}
                onClick={() => { setRating("POSITIVE"); setSelectedTags([]); }}
              >
                <FaThumbsUp size={24} />
                <span className="font-semibold">Positive</span>
              </button>
              <button 
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  rating === "NEGATIVE" ? "bg-[#F6465D]/20 border-[#F6465D] text-[#F6465D]" : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                }`}
                onClick={() => { setRating("NEGATIVE"); setSelectedTags([]); }}
              >
                <FaThumbsDown size={24} />
                <span className="font-semibold">Negative</span>
              </button>
            </div>

            {rating && (
              <div className="mb-6 animate-fade-in">
                <div className="text-sm text-white/70 mb-3">Tags (select all that apply):</div>
                <div className="flex flex-wrap gap-2">
                  {currentTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                        selectedTags.includes(tag)
                          ? rating === "POSITIVE"
                            ? "bg-[#0ECB81]/20 border-[#0ECB81] text-[#0ECB81]"
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

            <div className="mb-6">
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

            <div className="flex gap-4">
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
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center text-white/70">
            Thank you for your feedback!
          </div>
        )}

      </div>
    </div>
  );
};
