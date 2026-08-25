import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, ShieldAlert, Tag, MapPin, Calendar } from 'lucide-react';
import { itemService } from '../../services/itemService';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UIComponents';

export const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await itemService.getMatches();
        setMatches(res.matches || []);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI & Rule-Based Match Engine</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Smart Match Detection</h2>
        <p className="text-xs text-slate-400 mt-1">
          Automated comparison between your lost items and items turned into campus custody.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Computing smart matches across campus repository..." />
      ) : matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match, idx) => (
            <div
              key={match.id || idx}
              className="rounded-3xl border border-blue-500/30 bg-slate-900/80 backdrop-blur-xl p-6 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                    {match.similarity_score || 85}% Match Similarity
                  </div>
                  <span className="text-xs text-slate-400">
                    Category: <strong className="text-slate-200">{match.category || 'Electronics'}</strong>
                  </span>
                </div>

                <Link
                  to={`/items/${match.found_item_id || match.found_item?._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition self-start"
                >
                  <span>Review & Claim Item</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Lost Item vs Found Item Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Lost report */}
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <Badge variant="danger">YOUR LOST REPORT</Badge>
                  <h4 className="font-bold text-slate-100 text-sm">
                    {match.lost_item?.title || 'Reported Lost Item'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {match.lost_item?.description || 'No description'}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-2 border-t border-rose-500/10">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{match.lost_item?.location || 'Campus'}</span>
                  </div>
                </div>

                {/* Found match */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <Badge variant="success">DISCOVERED CANDIDATE</Badge>
                  <h4 className="font-bold text-slate-100 text-sm">
                    {match.found_item?.title || 'Reported Found Item'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {match.found_item?.description || 'No description'}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-2 border-t border-emerald-500/10">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{match.found_item?.location || 'Campus'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No smart matches detected yet"
          description="Our algorithm checks every new lost or found submission continuously. You will be notified the moment a match score exceeds the threshold."
          action={
            <Link
              to="/browse"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition inline-flex items-center gap-1.5"
            >
              <span>Browse All Open Listings</span>
            </Link>
          }
        />
      )}
    </div>
  );
};

export default MatchesPage;
