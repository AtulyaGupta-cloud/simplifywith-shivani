import { Coins, Sparkles, Infinity as InfinityIcon } from 'lucide-react';

export interface PricingPlan {
  id: string;
  credits: string;
  price: string;
  icon: typeof Coins;
  accent: string;
  badge?: string;
  href: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    credits: '15 credits',
    price: '₹39',
    icon: Coins,
    accent: 'from-accent-violet to-accent-cyan',
    href: 'https://rzp.io/rzp/RiTqN42',
  },
  {
    id: 'popular',
    credits: '50 credits',
    price: '₹99',
    icon: Sparkles,
    accent: 'from-accent-cyan to-accent-emerald',
    badge: 'Best value',
    href: 'https://rzp.io/rzp/KZ5iDYaW',
  },
  {
    id: 'unlimited',
    credits: 'Unlimited for 60 days',
    price: '₹199',
    icon: InfinityIcon,
    accent: 'from-accent-emerald to-accent-violet',
    href: 'https://rzp.io/rzp/d4dCtZAV',
  },
];
