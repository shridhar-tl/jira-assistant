import { useCallback, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import { useLocation } from 'react-router';

import type AnalyticsService from '@/services/analytics-service';

import { inject } from '@services';

import { useEscapeLayer } from '@components';

import { isAppBuild, isExtnBuild } from '../constants/build-info';
import { EventCategory } from '../constants/settings';
import { JAWebRootUrl } from '../constants/urls';

interface VideoInfo {
    videoId: string;
    module: string;
    routes: string[];
}

const videoList: VideoInfo[] = [
    { videoId: '8w3r8wLpmpM', module: 'Quick tour of key features', routes: [] },
    { videoId: 'SE9V1wbMXfQ', module: 'High level overview', routes: [] },
    { videoId: 'faKqXtHmMt4', module: 'Dashboard', routes: ['dashboard'] },
    { videoId: 'v5OZ1KXUJdQ', module: 'Worklog Calendar', routes: ['calendar'] },
    { videoId: 'Ihz4Dm5oiRk', module: 'Worklog Timer', routes: [] },
    { videoId: 'vPfnd45vKjM', module: 'Bulk import - Worklogs and Issues', routes: ['import/worklog', 'import/issue'] },
    { videoId: '-ywPqpcy5BI', module: 'Worklog report', routes: ['reports/worklog'] },
    { videoId: '7Q2oN5kmKMQ', module: 'Time in status and Workload heatmap', routes: ['reports/time-in-status', 'reports/workload-heatmap'] },
    { videoId: 'aqEaEAG0r-w', module: 'Pivot report', routes: ['reports/pivot'] },
    { videoId: '_4EmxQeA24I', module: 'Report builder', routes: ['reports/builder'] },
    { videoId: '07YnBCD_uW4', module: 'Sprint planner', routes: ['planning/sprint-planner'] },
    { videoId: 'rlX667Ns5E0', module: 'Program planner', routes: ['planning/pi-planner'] },
];

interface YoutubeVideoProps {
    onHide?: () => void;
}

const useRelayPlayer = isExtnBuild || isAppBuild;
const playerPermissions = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

function getVideoUrl(video: VideoInfo, analytics: Pick<AnalyticsService, 'trackEvent'>, event?: string): string {
    analytics.trackEvent(event || 'Video help viewed', EventCategory.HeaderActions, `Video Help: ${video.module}`);

    if (useRelayPlayer) {
        return `${JAWebRootUrl}/video-player.html?${new URLSearchParams({ v: video.videoId }).toString()}`;
    }

    return `https://www.youtube.com/embed/${video.videoId}?${new URLSearchParams({ rel: '0', autoplay: '1', cc_load_policy: '1' }).toString()}`;
}

function findVideoIndex(pathname: string): number {
    const route = pathname.replace(/^\/[^/]+\/?/, '');
    const found = videoList.findIndex((video) => video.routes.some((r) => route === r || route.startsWith(`${r}/`)));
    return found >= 0 ? found : 0;
}

export default function YoutubeVideo({ onHide }: YoutubeVideoProps) {
    const { $analytics } = inject('AnalyticsService');
    const overlayRef = useRef<HTMLDivElement>(null);

    const { pathname } = useLocation();

    const [index, setIndex] = useState<number>(() => findVideoIndex(pathname));
    const [url, setUrl] = useState<string>(() => getVideoUrl(videoList[index], $analytics));
    const [showList, setShowList] = useState(false);

    useEscapeLayer(true, onHide);

    const playAt = useCallback(
        (newIndex: number, event?: string) => {
            const newUrl = getVideoUrl(videoList[newIndex], $analytics, event);
            setIndex(newIndex);
            setUrl(newUrl);
            setShowList(false);
        },
        [$analytics],
    );

    const playPrev = useCallback(() => {
        if (index > 0) playAt(index - 1, 'Video view previous');
    }, [index, playAt]);

    const playNext = useCallback(() => {
        if (index + 1 < videoList.length) playAt(index + 1, 'Video view next');
    }, [index, playAt]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === overlayRef.current) {
                onHide?.();
            }
        },
        [onHide],
    );

    const hasPrev = index > 0;
    const hasNext = index + 1 < videoList.length;
    const currentVideo = videoList[index];

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Help videos"
                className="relative flex flex-col w-[95vw] h-[92vh] max-w-400 rounded-xl overflow-hidden shadow-2xl bg-[#0f0f0f]"
            >
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-red-500 text-xl leading-none">
                            <i className="fa-brands fa-youtube" />
                        </span>
                        <span className="text-white font-medium text-sm truncate">{currentVideo?.module}</span>
                        <span className="text-white/40 text-xs shrink-0">
                            {index + 1} / {videoList.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Video list toggle */}
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                            onClick={() => setShowList((v) => !v)}
                            title="Browse all videos"
                        >
                            <i className="fa fa-list text-[11px]" />
                            <span className="hidden sm:inline">All Videos</span>
                        </button>

                        {/* Close */}
                        <button
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            onClick={onHide}
                            title="Close"
                        >
                            <i className="fa fa-times" />
                        </button>
                    </div>
                </div>

                {/* Main content area */}
                <div className="relative flex flex-1 min-h-0">
                    {/* Video iframe */}
                    <div className="flex-1 relative bg-black min-w-0">
                        {url && (
                            <iframe
                                src={url}
                                id="ifVideoHelp"
                                title="Video Help"
                                className="w-full h-full"
                                frameBorder={0}
                                allow={playerPermissions}
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                            />
                        )}

                        {/* Prev nav button - overlaid on left edge */}
                        {hasPrev && (
                            <button
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-white/20 z-10"
                                onClick={playPrev}
                                title={`Previous: ${videoList[index - 1]?.module}`}
                            >
                                <i className="fa fa-chevron-left text-lg" />
                            </button>
                        )}

                        {/* Next nav button - overlaid on right edge */}
                        {hasNext && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-white/20 z-10"
                                onClick={playNext}
                                title={`Next: ${videoList[index + 1]?.module}`}
                            >
                                <i className="fa fa-chevron-right text-lg" />
                            </button>
                        )}
                    </div>

                    {/* Video list panel (slide-in) */}
                    {showList && (
                        <div className="w-64 shrink-0 bg-[#1a1a1a] border-l border-white/10 overflow-y-auto">
                            <div className="p-3 text-xs text-white/50 uppercase tracking-wider font-semibold border-b border-white/10">
                                Help Videos
                            </div>
                            {videoList.map((video, i) => (
                                <button
                                    key={`${video.videoId}-${i}`}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 border-b border-white/5 ${
                                        i === index
                                            ? 'bg-red-600/20 text-white border-l-2 border-l-red-500'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                                    onClick={() => playAt(i, 'Video list selection')}
                                >
                                    <span
                                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            i === index ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'
                                        }`}
                                    >
                                        {i === index ? <i className="fa fa-play text-[9px]" /> : i + 1}
                                    </span>
                                    <span className="truncate">{video.module}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer nav strip */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-t border-white/10 shrink-0">
                    <button
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                            hasPrev ? 'text-white/70 hover:text-white hover:bg-white/10 cursor-pointer' : 'text-white/20 cursor-not-allowed'
                        }`}
                        onClick={playPrev}
                        disabled={!hasPrev}
                    >
                        <i className="fa fa-chevron-left text-[11px]" />
                        <span className="hidden sm:inline">{hasPrev ? videoList[index - 1]?.module : 'No previous'}</span>
                    </button>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                        {videoList.map((_, i) => (
                            <button
                                key={i}
                                className={`rounded-full transition-all ${
                                    i === index ? 'w-4 h-2 bg-red-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                                }`}
                                onClick={() => playAt(i, 'Video dot navigation')}
                                title={videoList[i]?.module}
                            />
                        ))}
                    </div>

                    <button
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                            hasNext ? 'text-white/70 hover:text-white hover:bg-white/10 cursor-pointer' : 'text-white/20 cursor-not-allowed'
                        }`}
                        onClick={playNext}
                        disabled={!hasNext}
                    >
                        <span className="hidden sm:inline">{hasNext ? videoList[index + 1]?.module : 'No next'}</span>
                        <i className="fa fa-chevron-right text-[11px]" />
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
