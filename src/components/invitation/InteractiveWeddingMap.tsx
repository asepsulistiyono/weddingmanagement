import React, { useState, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Layers, 
  Check, 
  Copy,
  Sparkles
} from 'lucide-react';
import type { WeddingEvent } from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface InteractiveWeddingMapProps {
  events: WeddingEvent[];
}

export const InteractiveWeddingMap: React.FC<InteractiveWeddingMapProps> = ({ events }) => {
  const { t, lang } = useLanguage();
  // Coordinates for wedding venues
  // Event 1: Masjid Agung Al-Ikhlas (Akad Nikah)
  // Event 2: Hotel Mulia Senayan (Resepsi Pernikahan)
  const defaultCenter = { lat: -6.2450, lng: 106.7985 }; // Midpoint between Senayan & Cipete
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || 'akad');
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(12);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC_Py9u6so1dfiyki1d80azUayBXifP6Cc';

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  const getEventName = (name: string) => {
    if (lang === 'en') {
      if (name.toLowerCase().includes('akad')) return 'Holy Matrimony';
      if (name.toLowerCase().includes('resepsi')) return 'Wedding Reception';
    }
    return name;
  };

  // Helper to get coordinates
  const getCoordinates = (event: WeddingEvent) => {
    if (event.lat && event.lng) {
      return { lat: event.lat, lng: event.lng };
    }
    if (event.id === 'akad' || event.name.toLowerCase().includes('akad')) {
      return { lat: -6.27382, lng: 106.79724 };
    }
    return { lat: -6.21633, lng: 106.79971 };
  };

  const handleSelectEvent = useCallback((event: WeddingEvent) => {
    setSelectedEventId(event.id);
    setActiveInfoWindow(event.id);
    setMapZoom(15);
  }, []);

  const handleCopyAddress = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddressId(id);
    setTimeout(() => setCopiedAddressId(null), 2500);
  };

  return (
    <div id="interactive-map-container" className="bg-white rounded-3xl border border-stone-200/90 shadow-lg overflow-hidden mt-12">
      {/* Header bar */}
      <div className="p-5 sm:p-7 bg-stone-900 text-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.events.mapHeader}</span>
          </div>
          <h3 className="font-serif-wedding text-2xl sm:text-3xl font-bold mt-1 text-white">
            {t.events.mapTitle}
          </h3>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
            {t.events.mapDesc}
          </p>
        </div>

        {/* Quick venue switch buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;
            return (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-300/40'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-stone-950' : 'text-amber-400'}`} />
                <span>{getEventName(event.name)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map display container */}
      <div className="relative w-full h-[400px] sm:h-[480px] bg-stone-100">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={selectedEvent ? getCoordinates(selectedEvent) : defaultCenter}
            defaultZoom={mapZoom}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            {events.map((event) => {
              const pos = getCoordinates(event);
              const isSelected = selectedEventId === event.id;
              const isAkad = event.id === 'akad' || event.name.toLowerCase().includes('akad');

              return (
                <React.Fragment key={event.id}>
                  <AdvancedMarker
                    position={pos}
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setActiveInfoWindow(event.id);
                    }}
                    title={`${getEventName(event.name)} - ${event.location}`}
                  >
                    <Pin
                      background={isAkad ? '#047857' : '#b45309'}
                      glyphColor="#ffffff"
                      borderColor="#ffffff"
                      scale={isSelected ? 1.25 : 1.05}
                    />
                  </AdvancedMarker>

                  {/* InfoWindow on Marker Click */}
                  {activeInfoWindow === event.id && (
                    <InfoWindow
                      position={pos}
                      onCloseClick={() => setActiveInfoWindow(null)}
                      headerContent={
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5 pr-2">
                          <MapPin className={`w-4 h-4 ${isAkad ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span>{getEventName(event.name)}</span>
                        </div>
                      }
                    >
                      <div className="p-1 max-w-[260px] text-stone-700 text-xs space-y-2">
                        <p className="font-semibold text-stone-900 text-sm">
                          {event.location}
                        </p>
                        <p className="text-stone-500 leading-snug">
                          {event.address}
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-stone-200 text-stone-600">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{event.time}</span>
                        </div>
                        <div className="pt-2 flex flex-col gap-1.5">
                          <a
                            href={event.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t.events.routeGuide}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}
          </Map>
        </APIProvider>

        {/* Floating Venue Overview Overlay Card */}
        {selectedEvent && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xl z-10 pointer-events-auto">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-1">
                  {getEventName(selectedEvent.name)}
                </span>
                <h4 className="font-bold text-stone-900 text-base">
                  {selectedEvent.location}
                </h4>
              </div>
              <button
                onClick={() => handleCopyAddress(selectedEvent.id, `${selectedEvent.location}, ${selectedEvent.address}`)}
                title={t.events.copyAddress}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                {copiedAddressId === selectedEvent.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] text-emerald-700">{t.events.addressCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{t.events.copyAddress}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              {selectedEvent.address}
            </p>

            <div className="grid grid-cols-2 gap-2 py-2 border-y border-stone-100 text-xs text-stone-700 mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Oct 24, 2026' : selectedEvent.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span className="truncate">{selectedEvent.time}</span>
              </div>
            </div>

            <a
              href={selectedEvent.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.events.routeGuide}</span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </a>
          </div>
        )}
      </div>

      {/* Footer guide for guests */}
      <div className="px-6 py-4 bg-stone-50 border-t border-stone-200/70 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <strong className="text-stone-700">{lang === 'en' ? 'Green Pin:' : 'Penanda Hijau:'}</strong> {lang === 'en' ? 'Holy Matrimony' : 'Akad Nikah'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <strong className="text-stone-700">{lang === 'en' ? 'Gold Pin:' : 'Penanda Emas:'}</strong> {lang === 'en' ? 'Wedding Reception' : 'Resepsi Pernikahan'}
          </span>
        </div>
        <p className="text-[11px] text-stone-400">
          {lang === 'en' ? 'Integrated Google Maps Platform • Direct directions available' : 'Google Maps Platform terintegrasi • Tersedia petunjuk arah langsung'}
        </p>
      </div>
    </div>
  );
};
