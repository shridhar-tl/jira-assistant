import { useParams } from 'react-router-dom';

import { appVersionNo } from '@/constants/build-info';
import { WebSiteUrl } from '@/constants/urls';

import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';

export default function JoinPoker() {
    const { roomId } = useParams();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex flex-col">
            {/* Animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-15 animate-pulse" />
                <div
                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-15 animate-pulse"
                    style={{ animationDelay: '2s' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600 rounded-full blur-3xl opacity-10 animate-pulse"
                    style={{ animationDelay: '4s' }}
                />
            </div>

            <div className="relative z-10 flex flex-col flex-1 px-4 py-8 md:py-12">
                {/* Header */}
                <div className="text-center mb-10 md:mb-14">
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                            <img src="/assets/icon_48.png" alt="Jira Assistant" className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                        Planning <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-indigo-400">Poker</span>
                    </h1>
                    <p className="text-purple-300/80 text-sm md:text-base font-medium max-w-md mx-auto">
                        Estimate your Jira stories collaboratively in real-time with your team
                    </p>

                    {/* Feature badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                        {[
                            { icon: 'fa fa-bolt', label: 'Real-time sync' },
                            { icon: 'fa fa-infinity', label: 'Fibonacci & T-Shirt' },
                            { icon: 'fa fa-jira', label: 'Jira integration' },
                            { icon: 'fa fa-gift', label: 'Free to use' },
                        ].map((feat) => (
                            <span
                                key={feat.label}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-medium backdrop-blur-sm"
                            >
                                <span className={`${feat.icon} text-purple-400`} />
                                {feat.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="flex-1 flex items-start justify-center">
                    <div className={`w-full ${roomId ? 'max-w-md' : 'max-w-5xl'}`}>
                        {roomId ? (
                            <JoinRoom />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CreateRoom />
                                <JoinRoom />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center">
                    <p className="flex flex-wrap justify-center items-center gap-2 mb-2 text-purple-400/60 text-xs">
                        <span>© 2016-{new Date().getFullYear()}</span>
                        <a
                            href={WebSiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-200 transition-colors underline underline-offset-2"
                        >
                            Jira Assistant
                        </a>
                        <span>v{appVersionNo}</span>
                    </p>
                    <p className="max-w-2xl mx-auto px-4 text-xs text-purple-500/40 leading-relaxed">
                        Your name, Jira issue keys, estimates, and summaries are temporarily cached to enable real-time collaboration. All
                        data is automatically cleared when the session ends.
                    </p>
                </footer>
            </div>
        </div>
    );
}
