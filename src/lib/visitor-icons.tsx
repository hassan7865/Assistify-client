import React from 'react';
import { 
  FaChrome, 
  FaFirefox, 
  FaSafari, 
  FaEdge, 
  FaOpera,
  FaWindows,
  FaApple,
  FaLinux,
  FaAndroid,
  FaUbuntu
} from 'react-icons/fa';
import { ReactCountryFlag } from "react-country-flag";

// Country code mapping
const countryCodeMap: { [key: string]: string } = {
  'pakistan': 'PK', 'united states': 'US', 'usa': 'US', 'canada': 'CA',
  'united kingdom': 'GB', 'uk': 'GB', 'germany': 'DE', 'france': 'FR',
  'india': 'IN', 'china': 'CN', 'japan': 'JP', 'australia': 'AU',
  'brazil': 'BR', 'russia': 'RU', 'spain': 'ES', 'italy': 'IT',
  'netherlands': 'NL', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
  'finland': 'FI', 'poland': 'PL', 'turkey': 'TR', 'south korea': 'KR',
  'thailand': 'TH', 'singapore': 'SG', 'malaysia': 'MY', 'indonesia': 'ID',
  'philippines': 'PH', 'vietnam': 'VN', 'mexico': 'MX', 'argentina': 'AR',
  'chile': 'CL', 'colombia': 'CO', 'peru': 'PE', 'south africa': 'ZA',
  'egypt': 'EG', 'nigeria': 'NG', 'kenya': 'KE', 'morocco': 'MA',
  'israel': 'IL', 'saudi arabia': 'SA', 'uae': 'AE', 'iran': 'IR',
  'iraq': 'IQ', 'afghanistan': 'AF', 'bangladesh': 'BD', 'sri lanka': 'LK',
  'nepal': 'NP', 'bhutan': 'BT', 'myanmar': 'MM', 'cambodia': 'KH',
  'laos': 'LA', 'mongolia': 'MN', 'kazakhstan': 'KZ', 'uzbekistan': 'UZ',
  'kyrgyzstan': 'KG', 'tajikistan': 'TJ', 'turkmenistan': 'TM',
  'azerbaijan': 'AZ', 'armenia': 'AM', 'georgia': 'GE', 'ukraine': 'UA',
  'belarus': 'BY', 'moldova': 'MD', 'romania': 'RO', 'bulgaria': 'BG',
  'greece': 'GR', 'albania': 'AL', 'macedonia': 'MK', 'montenegro': 'ME',
  'bosnia': 'BA', 'croatia': 'HR', 'slovenia': 'SI', 'slovakia': 'SK',
  'czech republic': 'CZ', 'hungary': 'HU', 'austria': 'AT', 'switzerland': 'CH',
  'belgium': 'BE', 'luxembourg': 'LU', 'ireland': 'IE', 'portugal': 'PT',
  'iceland': 'IS', 'estonia': 'EE', 'latvia': 'LV', 'lithuania': 'LT',
  'new zealand': 'NZ', 'fiji': 'FJ', 'papua new guinea': 'PG',
  'solomon islands': 'SB', 'vanuatu': 'VU', 'samoa': 'WS', 'tonga': 'TO',
  'palau': 'PW', 'micronesia': 'FM', 'marshall islands': 'MH',
  'kiribati': 'KI', 'tuvalu': 'TV', 'nauru': 'NR'
};

/**
 * Get country flag component
 * @param country - Country name or code
 * @param size - Flag size (default: { width: '16px', height: '12px' })
 * @returns ReactCountryFlag component or null
 */
export const getCountryFlag = (
  country?: string, 
  size: { width: string; height: string } = { width: '16px', height: '12px' }
) => {
  if (!country) return null;
  
  const countryLower = country.toLowerCase();
  const countryCode = countryCodeMap[countryLower] || country.toUpperCase();
  
  return (
    <ReactCountryFlag 
      countryCode={countryCode} 
      svg 
      style={{
        width: size.width,
        height: size.height,
        borderRadius: '2px'
      }}
    />
  );
};

/**
 * Get browser icon component
 * @param browser - Browser name
 * @param userAgent - User agent string for fallback detection
 * @param size - Icon size class (default: 'h-4 w-4')
 * @returns Browser icon component or null
 */
export const getBrowserIcon = (
  browser?: string, 
  userAgent?: string, 
  size: string = 'h-4 w-4'
) => {
  const browserLower = browser?.toLowerCase() || userAgent?.toLowerCase() || '';
  
  if (browserLower.includes('chrome')) return <FaChrome className={`${size} text-blue-500`} />;
  if (browserLower.includes('firefox')) return <FaFirefox className={`${size} text-orange-500`} />;
  if (browserLower.includes('safari')) return <FaSafari className={`${size} text-blue-600`} />;
  if (browserLower.includes('edge')) return <FaEdge className={`${size} text-blue-700`} />;
  if (browserLower.includes('opera')) return <FaOpera className={`${size} text-red-500`} />;
  return null;
};

/**
 * Get OS icon component
 * @param os - Operating system name
 * @param userAgent - User agent string for fallback detection
 * @param size - Icon size class (default: 'h-4 w-4')
 * @returns OS icon component or null
 */
export const getOSIcon = (
  os?: string, 
  userAgent?: string, 
  size: string = 'h-4 w-4'
) => {
  const osLower = os?.toLowerCase() || userAgent?.toLowerCase() || '';
  
  if (osLower.includes('windows')) return <FaWindows className={`${size} text-blue-500`} />;
  if (osLower.includes('mac') || osLower.includes('macos')) return <FaApple className={`${size} text-gray-600`} />;
  if (osLower.includes('ubuntu')) return <FaUbuntu className={`${size} text-orange-500`} />;
  if (osLower.includes('linux')) return <FaLinux className={`${size} text-orange-500`} />;
  if (osLower.includes('android')) return <FaAndroid className={`${size} text-green-500`} />;
  if (osLower.includes('ios')) return <FaApple className={`${size} text-gray-700`} />;
  return null;
};

/**
 * Get device icon component
 * @param deviceType - Device type (mobile, tablet, desktop)
 * @param userAgent - User agent string for fallback detection
 * @param size - Icon size class (default: 'h-3 w-3')
 * @returns Device icon component
 */
export const getDeviceIcon = (
  deviceType?: string, 
  userAgent?: string, 
  size: string = 'h-3 w-3'
) => {
  const { Smartphone, Monitor, Laptop } = require('lucide-react');
  
  if (deviceType === 'mobile' || userAgent?.toLowerCase().includes('mobile')) {
    return <Smartphone className={`${size} text-gray-500`} />;
  }
  if (deviceType === 'tablet' || userAgent?.toLowerCase().includes('tablet')) {
    return <Monitor className={`${size} text-gray-500`} />;
  }
  return <Laptop className={`${size} text-gray-500`} />;
};

/**
 * Get online status text
 * @param startedAt - Visitor start time
 * @returns Formatted online status string
 */
export const getOnlineStatus = (startedAt?: string) => {
  if (!startedAt) return 'Unknown';
  
  const startTime = new Date(startedAt).getTime();
  const currentTime = new Date().getTime();
  const diffMs = currentTime - startTime;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Just now';
};

/**
 * Get referrer display text
 * @param referrer - Referrer URL
 * @param maxLength - Maximum length for truncation (default: 20)
 * @returns Truncated referrer text
 */
export const getReferrerDisplay = (referrer?: string, maxLength: number = 20) => {
  if (!referrer) return '-';
  if (referrer.length <= maxLength) return referrer;
  return `${referrer.substring(0, maxLength)}...`;
};

/**
 * Get message count
 * @param visitor - Visitor object
 * @returns Message count or 0
 */
export const getMessageCount = (visitor: { message_count?: number }) => {
  return visitor.message_count || 0;
};

/**
 * Get status color class
 * @param visitor - Visitor object
 * @returns Status color class
 */
export const getStatusColor = (visitor: { status?: string; agent_id?: string }) => {
  if (visitor.status === 'served' || visitor.agent_id) {
    return 'bg-green-500'; // Served visitors - green
  }
  if (visitor.status === 'incoming') {
    return 'bg-red-500'; // Incoming visitors - red
  }
  return 'bg-gray-400'; // Other statuses - gray
};
