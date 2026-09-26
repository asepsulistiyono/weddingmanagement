import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Copy, Check, CreditCard, MapPin } from 'lucide-react';
import type { WeddingSettings } from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface DigitalGiftSectionProps {
  settings: WeddingSettings | null;
}

export const DigitalGiftSection: React.FC<DigitalGiftSectionProps> = ({ settings }) => {
  const { t } = useLanguage();
  const bankAccounts = settings?.bankAccounts || [];
  const giftAddress = settings?.giftAddress;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <section id="gift-section" className="py-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
          {t.gift.tag}
        </span>
        <h2 className="font-serif-wedding text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 mt-2">
          {t.gift.title}
        </h2>
        <p className="text-stone-500 text-sm max-w-md mx-auto mt-2">
          {t.gift.subtitle}
        </p>
      </div>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {bankAccounts.map((account) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-md relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-lg tracking-wider">
                  {account.bank}
                </span>
                <CreditCard className="w-5 h-5 text-amber-700" />
              </div>

              <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-1">
                {t.gift.accountNumber}
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-800 tracking-wider mb-2">
                {account.accountNumber}
              </p>

              <p className="text-xs text-stone-500">
                {t.gift.recipientName}:{' '}
                <strong className="text-stone-800 font-semibold">{account.accountName}</strong>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => handleCopy(account.accountNumber, account.id)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                {copiedId === account.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{t.gift.accountCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-700" />
                    <span>{t.gift.copyAccount}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Physical Gift Delivery Address */}
      {giftAddress && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center flex-shrink-0 mt-1">
              <Gift className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  {t.gift.physicalGiftAddress}
                </h4>
              </div>
              <p className="text-sm font-semibold text-stone-800">
                {t.gift.recipient}: {giftAddress.recipient} ({giftAddress.phone})
              </p>
              <p className="text-xs text-stone-600 mt-1 max-w-lg leading-relaxed">
                {giftAddress.address}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(`${giftAddress.recipient} (${giftAddress.phone})\n${giftAddress.address}`, 'addr')}
            className="sm:self-center flex-shrink-0 inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold tracking-wide transition-all cursor-pointer"
          >
            {copiedId === 'addr' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">{t.gift.addressCopied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.gift.copyAddress}</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </section>
  );
};
