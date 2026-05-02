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
    code: "#89A2",
    title: "Institutional Integrity",
    desc: <><ColourfulText text="VAI & VBS" /> algorithms detect manipulation</>,
    img: "/images/trust.png"
  },
  {
    id: "F2",
    label: "Historical Audit",
    code: "#B7RA",
    title: "Manipulation Replay",
    desc: <>Audits to <ColourfulText text="expose ghost trades" /> retroactively</>,
    img: "/images/audit.png"
  },
  {
    id: "F3",
    label: "TV Extension",
    code: "#E291",
    title: "Native Charting",
    desc: <>Overlay live <ColourfulText text="Trust Scores" /> directly inside TV</>,
    img: "/images/tv.png"
  },
  {
    id: "F4",
    label: "Watchlist Alerts",
    code: "#A92X",
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
    <BackgroundLines className="flex min-h-screen w-full items-center justify-center bg-[#060606] overflow-x-hidden">
      <div className="flex w-full min-h-screen z-10 relative">

        {/* ── LEFT: AUTH FORM (Shifted Left) ────────────────────────── */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-8 md:p-16 lg:pr-24">
          <div className="w-full max-w-[480px] bg-black border border-white/10 rounded-3xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="mb-8 text-center flex flex-col items-center">
              <div className="mb-4">
                <LiquidLoader size={50} />
              </div>
              <div className="text-white/90 font-black tracking-tighter text-2xl mb-6">GHOSTRADE</div>
              <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">
                {isSignUp ? "Create Your Identity" : "Secure Authentication"}
              </h2>
              <p className="text-neutral-500 text-sm font-mono">
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
                      formButtonPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black font-bold uppercase tracking-widest h-12",
                      formFieldInput: "bg-white/5 border-white/10 text-white h-12",
                      footerActionText: "text-neutral-500",
                      footerActionLink: "text-cyan-500 hover:text-cyan-400",
                      dividerLine: "bg-white/10",
                      dividerText: "text-neutral-500",
                      formFieldLabel: "text-neutral-400",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-cyan-500"
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
                      formButtonPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black font-bold uppercase tracking-widest h-12",
                      formFieldInput: "bg-white/5 border-white/10 text-white h-12",
                      footerActionText: "text-neutral-500",
                      footerActionLink: "text-cyan-500 hover:text-cyan-400",
                      dividerLine: "bg-white/10",
                      dividerText: "text-neutral-500",
                      formFieldLabel: "text-neutral-400",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-cyan-500"
                    }
                  }}
                />
              )}
            </div>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <button
                onClick={() => navigate(isSignUp ? "/auth#sign-in" : "/auth#sign-up")}
                className="text-white/90 text-xs font-mono hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none"
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
        <div className="flex-1 hidden lg:flex items-center justify-end pr-12 p-8">
          <div className="grid grid-cols-2 gap-8 max-w-[1150px] w-full ml-auto">
            {FEATURES.map((feature) => (
              <CometCard key={feature.id}>
                <button
                  type="button"
                  className="my-4 flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 transition-all duration-300 md:my-6 md:p-4 hover:scale-[1.02]"
                  aria-label={`View feature ${feature.id}`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "none",
                    opacity: 1,
                  }}
                >
                  <div className="mx-2 flex-1">
                    <div className="relative mt-2 aspect-[4/3] w-full">
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
                  <div className="mt-3 flex flex-col p-4 font-sans text-white w-full text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-lg font-bold">{feature.title}</div>
                      <div className="text-xs text-gray-300 opacity-50 font-mono">{feature.code}</div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono mb-2 uppercase tracking-wider">{feature.label}</div>
                    <div className="text-sm text-neutral-300 leading-relaxed min-h-[40px]">{feature.desc}</div>
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
