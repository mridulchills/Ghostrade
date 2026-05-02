
import { SignInButton, SignUpButton } from '@clerk/react'

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-white-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-white-300 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
)


export default function SignInGate() {
  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-black border border-white/[0.06] shadow-[0_0_60px_rgba(76,215,246,0.04)] p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-white-400 shadow-[0_0_8px_#4cd7f6] animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-white-500">
              INTEGRITY ENGINE // RESTRICTED
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            Access Required
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Authenticate to access real-time market integrity analysis and anomaly detection.
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <SignInButton mode="modal">
            <button
              type="button"
              className="group/btn relative flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-br from-white-500 to-white-600 font-semibold text-sm text-black tracking-widest shadow-[0px_1px_0px_0px_rgba(255,255,255,0.2)_inset] hover:from-white-400 hover:to-white-500 transition-all duration-200 active:scale-[0.98]"
            >
              SIGN IN
              <BottomGradient />
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button
              type="button"
              className="group/btn relative flex h-11 w-full items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] font-semibold text-sm text-neutral-300 tracking-widest hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.98] shadow-[0px_0px_1px_1px_rgba(255,255,255,0.02)]"
            >
              CREATE ACCOUNT
              <BottomGradient />
            </button>
          </SignUpButton>
        </div>

        {/* Divider */}
        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <a href="/" className="text-[11px] text-neutral-600 hover:text-neutral-300 transition-colors">
            ← RETURN TO HUB
          </a>
          <span className="text-[10px] text-neutral-700 uppercase tracking-widest">V2.04</span>
        </div>
      </div>
    </div>
  )
}
