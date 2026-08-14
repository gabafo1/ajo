import { ShieldCheckIcon, ClockIcon, User, Banknote } from 'lucide-react'

const features = [
  {
    name: 'Create or Join Groups',
    description:
      'Easily create a new ajo/esusu group or join an existing one. Alajo makes onboarding fast and secure.',
    icon: User,
  },
  {
    name: 'Flexible Contribution Plans',
    description:
      'Set custom contribution cycles—daily, weekly, or monthly—and Alajo tracks every payment.',
    icon: Banknote,
  },
  {
    name: 'Payout Management',
    description:
      'Automated payout scheduling ensures each member receives their turn without confusion or delays.',
    icon: ClockIcon,
  },
  {
    name: 'Secure and Transparent',
    description:
      'All transactions are encrypted, recorded, and visible to group members. Trust is built in.',
    icon: ShieldCheckIcon,
  },
]

export default function FeaturesSection() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base/7 font-semibold text-green-500">Why choose Alajo?</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
            Smarter savings, simpler management
          </p>
          <p className="mt-6 text-lg/8 text-gray-700">
            Whether you&apos;re starting a group or joining one, Alajo simplifies every step—from contributions to payouts—
            with transparency, automation, and security at its core.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base/7 font-semibold text-gray-900">
                  <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg bg-green-500">
                    <feature.icon aria-hidden="true" className="size-6 text-white" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base/7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
