import AppFlowSteps from './AppFlowSteps'
import Loader from './Loader'
import PartyMascot from './PartyMascot'

export default function SplashLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground px-6">
      <div className="flex items-center gap-2 font-display text-2xl tracking-wide text-primary">
        LUCKY
        <PartyMascot size={28} />
      </div>

      <Loader size="lg" />

      <AppFlowSteps />
    </div>
  )
}
