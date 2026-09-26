import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import type { WeddingSettings } from '../../types.ts';
import { InteractiveWeddingMap } from './InteractiveWeddingMap.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface EventsSectionProps {
  settings: WeddingSettings | null;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ settings }) => {
  const { t, lang } = useLanguage();
  const events = settings?.events || [];

  const getEventName = (name: string, index?: number) => {
    if (index === 0 && settings?.invitationFormat?.ceremonyName) {
      if (lang === 'en') return 'Holy Matrimony / Sacred Ceremony';
      return settings.invitationFormat.ceremonyName;
    }
    if (index === 1 && settings?.invitationFormat?.receptionName) {
      if (lang === 'en') return 'Wedding Reception';
      return settings.invitationFormat.receptionName;
    }
    if (lang === 'en') {
      if (name.toLowerCase().includes('akad') || name.toLowerCase().includes('pemberkatan') || name.toLowerCase().includes('pawiwahan') || name.toLowerCase().includes('li yuan')) return 'Holy Matrimony / Sacred Ceremony';
      if (name.toLowerCase().includes('resepsi') || name.toLowerCase().includes('walimatul')) return 'Wedding Reception';
    }
    return name;
  };

  const getEventDate = (dateStr: string) => {
    if (lang === 'en') {
      return 'Saturday, October 24, 2026';
    }
    return dateStr;
  };

  return (
    <section id="events-section" className="py-20 px-4 bg-[#F5EFE6]/60 border-y border-stone-200/60">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
            {t.events.eyebrow}
          </span>
          <h2 className="font-serif-wedding text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 mt-2">
            {t.events.title}
          </h2>
          <p className="text-stone-500 text-sm max-w-md mx-auto mt-2">
            {t.events.subtitle}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          {events.map((event, index) => {
            const eventDisplayName = getEventName(event.name, index);
            return (
              <motion.div
                key={event.id || index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.2 }}
                className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-md relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow"
              >
                {/* Decorative top ribbon */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-100">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    {eventDisplayName}
                  </span>
                  <span className="text-xs font-medium text-stone-400">
                    {lang === 'en' ? 'Sat, Oct 24, 2026' : 'Sabtu, 24 Okt 2026'}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif-wedding text-2xl sm:text-3xl font-bold text-stone-900 mb-6">
                    {eventDisplayName}
                  </h3>

                  {/* Details */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-medium">{t.events.dayDate}</p>
                        <p className="text-sm font-semibold text-stone-800">{getEventDate(event.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-medium">{t.events.time}</p>
                        <p className="text-sm font-semibold text-stone-800">{event.time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-medium">{t.events.venue}</p>
                        <p className="text-sm font-semibold text-stone-800">{event.location}</p>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{event.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-6 border-t border-stone-100">
                  <a
                    href={event.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{t.events.openMaps}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-1" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Google Map with venue markers */}
        <InteractiveWeddingMap events={events} />

        {/* Dresscode info note */}
        <div className="mt-12 text-center text-xs text-stone-500 bg-white/60 backdrop-blur-sm border border-stone-200/60 rounded-2xl py-4 px-6 max-w-xl mx-auto">
          <p>
            <span className="font-semibold text-stone-700">{t.events.dresscode}</span> {t.events.dresscodeVal}
          </p>
        </div>
      </div>
    </section>
  );
};
