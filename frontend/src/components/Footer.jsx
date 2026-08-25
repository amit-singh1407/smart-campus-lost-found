import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-auto text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-100 text-base">Smart Campus</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An intelligent, secure recovery network connecting students, faculty, and campus security to recover lost belongings quickly.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Campus ID Verified Protocol</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/browse" className="hover:text-blue-400 transition">Browse Lost & Found</Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-blue-400 transition">Report Lost Item</Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-blue-400 transition">Turn in Found Item</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-blue-400 transition">Student Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Safe Return Info */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-4">Campus Safety</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">Main Campus Security Desk (Building A)</span>
              </li>
              <li>
                <span className="text-slate-400">Library Help Center (Level 2)</span>
              </li>
              <li>
                <span className="text-slate-400">Student Union Lost Handoff Station</span>
              </li>
              <li>
                <span className="text-slate-400">Emergency Helpline: ext 4499</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Administrative */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase mb-4">Administration</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin/login" className="hover:text-amber-400 transition flex items-center gap-1">
                  Staff & Security Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition">Student Sign In</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400 transition">Register Campus Account</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Smart Campus Lost & Found System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for connected campus recovery
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
