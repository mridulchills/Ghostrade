import { SignIn, SignUp } from '@clerk/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BackgroundLines } from '../components/ui/background-lines'
import { CometCard } from "../components/ui/comet-card"
import LiquidLoader from '../components/LiquidLoader'
import ColourfulText from '../components/ui/colourful-text'

// ─── FEATURES DATA ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: "F1",
    label: "Trust Score",

    title: "Institutional Integrity",
    desc: <><ColourfulText text="VAI & VBS" /> algorithms detect manipulation</>,
    img: "/images/trust.png"
  },
  {
    id: "F2",
    label: "Historical Audit",

    title: "Manipulation Replay",
    desc: <>Audits to <ColourfulText text="expose ghost trades" /> retroactively</>,
    img: "/images/audit.png"
  },
  {
    id: "F3",
    label: "TV Extension",

    title: "Native Charting",
    desc: <>Overlay live <ColourfulText text="Trust Scores" /> directly inside TV</>,
    img: "/images/tv.png"
  },
  {
    id: "F4",
    label: "Watchlist Alerts",

    title: "Real-time Pings",
    desc: <>Instant alerts when <ColourfulText text="integrity drops" /> below threshold</>,
    img: "/images/alerts.png"
  }
]

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignUp = location.hash === '#signup' || location.hash === '#sign-up'

  return (
    <BackgroundLines className="flex h-[100svh] w-full items-center justify-center bg-[#060606] overflow-hidden">
      <div className="flex w-full h-full z-10 relative overflow-hidden">

        {/* ── LEFT: AUTH FORM (Shifted Left) ────────────────────────── */}
        <div className="w-full lg:w-[40%] flex items-center justify-center p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-[400px] bg-black border border-white/10 rounded-2xl p-5 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="mb-4 text-center flex flex-col items-center">
              <div className="mb-1">
                <LiquidLoader size={35} />
              </div>
              <div className="text-white/90 font-black tracking-tighter text-lg mb-3">GHOSTRADE</div>
              <h2 className="text-2xl font-bold text-white tracking-tighter mb-1">
                {isSignUp ? "Create Your Identity" : "Secure Authentication"}
              </h2>
              <p className="text-neutral-500 text-xs">
                {isSignUp ? "Join the integrity engine network" : "Access your terminal dashboard"}
              </p>
            </div>

            <div className="clerk-container flex justify-center">
              {isSignUp ? (
                <SignUp
                  signInUrl="/auth#sign-in"
                  routing="hash"
                  appearance={{
                    elements: {
                      card: "bg-transparent border-0 shadow-none p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white",
                      formButtonPrimary: "bg-white-500 hover:bg-white-600 text-black font-bold uppercase tracking-widest h-12",
                      formFieldInput: "bg-white/5 border-white/10 text-white h-12",
                      footerActionText: "text-neutral-500",
                      footerActionLink: "text-white-500 hover:text-white-400",
                      dividerLine: "bg-white/10",
                      dividerText: "text-neutral-500",
                      formFieldLabel: "text-neutral-400",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-white-500"
                    }
                  }}
                />
              ) : (
                <SignIn
                  signUpUrl="/auth#sign-up"
                  routing="hash"
                  appearance={{
                    elements: {
                      card: "bg-transparent border-0 shadow-none p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white",
                      formButtonPrimary: "bg-white-500 hover:bg-white-600 text-black font-bold uppercase tracking-widest h-12",
                      formFieldInput: "bg-white/5 border-white/10 text-white h-12",
                      footerActionText: "text-neutral-500",
                      footerActionLink: "text-white-500 hover:text-white-400",
                      dividerLine: "bg-white/10",
                      dividerText: "text-neutral-500",
                      formFieldLabel: "text-neutral-400",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-white-500"
                    }
                  }}
                />
              )}
            </div>

            <div className="mt-4 text-center border-t border-white/5 pt-3">
              <button
                onClick={() => navigate(isSignUp ? "/auth#sign-in" : "/auth#sign-up")}
                className="text-white/90 text-xs hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none"
              >
                {isSignUp ? (
                  <>ALREADY HAVE AN ACCOUNT? <span className="text-blue-500 font-bold">SIGN IN</span></>
                ) : (
                  <>
                    NEED ACCESS? <span className="text-blue-500 font-bold">CREATE ACCOUNT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: FEATURE GRID (Centered) ────────────────────── */}
        <div className="flex-1 hidden lg:flex items-center justify-end pr-4 p-2 md:p-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-3 max-w-[950px] w-full ml-auto lg:scale-[0.85] xl:scale-95 2xl:scale-100 transition-transform origin-right">
            {FEATURES.map((feature) => (
              <CometCard key={feature.id}>
                <button
                  type="button"
                  className="my-1 flex w-full cursor-pointer flex-col items-stretch rounded-xl border-0 bg-[#1F2121] p-1.5 transition-all duration-300 md:my-2 md:p-2 hover:scale-[1.02]"
                  aria-label={`View feature ${feature.id}`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "none",
                    opacity: 1,
                  }}
                >
                  <div className="mx-1 flex-1">
                    <div className="relative mt-1 aspect-video w-full">
                      <img
                        loading="lazy"
                        className="absolute inset-0 h-full w-full rounded-[16px] bg-[#0a0a0a] object-contain p-4 contrast-125 brightness-90 hover:brightness-110 transition-all duration-300 border border-white/[0.02]"
                        alt={feature.title}
                        src={feature.img}
                        style={{
                          boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                          opacity: 1,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col p-3 font-sans text-white w-full text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-base font-bold">{feature.title}</div>
                      <div className="text-[10px] text-gray-300 opacity-50"></div>
                    </div>
                    <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{feature.label}</div>
                    <div className="text-xs text-neutral-300 leading-relaxed min-h-[32px]">{feature.desc}</div>
                  </div>
                </button>
              </CometCard>
            ))}
          </div>
        </div>
      </div>
    </BackgroundLines>
  )
}
