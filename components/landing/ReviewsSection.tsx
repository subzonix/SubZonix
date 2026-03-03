"use client";

import { motion } from "framer-motion";
import { FaStar, FaQuoteLeft } from "react-icons/fa6";

const reviewsRow1 = [
    {
        name: "Hassan Raza",
        role: "Netflix Reseller · Lahore",
        flag: "🇵🇰",
        avatar: "H",
        rating: 5,
        color: "from-indigo-500 to-blue-600",
        text: "SubZonix changed how I run my business. My renewal rate went up 40% in the first month alone!",
    },
    {
        name: "Faisal Al-Rashid",
        flag: "🇸🇦",
        role: "Streaming Seller · Riyadh",
        avatar: "F",
        rating: 5,
        color: "from-violet-500 to-purple-600",
        text: "The profit tracking alone is worth it. I finally know exactly how much I make on every single tool.",
    },
    {
        name: "Usman Tariq",
        flag: "🇵🇰",
        role: "Digital Reseller · Karachi",
        avatar: "U",
        rating: 5,
        color: "from-green-500 to-emerald-600",
        text: "Zero missed renewals since I switched. Customers compliment me on how professional I've become!",
    },
];

const reviewsRow2 = [
    {
        name: "Ahmed Khalil",
        flag: "🇦🇪",
        role: "Sub Reseller · Dubai",
        avatar: "A",
        rating: 5,
        color: "from-amber-500 to-orange-600",
        text: "Added all my inventory in 20 minutes and started tracking sales the same day. The support is also top-notch.",
    },
    {
        name: "Bilal Sheikh",
        flag: "🇬🇧",
        role: "Streaming Reseller · Birmingham",
        avatar: "B",
        rating: 5,
        color: "from-rose-500 to-pink-600",
        text: "Managing 200+ customers was a nightmare before SubZonix. Now I have full visibility at all times.",
    },
    {
        name: "Zain ul Abideen",
        flag: "🇵🇰",
        role: "Subscription Seller · Islamabad",
        avatar: "Z",
        rating: 5,
        color: "from-cyan-500 to-teal-600",
        text: "The Sub Mart feature is brilliant. SubZonix is the only tool I need to run my entire business.",
    },
];

function ReviewCard({ r }: { r: any }) {
    return (
        <div className="shrink-0 w-[280px] sm:w-[320px] bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-[2rem] p-6 flex flex-col gap-4 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-indigo-500/30 transition-all duration-500 group">
            <div className="flex justify-between items-start">
                <FaQuoteLeft className="text-slate-200 dark:text-white/5 text-2xl group-hover:text-indigo-500/20 transition-colors" />
                <div className="flex gap-1 bg-amber-500/5 px-2 py-1 rounded-full border border-amber-500/10">
                    {[...Array(r.rating)].map((_, j) => (
                        <FaStar key={j} className="text-amber-400 text-[10px]" />
                    ))}
                </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                &ldquo;{r.text}&rdquo;
            </p>

            <div className="flex items-center gap-4 pt-5 border-t border-slate-100 dark:border-white/5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg`}>
                    {r.avatar}
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-base">{r.flag}</span>
                        <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{r.name}</p>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-500/80 dark:text-indigo-400/80 mt-1 uppercase tracking-wider">{r.role}</p>
                </div>
            </div>
        </div>
    );
}

export default function ReviewsSection() {
    // Duplicate for seamless loop
    const track1 = [...reviewsRow1, ...reviewsRow1, ...reviewsRow1];
    const track2 = [...reviewsRow2, ...reviewsRow2, ...reviewsRow2];

    return (
        <section className="py-16 bg-white dark:bg-background relative overflow-hidden transition-colors duration-500">
            {/* Premium Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-white dark:from-background to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-white dark:from-background to-transparent z-10" />

            <div className="max-w-7xl mx-auto px-6 mb-16 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-500/10 shadow-sm">
                        <FaStar className="text-amber-500" /> Reseller Reviews
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-[1.1] tracking-tight">
                        Powering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">thousands</span><br />
                        of subscription businesses
                    </h2>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className="text-amber-400 text-base" />
                            ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                            <span className="text-slate-900 dark:text-white">5.0 Rating</span> from 500+ global resellers
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Scrolling tracks */}
            <div className="flex flex-col gap-4">
                {/* Row 1 - Left to Right */}
                <div className="flex overflow-hidden">
                    <div
                        className="flex gap-6 py-2 px-4"
                        style={{
                            animation: "reviewMarquee 40s linear infinite",
                            width: "max-content",
                        }}
                    >
                        {track1.map((r, i) => (
                            <ReviewCard key={i} r={r} />
                        ))}
                    </div>
                </div>

                {/* Row 2 - Right to Left */}
                <div className="flex overflow-hidden">
                    <div
                        className="flex gap-6 py-2 px-4"
                        style={{
                            animation: "reviewMarqueeReverse 45s linear infinite",
                            width: "max-content",
                        }}
                    >
                        {track2.map((r, i) => (
                            <ReviewCard key={i} r={r} />
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes reviewMarquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-33.33%); }
                }
                @keyframes reviewMarqueeReverse {
                    from { transform: translateX(-33.33%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </section>
    );
}
