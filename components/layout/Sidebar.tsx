import Link from 'next/link';
import { LayoutDashboard, Wallet, ShoppingBag, Layers, Lightbulb, Settings, CalendarRange } from 'lucide-react';

const menuItems = [
  { name: 'Genel Bakış', icon: LayoutDashboard, href: '/' },
  { name: 'Gelir & Gider', icon: Wallet, href: '/transactions' },
  { name: 'Mağazalar', icon: ShoppingBag, href: '/stores' },
  { name: 'İş Modelleri', icon: Layers, href: '/models' },
  { name: 'Sabit Giderler', icon: CalendarRange, href: '/subscriptions' },
  { name: 'Hedefler & Fikirler', icon: Lightbulb, href: '/ideas' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
          EtsyManager
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Ultimate Tracking</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
          Ayarlar
        </button>
      </div>
    </aside>
  );
}

