import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  PlusCircle,
  PackageSearch,
  ShieldCheck,
  Zap,
  MapPin,
  ArrowRight,
  BellRing,
  Sparkles,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Campus Lost & Found System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Recover Lost Campus Items with{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Smart Matching
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The centralized, verified network for university students, staff, and campus security to report, discover, and securely claim lost possessions.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/report-lost"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-lg shadow-rose-500/25 transition transform hover:-translate-y-0.5 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>I Lost Something</span>
          </Link>
          <Link
            to="/report-found"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25 transition transform hover:-translate-y-0.5 text-sm"
          >
            <PackageSearch className="w-4 h-4" />
            <span>I Found an Item</span>
          </Link>
          <Link
            to="/find"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold transition text-sm"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Find Your Item</span>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Why the Smart Campus System?</h2>
          <p className="text-sm text-slate-400 mt-2">Designed specifically for university grounds, dormitories, labs, and libraries.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Automated Smart Matching</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our matching engine continuously compares lost reports against newly turned-in items by location, timestamp, and item metadata.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Verified Campus Identity</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every participant registers with student/faculty email credentials, preventing false claims and ensuring trusted item handoffs.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
              <BellRing className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Instant Alerts & Tracking</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Get notified immediately the moment someone logs a matching item or campus security verifies a deposit box handoff.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Step by Step */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-100">3 Steps to Campus Item Recovery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold mx-auto flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Submit Report</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe the item, select the campus location (e.g. Science Block, Cafeteria), and upload reference pictures.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold mx-auto flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Match Detection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our algorithm triggers alerts to both the owner and finder once similarity criteria are met.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold mx-auto flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Verified Safe Handoff</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm ownership proof, submit a claim, and collect your item at designated campus help desks or verified stations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to find or return an item?</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-8">
            Join your fellow students and staff in maintaining a connected and helpful campus community.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/30"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
