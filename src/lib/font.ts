import {
  Geist_Mono,
  Instrument_Sans,
  Inter,
  Mulish,
  Noto_Sans_Mono
} from 'next/font/google';

import { cn } from '@/lib/utils';

// Using system-ui as the primary font - no need to import from Google Fonts
const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const fontInstrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument'
});

const fontNotoMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-mono'
});

const fontMullish = Mulish({
  subsets: ['latin'],
  variable: '--font-mullish'
});

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const fontVariables = cn(
  fontMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable
);
