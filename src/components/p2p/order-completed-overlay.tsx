"use client";

import React, { useEffect, useState } from "react";
import { Button, Modal, Textarea } from "@mantine/core";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";

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
      setSelectedTags(selectedTags.filter((t) => t !== tag));
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
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
        body: "max-h-[85vh] overflow-y-auto",
      }}
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-buy/10 border border-buy/20 flex items-center justify-center text-buy mx-auto mb-3">
            <MdCheckCircle size={24} />
          </div>

          <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.06] text-left">
            {isBuyer ? (
              <>
                <p className="text-white text-sm mb-1.5 leading-relaxed">
                  <span className="font-bold text-buy font-mono">
                    {cryptoAmount.toLocaleString()} {asset}
                  </span>{" "}
                  has been added to your Funding Account.
                </p>
                <p className="text-white/45 text-xs mb-3">
                  Transfer to Spot Account to trade, or keep in Funding Account to withdraw.
                </p>
                <Button
                  className="w-full !bg-buy hover:!bg-buy/90 !text-white !h-9 !rounded-lg !text-xs !font-semibold"
                  onClick={onGoToWallet}
                >
                  Go to Wallet
                </Button>
              </>
            ) : (
              <>
                <p className="text-white text-sm mb-1">
                  <span className="font-bold text-buy font-mono">
                    {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
                  </span>{" "}
                  received.
                </p>
                <p className="text-white text-sm mb-1.5">
                  <span className="font-bold text-[#F6465D] font-mono">
                    {cryptoAmount.toLocaleString()} {asset}
                  </span>{" "}
                  released.
                </p>
                <p className="text-white/40 text-xs">
                  Trade fee: {fee.toLocaleString()} {asset} deducted
                </p>
              </>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-white/[0.06]" />

        {!submitted ? (
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-lg">
            <h3 className="text-xs font-semibold text-white/80 text-center mb-3">
              How was your experience with {counterparty}?
            </h3>

            <div className="flex gap-2.5 mb-3">
              <button
                className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all text-xs font-medium ${
                  rating === "POSITIVE"
                    ? "bg-buy/[0.08] border-buy/30 text-buy"
                    : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.06]"
                }`}
                onClick={() => {
                  setRating("POSITIVE");
                  setSelectedTags([]);
                }}
              >
                <FaThumbsUp size={16} />
                <span>Positive</span>
              </button>
              <button
                className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all text-xs font-medium ${
                  rating === "NEGATIVE"
                    ? "bg-[#F6465D]/[0.08] border-[#F6465D]/30 text-[#F6465D]"
                    : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.06]"
                }`}
                onClick={() => {
                  setRating("NEGATIVE");
                  setSelectedTags([]);
                }}
              >
                <FaThumbsDown size={16} />
                <span>Negative</span>
              </button>
            </div>

            {rating && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Tags (optional):</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors border ${
                        selectedTags.includes(tag)
                          ? rating === "POSITIVE"
                            ? "bg-buy/15 border-buy/30 text-buy"
                            : "bg-[#F6465D]/15 border-[#F6465D]/30 text-[#F6465D]"
                          : "bg-white/[0.04] border-white/[0.07] text-white/50 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3">
              <Textarea
                placeholder="Leave a comment (optional)..."
                value={comment}
                onChange={(e) => setComment(e.currentTarget.value)}
                maxLength={200}
                minRows={2}
                classNames={{
                  input:
                    "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !rounded-lg !text-xs !p-2.5",
                }}
              />
              <div className="text-right text-[10px] text-white/35 mt-1">{comment.length}/200</div>
            </div>

            <div className="flex gap-2.5">
              <Button
                variant="subtle"
                className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-9 !rounded-lg !text-xs !font-semibold"
                onClick={onSkipFeedback}
              >
                Skip
              </Button>
              <Button
                className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-9 !rounded-lg !text-xs !font-semibold"
                disabled={!rating}
                onClick={handleSubmit}
                loading={isSubmittingFeedback}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-lg text-center text-white/60 text-xs">
            Thank you for your feedback!
          </div>
        )}
      </div>
    </Modal>
  );
};
