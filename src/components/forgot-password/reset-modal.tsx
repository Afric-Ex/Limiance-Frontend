import { Button, Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { MdOutlineWarningAmber, MdClose } from "react-icons/md";
import { useAuthStore } from "@/src/stores/auth-store";
import { useAuth } from "@/src/hooks/queries/use-auth";

export const ResetModal = () => {
  const email = useAuthStore((state) => state.email);
  const { handleForgotPassword, forgotLoading } = useAuth();

  return (
    <div className="w-full sm:w-[540px] bg-[#181a20] border border-white/[0.06] rounded-2xl relative flex flex-col p-8 items-center text-center overflow-hidden shadow-2xl animate-fade-in-up">
      <div className="w-full flex justify-end absolute top-4 right-4 -mr-0">
        <button
          onClick={() => modals.closeAll()}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdClose size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center w-[124px] h-[124px] rounded-full mt-4 -mb-2 border-4 border-warning/10 relative">
        <div className="absolute inset-0 bg-warning/10 rounded-full" />
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <MdOutlineWarningAmber size={56} className="text-warning drop-shadow-[0_0_24px_rgba(251,164,42,0.4)]" />
        </div>
      </div>

      <div className="flex items-center flex-col gap-8 w-full px-2 mt-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[32px] tracking-tight font-bold text-white">Reset Password?</h2>
          <div className="text-center text-white/50 text-base max-w-[380px] font-medium leading-relaxed">
            Hi, <span className="text-yellow-500">{email}</span>.<br/><br/>
            Please note that for your security, withdrawals, P2P selling, and payment services may be disabled for <strong className="text-white">24 hours</strong> after a password change.
          </div>
        </div>

        <div className="flex w-full gap-4">
          <Button 
            variant="light" 
            color="gray"
            className="flex-1 !h-[55px] !bg-white/5 hover:!bg-white/10 !text-white !rounded-xl !transition-all active:!scale-[0.98]"
            onClick={() => modals.closeAll()}
            disabled={forgotLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !h-[55px] !rounded-xl !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_16px_rgba(77,119,240,0.3)] !text-white !font-bold !transition-all active:!scale-[0.98]"
            onClick={handleForgotPassword}
            disabled={forgotLoading}
          >
            {forgotLoading ? <Loader size={18} color="white" /> : "Proceed"}
          </Button>
        </div>
      </div>
    </div>
  );
};
