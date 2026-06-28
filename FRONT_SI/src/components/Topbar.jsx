import { useState, useEffect } from 'react';
import { Menu, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

export default function Topbar({ collapsed, onToggleMobile }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onToggleMobile}>
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <div className="topbar-datetime">
          <span className="topbar-date">
            <Calendar size={14} />
            {formatDate(time)}
          </span>
          <span className="topbar-time">
            <Clock size={14} />
            {formatTime(time)}
          </span>
        </div>
        <div className="topbar-user">
          <span className="topbar-greeting">
            Hola, <strong>{user?.nombre || 'Usuario'}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
