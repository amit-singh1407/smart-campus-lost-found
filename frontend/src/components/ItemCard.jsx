import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ArrowUpRight } from 'lucide-react';
import { Badge } from './UIComponents';

export const ItemCard = ({ item }) => {
  const isLost = item.type === 'lost';
  const imageUrl = item.image_url || item.imageUrl || item.found_image || item.found_image_url || item.image;

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title || 'Item photo'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-gradient-to-br from-slate-900 to-slate-950">
            <Tag className="w-10 h-10 opacity-30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant={isLost ? 'danger' : 'success'}>
            {isLost ? 'LOST' : 'FOUND'}
          </Badge>
          {item.category && (
            <Badge variant="default" className="bg-slate-900/80 backdrop-blur-md">
              {item.category}
            </Badge>
          )}
          {item.storage_locker && (
            <Badge variant="primary" className="bg-blue-950/80 border-blue-500/30 text-[10px]">
              📦 {item.storage_locker}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {item.status && item.status !== 'open' && (
            <Badge variant="purple" className="capitalize">
              {item.status}
            </Badge>
          )}
          {item.is_high_value && (
            <Badge variant="warning" className="text-[10px]">
              💎 High Value
            </Badge>
          )}
        </div>

      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-slate-100 text-lg group-hover:text-blue-400 transition-colors line-clamp-1">
            {item.title}
          </h4>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {item.description || 'No additional description provided.'}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[55%]">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{item.location || 'Campus'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 flex items-center justify-end">
          <Link
            to={`/items/${item._id || item.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 group/link"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
