import React, { useState, useMemo, useEffect, useRef } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    font-family: 'Inter', sans-serif;
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const CATEGORIES = [
  { name: 'Ocio' }, { name: 'Trabajo' }, { name: 'Hogar' }, { name: 'Salud' }, { name: 'Otro' }
];

const CANCELLATION_GUIDES = {
  'Netflix': { domain: 'netflix.com', steps: ['Inicia sesión en Netflix.com.', 'Ve a "Cuenta".', 'Haz clic en "Cancelar membresía" y confirma.'], url: 'https://www.netflix.com/youraccount' },
  'Spotify': { domain: 'spotify.com', steps: ['Accede a spotify.com/account.', 'Bajo "Tu plan", haz clic en "Cambiar plan".', 'Selecciona "Cancelar Premium".'], url: 'https://www.spotify.com/account/overview/' },
  'YouTube Premium': { domain: 'youtube.com', steps: ['Ve a youtube.com/paid_memberships.', 'Selecciona "Compras y suscripciones".', 'Haz clic en "Gestionar suscripción" > "Desactivar".'], url: 'https://www.youtube.com/paid_memberships' },
  'Amazon Prime': { domain: 'amazon.es', steps: ['Ve a Amazon.es > "Mi cuenta".', 'Suscripción a Prime > "Gestionar" > "Finalizar suscripción".'], url: 'https://www.amazon.es/mc/manage' },
  'Google One': { domain: 'one.google.com', steps: ['Ve a myaccount.google.com > "Pagos y suscripciones".', 'Selecciona "Gestionar suscripciones" y cancela.'], url: 'https://myaccount.google.com/payments-and-subscriptions' },
  'Adobe': { domain: 'adobe.com', steps: ['Entra a account.adobe.com.', 'Ve a "Administrar plan" > "Cancelar tu plan".'], url: 'https://account.adobe.com/plans' },
  'Disney+': { domain: 'disneyplus.com', steps: ['Inicia sesión en DisneyPlus.com.', 'Perfil > "Cuenta" > Selecciona plan > "Cancelar".'], url: 'https://www.disneyplus.com/account' },
  'Apple Music': { domain: 'apple.com', steps: ['En iOS: Ajustes > Tu Nombre > "Suscripciones".', 'Selecciona y pulsa "Cancelar".'], url: 'https://apps.apple.com/account/subscriptions' },
  'iCloud+': { domain: 'icloud.com', steps: ['Ajustes > Tu Nombre > iCloud > "Gestionar plan".', 'Opciones de reducción > Selecciona plan gratuito.'], url: 'https://support.apple.com/es-es/HT207594' },
  'ChatGPT Plus': { domain: 'chatgpt.com', steps: ['Abre ChatGPT > Clic en tu nombre.', '"My Plan" > "Manage my subscription" > "Cancel Plan".'], url: 'https://chat.openai.com/' },
  'PlayStation Plus': { domain: 'playstation.com', steps: ['Web de PlayStation > Gestión de cuentas.', 'Suscripción > Desactiva renovación automática.'], url: 'https://store.playstation.com/' },
  'Xbox Game Pass': { domain: 'xbox.com', steps: ['Cuenta Microsoft > Servicios y suscripciones.', 'Game Pass > Administrar > Cancelar.'], url: 'https://account.microsoft.com/services' },
  'Max': { domain: 'max.com', steps: ['max.com > Ajustes > Suscripción > Gestionar > Cancelar.'], url: 'https://www.max.com/account' },
  'Twitch': { domain: 'twitch.tv', steps: ['twitch.tv > Avatar > Suscripciones > Engranaje > No renovar.'], url: 'https://www.twitch.tv/subscriptions' },
  'Canva': { domain: 'canva.com', steps: ['Configuración > Facturación y planes > Cancelar suscripción.'], url: 'https://www.canva.com/settings/billing' },
  'Microsoft 365': { domain: 'microsoft.com', steps: ['account.microsoft.com/services > Administrar > Cancelar.'], url: 'https://account.microsoft.com/services' },
  'Tinder': { domain: 'tinder.com', steps: ['Ajustes > "Gestionar cuenta de pago" > Cancelar.'], url: 'https://tinder.com/app/settings' },
  'Strava': { domain: 'strava.com', steps: ['Ajustes > Mi cuenta > Cancelar o Bajar de categoría.'], url: 'https://www.strava.com/settings/billing' },
  'Notion': { domain: 'notion.so', steps: ['Settings & members > Billing > Change plan > Downgrade.'], url: 'https://www.notion.so/' },
  'Figma': { domain: 'figma.com', steps: ['Settings > Billing > Cancel plan.'], url: 'https://www.figma.com/' },
  'GitHub Copilot': { domain: 'github.com', steps: ['Settings > Billing and plans > Copilot > Cancel.'], url: 'https://github.com/settings/billing' },
  'Midjourney': { domain: 'midjourney.com', steps: ['midjourney.com/account > Manage Sub > Cancel Plan.'], url: 'https://www.midjourney.com/account/' },
  'NordVPN': { domain: 'nordvpn.com', steps: ['Inicia sesión en tu Nord Account.', 'Ve a "Facturación" > "Suscripciones" y cancela la renovación automática.'], url: 'https://my.nordaccount.com/' },
  'Dropbox': { domain: 'dropbox.com', steps: ['Ve a la configuración de tu cuenta > Plan.', 'Haz clic en "Cancelar plan" al final de la página.'], url: 'https://www.dropbox.com/account/plan' },
  'Evernote': { domain: 'evernote.com', steps: ['Ajustes de cuenta > Facturación.', 'Haz clic en "Cancelar suscripción".'], url: 'https://www.evernote.com/Billing.action' },
  'Slack': { domain: 'slack.com', steps: ['Ajustes del espacio de trabajo > Facturación.', 'Cambiar plan > Bajar al plan gratuito.'], url: 'https://slack.com/account/billing' },
  'Zoom': { domain: 'zoom.us', steps: ['Administración de cuenta > Facturación.', 'En la pestaña "Planes actuales", haz clic en Cancelar.'], url: 'https://zoom.us/billing' },
  'X Premium': { domain: 'x.com', steps: ['Más > Configuración y soporte > X Premium.', 'Gestionar suscripción > Cancelar.'], url: 'https://twitter.com/settings/premium' },
  'LinkedIn Premium': { domain: 'linkedin.com', steps: ['Icono "Yo" > Ajustes de Premium.', 'Gestionar cuenta Premium > Cancelar suscripción.'], url: 'https://www.linkedin.com/premium/manage' },
  'Duolingo': { domain: 'duolingo.com', steps: ['Ajustes > Super Duolingo.', 'Selecciona "Cancelar suscripción".'], url: 'https://www.duolingo.com/settings/super' },
  'Patreon': { domain: 'patreon.com', steps: ['Configuración > Suscripciones activas.', 'Editar > Cancelar o eliminar aportación.'], url: 'https://www.patreon.com/pledges' },
  'Skillshare': { domain: 'skillshare.com', steps: ['Ajustes de la cuenta > Pagos.', 'Haz clic en "Cancelar membresía".'], url: 'https://www.skillshare.com/settings/payments' },
  'Coursera': { domain: 'coursera.org', steps: ['Configuración > Mis compras.', 'En la pestaña Suscripciones, haz clic en Cancelar.'], url: 'https://www.coursera.org/my-purchases' },
  'Crunchyroll': { domain: 'crunchyroll.com', steps: ['Mi cuenta > Estatus de Membresía Premium.', 'Haz clic en "Cancelar Membresía".'], url: 'https://www.crunchyroll.com/acct/membership' },
  'DAZN': { domain: 'dazn.com', steps: ['Mi cuenta > Suscripción.', 'Haz clic en "Cancelar suscripción" y sigue los pasos.'], url: 'https://www.dazn.com/myaccount' },
  'Nintendo Switch Online': { domain: 'nintendo.com', steps: ['eShop en la consola o web de Nintendo.', 'Ajustes de pases/suscripciones > Desactivar renovación.'], url: 'https://ec.nintendo.com/my/' },
  'EA Play': { domain: 'ea.com', steps: ['Cuenta EA > EA Play.', 'Haz clic en "Gestionar membresía" > "Cancelar".'], url: 'https://myaccount.ea.com/cp-ui/subscription/index' },
  'LastPass': { domain: 'lastpass.com', steps: ['Opciones de cuenta > Mi cuenta.', 'Haz clic en "Cancelar" bajo la información de suscripción.'], url: 'https://lastpass.com/my.php' },
  '1Password': { domain: '1password.com', steps: ['Facturación > Detalles de suscripción.', 'Selecciona "Darse de baja".'], url: 'https://my.1password.com/billing' },
  'Dashlane': { domain: 'dashlane.com', steps: ['Web app de Dashlane > Mi cuenta > Suscripción.', 'Haz clic en Cancelar.'], url: 'https://app.dashlane.com/' }
};

const BRAND_COLORS: Record<string, string> = {
  'netflix': '#E50914', 'spotify': '#1DB954', 'youtube': '#FF0000', 'amazon': '#00A8E1',
  'google': '#4285F4', 'adobe': '#FF0000', 'disney': '#113CCF', 'apple': '#FA243C',
  'icloud': '#36A3FF', 'chatgpt': '#10A37F', 'playstation': '#003791', 'xbox': '#107C10',
  'max': '#002BE7', 'twitch': '#9146FF', 'canva': '#00C4CC', 'microsoft': '#D83B01',
  'tinder': '#FD3A73', 'strava': '#FC4C02', 'notion': '#787878', 'figma': '#F24E1E',
  'github': '#24292F', 'midjourney': '#787878', 'nordvpn': '#4687FF', 'dropbox': '#0061FF',
  'evernote': '#00A82D', 'slack': '#E01E5A', 'zoom': '#2D8CFF', 'x premium': '#787878',
  'linkedin': '#0A66C2', 'duolingo': '#58CC02', 'patreon': '#FF424D', 'skillshare': '#00FF84',
  'coursera': '#0056D2', 'crunchyroll': '#F47521', 'dazn': '#E3E3E3', 'nintendo': '#E60012',
  'ea play': '#FF4747', 'lastpass': '#D32D27', '1password': '#00A4DE', 'dashlane': '#0E3532'
};

const getBrandColor = (name = '') => {
  const lowerName = String(name).toLowerCase();
  for (const key in BRAND_COLORS) {
    if (lowerName.includes(key)) return BRAND_COLORS[key];
  }
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < lowerName.length; i++) hash = lowerName.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const INITIAL_SUBS = [
  { id: '1', name: 'Netflix', category: 'Ocio', billingCycle: 'Mensual', cost: 17.99, currency: '€', nextBillingDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], isTrial: false, isShared: true, sharedMembers: 3, status: 'active' },
  { id: '2', name: 'Spotify', category: 'Ocio', billingCycle: 'Mensual', cost: 20.99, currency: '€', nextBillingDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0], isTrial: false, isShared: true, sharedMembers: 6, status: 'active' },
  { id: '3', name: 'Google One', category: 'Trabajo', billingCycle: 'Mensual', cost: 1.99, currency: '€', nextBillingDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], isTrial: true, isShared: false, sharedMembers: 1, status: 'active' }
];

const Icons = {
  Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Euro: () => <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>,
  Calendar: () => <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Alert: () => <svg className="w-4 h-4 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Sun: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Moon: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
};

const PeriodicaLogo = () => (
  <svg viewBox="0 0 316.59 342.34" className="w-8 h-8 fill-zinc-950 dark:fill-white drop-shadow-sm transition-colors">
    <path d="M211.39,101.44C161.76,101.44,115.52,104,89.5,104a37.28,37.28,0,0,1-37.23-37.23v-.08A37.28,37.28,0,0,1,89.5,29.5H196.48c45.54,0,85.24,19.33,105,65.8,1.63,3.83,3.06,7.84,4.27,12,3.37,11.5,5.18,24,5.18,37.11a123.63,123.63,0,0,1-19,65.92c-15.11,24.16-36.57,41.9-59.5,52.88L262,284c17.7,21.65-8.52,43-26.6,26.7-18.06-16.27-77.58-69.87-92.49-83.3h-44.5l-26,115h-45L80,180.46a36.4,36.4,0,0,1,16.91-31.95A40,40,0,0,1,118.82,142h22.6c32.48,0,86.1,1.86,96.38-25.29s-12.78-15.22-26.41-15.22Z" />
  </svg>
);

const ServiceLogo = ({ name, className = "" }: { name: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [name]);

  let domain = null;
  const safeName = String(name || '');
  if (safeName) {
    const exactMatch = Object.keys(CANCELLATION_GUIDES).find(k => k.toLowerCase() === safeName.toLowerCase());
    if (exactMatch) {
      domain = CANCELLATION_GUIDES[exactMatch as keyof typeof CANCELLATION_GUIDES].domain;
    } else {
      const partialMatch = Object.keys(CANCELLATION_GUIDES).find(k => k.toLowerCase().includes(safeName.toLowerCase()) || safeName.toLowerCase().includes(k.toLowerCase()));
      if (partialMatch) domain = CANCELLATION_GUIDES[partialMatch as keyof typeof CANCELLATION_GUIDES].domain;
    }
  }

  const defaultClasses = className || "w-10 h-10 rounded-md p-1 border-zinc-200 dark:border-zinc-800 shadow-sm";
  const textClasses = className || "w-10 h-10 rounded-md text-lg shadow-sm border-zinc-200 dark:border-zinc-800";

  if (!domain || hasError) {
    return (
      <div className={`flex-shrink-0 flex items-center justify-center font-bold bg-zinc-100 text-zinc-500 border dark:bg-zinc-800 dark:text-zinc-400 uppercase ${textClasses}`}>
        {safeName ? safeName.charAt(0) : '?'}
      </div>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={`Logo de ${safeName}`}
      className={`flex-shrink-0 object-contain bg-white border ${defaultClasses}`}
      onError={() => setHasError(true)}
    />
  );
};

const DonutChart = ({ data, total }: { data: any[]; total: number }) => {
  const radius = 15.9155; 
  const circumference = 2 * Math.PI * radius; 
  let offset = 25; 
  
  const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
        <circle cx="21" cy="21" r={radius} fill="transparent" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="5" />
        {data.map((slice, i) => {
          if(slice.percentage <= 0) return null;
          const dash = (slice.percentage / 100) * circumference;
          const gap = circumference - dash;
          const currentOffset = offset;
          offset -= slice.percentage; 

          return (
            <circle
              key={slice.id || i} cx="21" cy="21" r={radius} fill="transparent" stroke={slice.color}
              strokeWidth="5" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={currentOffset}
              className="transition-all duration-1000 ease-out"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 mb-0.5">TOTAL</span>
        <span className="text-xl font-bold tracking-tight">€{safeTotal.toFixed(2)}</span>
      </div>
    </div>
  )
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('periodica_theme') as 'light' | 'dark') || 'light';
  });

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [subscriptions, setSubscriptions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('periodica_data_v1');
      return saved ? JSON.parse(saved) : INITIAL_SUBS;
    } catch {
      return INITIAL_SUBS;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [cancelGuideModal, setCancelGuideModal] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', category: 'Ocio', billingCycle: 'Mensual', cost: '', currency: '€',
    nextBillingDate: new Date().toISOString().split('T')[0], isTrial: false, isShared: false, sharedMembers: 1
  });

  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
    setUser(currentUser);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

  useEffect(() => {
    localStorage.setItem('periodica_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('periodica_data_v1', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const calculateRealMonthly = (sub: any) => {
    const cost = parseFloat(sub.cost) || 0;
    const members = parseInt(sub.sharedMembers) || 1;
    const baseCost = cost / (sub.isShared && members > 0 ? members : 1);
    if (sub.billingCycle === 'Anual') return baseCost / 12;
    if (sub.billingCycle === 'Semestral') return baseCost / 6;
    return baseCost;
  };

  const metrics = useMemo(() => {
    let monthlyTotal = 0;
    let upcoming7DaysCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        monthlyTotal += calculateRealMonthly(sub);
        const nextDate = new Date(sub.nextBillingDate || new Date());
        if (!isNaN(nextDate.getTime())) {
          const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) upcoming7DaysCount++;
        }
      }
    });

    return { monthlyTotal, annualProjected: monthlyTotal * 12, upcoming7DaysCount };
  }, [subscriptions]);

  const appBreakdown = useMemo(() => {
    let total = 0;
    const activeSubs = subscriptions.filter(sub => sub.status === 'active');
    activeSubs.forEach(sub => total += calculateRealMonthly(sub));
    
    return activeSubs
      .map(sub => {
        const cost = calculateRealMonthly(sub);
        return {
          id: sub.id,
          name: sub.name,
          cost: cost,
          percentage: total > 0 ? (cost / total) * 100 : 0,
          color: getBrandColor(sub.name)
        };
      })
      .sort((a, b) => b.cost - a.cost);
  }, [subscriptions]);

  const dashboardUpcomingSubs = useMemo(() => {
    return [...subscriptions]
      .filter(sub => sub.nextBillingDate && !isNaN(new Date(sub.nextBillingDate).getTime()))
      .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions.filter(sub => {
      const subName = String(sub.name || '');
      const matchesSearch = subName.toLowerCase().includes(String(searchQuery).toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || sub.category === selectedCategory;
      let matchesStatus = true;
      if (selectedStatusFilter === 'active') matchesStatus = sub.status === 'active';
      if (selectedStatusFilter === 'paused') matchesStatus = sub.status === 'paused';
      if (selectedStatusFilter === 'trial') matchesStatus = sub.isTrial;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    result.sort((a, b) => new Date(a.nextBillingDate || 0).getTime() - new Date(b.nextBillingDate || 0).getTime());
    return result;
  }, [subscriptions, searchQuery, selectedCategory, selectedStatusFilter]);

  const displayGuides = useMemo(() => {
    const term = String(formData.name || '').trim().toLowerCase();
    if (!term) return Object.keys(CANCELLATION_GUIDES);
    return Object.keys(CANCELLATION_GUIDES).filter(service => 
      service.toLowerCase().startsWith(term)
    );
  }, [formData.name]);

  const getDaysRemaining = (dateString: string) => {
    if (!dateString) return 0;
    const targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatRelativeDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'Fecha inválida';
    const days = getDaysRemaining(dateString);
    if (days < 0) return `Hace ${Math.abs(days)} días`;
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  };

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingSub ? editingSub.id : Date.now().toString(),
      name: formData.name || 'Sin nombre', 
      category: formData.category, 
      billingCycle: formData.billingCycle,
      cost: parseFloat(formData.cost) || 0, 
      currency: formData.currency, 
      nextBillingDate: formData.nextBillingDate || new Date().toISOString().split('T')[0],
      isTrial: formData.isTrial, 
      isShared: formData.isShared,
      sharedMembers: formData.isShared ? (parseInt(String(formData.sharedMembers)) || 1) : 1,
      status: editingSub ? editingSub.status : 'active'
    };
    
    setSubscriptions(prev => editingSub ? prev.map(s => s.id === editingSub.id ? payload : s) : [payload, ...prev]);
    setIsFormOpen(false);
  };

  const handleDeleteSub = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
  };

  const toggleSubStatus = (id: string) => {
    setSubscriptions(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
    ));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calDays = getDaysInMonth(calYear, calMonth);
  const calFirstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const getSubsForCalendarDay = (day: number) => {
    return subscriptions.filter(sub => {
      if (sub.status !== 'active' || !sub.nextBillingDate) return false;
      const subDate = new Date(sub.nextBillingDate);
      if (isNaN(subDate.getTime())) return false;
      
      const startYearMonth = subDate.getFullYear() * 12 + subDate.getMonth();
      const currentYearMonth = calYear * 12 + calMonth;
      if (currentYearMonth < startYearMonth) return false;

      if (sub.billingCycle === 'Mensual') {
        let targetDay = subDate.getDate();
        if (targetDay > calDays) targetDay = calDays;
        return targetDay === day;
      }
      if (sub.billingCycle === 'Anual') {
        return subDate.getMonth() === calMonth && subDate.getDate() === day;
      }
      if (sub.billingCycle === 'Semestral') {
        const diff = currentYearMonth - startYearMonth;
        return diff % 6 === 0 && subDate.getDate() === day;
      }
      return false;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="flex items-center gap-3 font-medium text-sm">
          <PeriodicaLogo />
          <span>Cargando Periodica...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 flex items-center justify-center p-4 transition-colors`}>
        <style>{globalStyles}</style>
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <PeriodicaLogo />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido a Periodica</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Gestiona tus suscripciones e ingresos recurrentes de forma sencilla y centralizada.
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full h-11 px-4 inline-flex items-center justify-center gap-3 rounded-lg text-sm font-medium bg-zinc-950 text-zinc-50 hover:bg-zinc-950/90 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-50/90 shadow-md transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Iniciar sesión con Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800 overflow-x-hidden transition-colors duration-200`}>
      <style>{globalStyles}</style>

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PeriodicaLogo />
            <h1 className="text-xl font-bold tracking-tight">Periodica</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 p-0.5 hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-600 transition-all cursor-pointer"
                title="Menú de perfil"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 font-bold flex items-center justify-center text-xs uppercase">
                    {user.email ? user.email.charAt(0) : 'U'}
                  </div>
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 text-xs transition-all">
                  <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.displayName || 'Usuario'}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogin();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Cambiar de cuenta</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setEditingSub(null);
                setFormData({ name: '', category: 'Ocio', billingCycle: 'Mensual', cost: '', currency: '€', nextBillingDate: new Date().toISOString().split('T')[0], isTrial: false, isShared: false, sharedMembers: 2 });
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-zinc-950 text-zinc-50 hover:bg-zinc-950/90 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-50/90 h-9 px-4 space-x-2 shadow-sm transition-colors cursor-pointer"
            >
              <Icons.Plus />
              <span className="hidden sm:inline">Nueva suscripción</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center space-x-1 border-b border-zinc-200 dark:border-zinc-800 pb-px mb-8 overflow-x-auto hide-scrollbar transition-colors">
          {['dashboard', 'subscriptions', 'guides'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-10 px-4 inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors relative cursor-pointer ${
                activeTab === tab
                  ? 'text-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              {tab === 'dashboard' ? 'Dashboard' : tab === 'subscriptions' ? 'Suscripciones' : 'Guías de cancelación'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 dark:bg-zinc-50 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
                <div className="flex flex-row items-center justify-between space-y-0">
                  <h3 className="tracking-tight text-sm font-medium text-zinc-500 dark:text-zinc-400">Gasto mensual real</h3>
                  <Icons.Euro />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">€{metrics.monthlyTotal.toFixed(2)}</div>
                  <p className="text-xs text-zinc-500 mt-1">Ajustado por cuotas compartidas</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
                <div className="flex flex-row items-center justify-between space-y-0">
                  <h3 className="tracking-tight text-sm font-medium text-zinc-500 dark:text-zinc-400">Proyección anual</h3>
                  <Icons.Calendar />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">€{metrics.annualProjected.toFixed(2)}</div>
                  <p className="text-xs text-zinc-500 mt-1">Estimación a 12 meses</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
                <div className="flex flex-row items-center justify-between space-y-0">
                  <h3 className="tracking-tight text-sm font-medium text-zinc-500 dark:text-zinc-400">Cobros (Próx. 7 días)</h3>
                  <Icons.Alert />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">{metrics.upcoming7DaysCount}</div>
                  <p className="text-xs text-zinc-500 mt-1">Renovaciones inminentes activas</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col transition-colors">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-base font-semibold tracking-tight">Próximos cobros y Simulador</h3>
                  <p className="text-sm text-zinc-500 mt-1">Apaga suscripciones para ver tu ahorro en tiempo real.</p>
                </div>
                <div className="flex-1">
                  {dashboardUpcomingSubs.length > 0 ? (
                    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {dashboardUpcomingSubs.map(sub => {
                        const isSimulatedOff = sub.status === 'paused';
                        return (
                          <li key={sub.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <ServiceLogo name={sub.name} className={`w-10 h-10 rounded-md p-1 border-zinc-200 dark:border-zinc-800 shadow-sm transition-opacity ${isSimulatedOff ? 'opacity-50 grayscale' : ''}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-sm font-medium leading-none truncate ${isSimulatedOff ? 'text-zinc-400 line-through' : ''}`}>{sub.name}</p>
                                  {sub.isTrial && !isSimulatedOff && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">Prueba Gratis</span>
                                  )}
                                  {isSimulatedOff && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">Ahorro Simulado</span>
                                  )}
                                </div>
                                <div className="mt-1.5">
                                  <p className={`text-xs ${isSimulatedOff ? 'text-zinc-400' : (sub.isTrial ? 'text-red-500 font-medium' : 'text-zinc-500')}`}>
                                    {sub.isTrial && !isSimulatedOff ? `Fin de prueba: ${formatRelativeDate(sub.nextBillingDate)}` : formatRelativeDate(sub.nextBillingDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                              <div className="text-right">
                                <p className={`text-sm font-semibold ${isSimulatedOff ? 'text-zinc-400 line-through' : ''}`}>
                                  {sub.currency}{calculateRealMonthly(sub).toFixed(2)}
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-1">
                                  /{sub.billingCycle.toLowerCase()} {sub.isShared && <span className="font-medium text-zinc-600 dark:text-zinc-400">(tu parte)</span>}
                                </p>
                              </div>
                              <button
                                role="switch" aria-checked={!isSimulatedOff} onClick={() => toggleSubStatus(sub.id)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${!isSimulatedOff ? 'bg-zinc-950 dark:bg-zinc-50' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                              >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-950 shadow-sm ring-0 transition-transform ${!isSimulatedOff ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-sm text-zinc-500">No hay suscripciones activas para previsualizar.</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col transition-colors">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-base font-semibold tracking-tight">Distribución</h3>
                  <p className="text-sm text-zinc-500 mt-1">Gasto por suscripción activa.</p>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center items-center gap-6">
                  {appBreakdown.length > 0 ? (
                    <>
                      <DonutChart data={appBreakdown} total={metrics.monthlyTotal} />
                      <div className="w-full space-y-2 mt-2 max-h-48 overflow-y-auto pr-2 hide-scrollbar">
                        {appBreakdown.map((app, i) => (
                           <div key={app.id || i} className="flex items-center justify-between text-xs">
                             <div className="flex items-center gap-2">
                               <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: app.color }}></span>
                               <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{app.name}</span>
                             </div>
                             <span className="text-zinc-500">€{app.cost.toFixed(2)} ({app.percentage.toFixed(0)}%)</span>
                           </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-zinc-500">Activa suscripciones para ver el desglose exacto.</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm p-6 flex flex-col transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">Calendario de Cobros</h3>
                    <p className="text-sm text-zinc-500 mt-1">Tus compromisos activos mes a mes.</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1 transition-colors">
                    <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 transition-colors cursor-pointer"><Icons.ChevronLeft /></button>
                    <span className="text-sm font-semibold w-28 text-center text-zinc-900 dark:text-zinc-100">{monthNames[calMonth]} {calYear}</span>
                    <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))} className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 transition-colors cursor-pointer"><Icons.ChevronRight /></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {Array.from({ length: calFirstDay }).map((_, i) => (
                    <div key={`blank-${i}`} className="h-16 sm:h-20 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/20 border border-transparent" />
                  ))}
                  {Array.from({ length: calDays }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                    const daySubs = getSubsForCalendarDay(day);
                    
                    return (
                      <div key={`day-${day}`} className={`h-16 sm:h-20 rounded-lg border flex flex-col items-center p-1.5 transition-colors relative overflow-hidden ${isToday ? 'border-zinc-950 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-900/80 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                        <span className={`text-[11px] font-semibold ${isToday ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-500'}`}>{day}</span>
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                          {daySubs.map(sub => (
                            <ServiceLogo key={sub.id} name={sub.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-[4px] border-none shadow-sm shadow-zinc-200/50" />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Icons.Search /></div>
                <input type="text" placeholder="Buscar suscripción..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-9 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm transition-colors" />
              </div>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="flex h-10 w-full sm:w-auto min-w-[140px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm transition-colors cursor-pointer">
                <option value="Todas">Todas las categorías</option>
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="flex h-10 w-full sm:w-auto min-w-[140px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm transition-colors cursor-pointer">
                <option value="all">Todos los estados</option><option value="active">Activas</option><option value="paused">Pausadas</option><option value="trial">En Prueba Gratis</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubscriptions.map(sub => {
                const isPaused = sub.status === 'paused';
                const safeName = String(sub.name || '');
                const matchKey = Object.keys(CANCELLATION_GUIDES).find(k => k.toLowerCase() === safeName.toLowerCase());
                const guideInfo = matchKey ? CANCELLATION_GUIDES[matchKey as keyof typeof CANCELLATION_GUIDES] : null;
                
                return (
                  <div key={sub.id} className={`rounded-xl border bg-white p-6 transition-all dark:bg-zinc-900 flex flex-col justify-between h-full shadow-sm hover:shadow-md ${isPaused ? 'border-zinc-200/50 opacity-60 dark:border-zinc-800/50' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <ServiceLogo name={sub.name} />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-base tracking-tight truncate">{sub.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-medium dark:border-zinc-800 text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50">{sub.category}</span>
                              {sub.isTrial && !isPaused && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-200">Prueba Gratis</span>}
                            </div>
                          </div>
                        </div>
                        <button role="switch" aria-checked={!isPaused} onClick={() => toggleSubStatus(sub.id)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${!isPaused ? 'bg-zinc-950 dark:bg-zinc-50' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-950 shadow-sm ring-0 transition-transform ${!isPaused ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="space-y-1 mb-4">
                        <div className="text-2xl font-bold tracking-tight">{(sub.currency || '€')}{parseFloat(sub.cost || 0).toFixed(2)} <span className="text-sm font-normal text-zinc-500">/{String(sub.billingCycle || '').toLowerCase()}</span></div>
                        {sub.isShared && <div className="text-xs text-zinc-500 font-medium">Tu parte ({(parseInt(sub.sharedMembers) || 1)}p): {(sub.currency || '€')}{calculateRealMonthly(sub).toFixed(2)}/mes</div>}
                      </div>

                      {sub.isTrial && !isPaused ? (
                        <div className="space-y-2 text-sm text-zinc-500 border-t border-red-100 pt-3 mt-4 transition-colors">
                          <div className="flex justify-between items-center py-1">
                            <span className="flex items-center gap-2 text-xs font-medium text-red-600">
                              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span> Fin de prueba
                            </span>
                            <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 text-xs">{formatRelativeDate(sub.nextBillingDate)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/50 pt-3 mt-4 transition-colors">
                          <div className="flex justify-between items-center py-1">
                            <span>Próximo cobro</span>
                            <span className="font-medium text-zinc-950 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-xs transition-colors">{formatRelativeDate(sub.nextBillingDate)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
                      {guideInfo ? <button onClick={() => setCancelGuideModal(guideInfo)} className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors cursor-pointer">Cómo cancelar</button> : <span className="text-xs text-zinc-400">Sin guía</span>}
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingSub(sub); setFormData(sub); setIsFormOpen(true); }} className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"><Icons.Edit /></button>
                        <button onClick={() => setDeleteConfirmId(sub.id)} className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors cursor-pointer"><Icons.Trash /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'guides' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight">Guías de Cancelación</h2>
              <p className="text-sm text-zinc-500 mt-1">Instrucciones directas para dar de baja más de {Object.keys(CANCELLATION_GUIDES).length} servicios populares.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(CANCELLATION_GUIDES).sort().map(service => (
                <div key={service} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceLogo name={service} className="w-8 h-8 rounded p-0.5 border border-zinc-200 dark:border-zinc-800" />
                    <span className="font-medium text-sm truncate">{service}</span>
                  </div>
                  <button 
                    onClick={() => setCancelGuideModal(CANCELLATION_GUIDES[service as keyof typeof CANCELLATION_GUIDES])} 
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-md flex-shrink-0 cursor-pointer"
                  >
                    Ver guía
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-y-auto max-h-[90vh] transition-colors">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight">{editingSub ? 'Editar suscripción' : 'Nueva suscripción'}</h2>
              <p className="text-sm text-zinc-500">Rellena los detalles del servicio.</p>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-5">
              <div className="space-y-3 w-full">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Nombre del servicio</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors" placeholder="Ej. Netflix" />
                </div>
                <div className="flex overflow-x-auto overflow-y-hidden gap-2 pb-4 pt-2 snap-x scroll-smooth hide-scrollbar -mx-2 px-2">
                  {displayGuides.map(service => {
                    const guide = CANCELLATION_GUIDES[service as keyof typeof CANCELLATION_GUIDES];
                    const isSelected = String(formData.name).toLowerCase() === service.toLowerCase();
                    return (
                      <button key={service} type="button" onClick={() => setFormData({ ...formData, name: service })} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-1 snap-start flex-shrink-0 cursor-pointer ${isSelected ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950' : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300'}`}>
                        <img src={`https://www.google.com/s2/favicons?domain=${guide.domain}&sz=64`} alt="" className={`w-3.5 h-3.5 rounded-sm object-contain flex-shrink-0 ${isSelected ? 'bg-transparent' : 'bg-white'}`} onError={(e: any) => { e.target.style.display = 'none' }} />
                        <span className="text-[11px] font-medium">{service}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium leading-none">Categoría</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors cursor-pointer">{CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-sm font-medium leading-none">Ciclo</label><select value={formData.billingCycle} onChange={e => setFormData({ ...formData, billingCycle: e.target.value })} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors cursor-pointer"><option value="Mensual">Mensual</option><option value="Anual">Anual</option><option value="Semestral">Semestral</option></select></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2"><label className="text-sm font-medium leading-none">Coste Total</label><input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors" placeholder="0.00" /></div>
                <div className="space-y-2"><label className="text-sm font-medium leading-none">Divisa</label><select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors cursor-pointer"><option value="€">€ (EUR)</option><option value="$">$ (USD)</option></select></div>
              </div>

              <div className="space-y-2"><label className="text-sm font-medium leading-none">Fecha de próximo cobro</label><input required type="date" value={formData.nextBillingDate} onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value })} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors" /></div>

              <div className="space-y-4 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" checked={formData.isTrial} onChange={e => setFormData({ ...formData, isTrial: e.target.checked })} className="h-4 w-4 rounded-sm border-zinc-200 accent-zinc-950 dark:border-zinc-800 dark:accent-zinc-50" /><span className="text-sm font-medium leading-none">Es un periodo de prueba gratis</span></label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" checked={formData.isShared} onChange={e => setFormData({ ...formData, isShared: e.target.checked })} className="h-4 w-4 rounded-sm border-zinc-200 accent-zinc-950 dark:border-zinc-800 dark:accent-zinc-50" /><span className="text-sm font-medium leading-none">Es una suscripción compartida</span></label>
                  {formData.isShared && (
                    <div className="pl-7 space-y-2"><label className="text-xs text-zinc-500">¿Entre cuántas personas se divide?</label><input type="number" min="1" max="10" value={formData.sharedMembers} onChange={e => setFormData({ ...formData, sharedMembers: Number(e.target.value) })} className="flex h-9 w-24 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 shadow-sm transition-colors" /></div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
                <button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer">Cancelar</button>
                <button type="submit" className="h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-zinc-950 text-zinc-50 hover:bg-zinc-950/90 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-50/90 transition-colors shadow-sm cursor-pointer">{editingSub ? 'Guardar cambios' : 'Añadir suscripción'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 transition-colors">
            <h3 className="text-lg font-semibold tracking-tight mb-4">Guía de Cancelación</h3>
            <ul className="space-y-4 mb-8 text-sm text-zinc-500">
              {cancelGuideModal.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3"><span className="font-medium text-zinc-950 dark:text-zinc-50">{i + 1}.</span><span className="leading-relaxed">{step}</span></li>
              ))}
            </ul>
            <div className="flex justify-between items-center">
              <a href={cancelGuideModal.url} target="_blank" rel="noreferrer" className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors shadow-sm">Ir al sitio oficial</a>
              <button onClick={() => setCancelGuideModal(null)} className="h-9 px-4 text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 text-center transition-colors">
            <h3 className="text-lg font-semibold tracking-tight mb-2">¿Eliminar suscripción?</h3>
            <p className="text-sm text-zinc-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="h-10 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors w-full shadow-sm cursor-pointer">Cancelar</button>
              <button onClick={() => handleDeleteSub(deleteConfirmId)} className="h-10 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-950 text-zinc-50 hover:bg-zinc-950/90 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-50/90 transition-colors w-full shadow-sm cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}