import { useCallback, useRef, useState } from 'react';

import { inject } from '@services';

import { EventCategory } from '../constants/settings';

interface VideoInfo {
    videoId: string;
    module: string;
    route: string;
    startAt?: number;
}

const videoList: VideoInfo[] = [
    { videoId: 'xNYNXWUgCeA', module: 'Dashboard', route: 'dashboard' },
    { videoId: 'Ihz4Dm5oiRk', module: 'Worklog Timer', route: '~' },
    { videoId: 'hJBM5X24sPQ', module: 'Worklog Calendar', route: 'calendar' },
    { videoId: 'WQOHrPBZZiI', module: 'Worklog report - Sprint wise', route: 'reports/worklog' },
    { videoId: '4hFigSvXatM', module: 'Pivot report - Worklog sample', route: 'reports/pivot' },
    { videoId: 'TxNH1HQtiX0', module: 'Worklog report', route: 'userdaywise' },
    { videoId: '6hAOtUm1lUk', module: 'Worklog import', route: 'import/worklog' },
    { videoId: 'EFgXFqrGuTI', module: 'Issue import', route: 'import/issue' },
    { videoId: 'HMyBkaZ09Xw', module: 'Report builder', route: 'advanced' },
];

const oldVideoList: VideoInfo[] = [
    { startAt: 713, videoId: 'f2aBSXzbYuA', module: 'Custom report', route: 'customgrouped' },
    { startAt: 1069, videoId: 'f2aBSXzbYuA', module: 'Settings', route: 'settings' },
    { startAt: 1147, videoId: 'f2aBSXzbYuA', module: 'Feedback', route: 'feedback' },
];

interface YoutubeVideoProps {
    onHide?: () => void;
}

function getVideoUrl(video: VideoInfo, analytics: any, event?: string): string {
    analytics?.trackEvent(event || 'Video help viewed', EventCategory.HeaderActions, `Video Help: ${video.module}`);
    return `https://www.youtube.com/embed/${video.videoId}?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=${video.startAt || 0}`;
}

function buildVideoList(): VideoInfo[] {
    const pathname = window.location.pathname;
    const route = pathname.substring(2);
    const list = [...videoList];

    let videoDetails = videoList.find((video) => route.includes(video.route));

    if (!videoDetails) {
        videoDetails = oldVideoList.find((video) => route.includes(video.route));
        if (!videoDetails) {
            videoDetails = oldVideoList[0];
        }
        list.push(videoDetails);
    }

    return list;
}

export default function YoutubeVideo({ onHide }: YoutubeVideoProps) {
    const { $analytics } = inject('AnalyticsService');
    const overlayRef = useRef<HTMLDivElement>(null);

    const [activeList] = useState<VideoInfo[]>(() => buildVideoList());
    const [index, setIndex] = useState<number>(() => {
        const pathname = window.location.pathname;
        const route = pathname.substring(2);
        const found = videoList.findIndex((video) => route.includes(video.route));
        return found >= 0 ? found : 0;
    });
    const [url, setUrl] = useState<string>(() => getVideoUrl(activeList[index], $analytics));
    const [showList, setShowList] = useState(false);

    const playAt = useCallback(
        (newIndex: number, event?: string) => {
            const newUrl = getVideoUrl(activeList[newIndex], $analytics, event);
            setIndex(newIndex);
            setUrl(newUrl);
            setShowList(false);
        },
        [activeList, $analytics],
    );

    const playPrev = useCallback(() => {
        if (index > 0) playAt(index - 1, 'Video view previous');
    }, [index, playAt]);

    const playNext = useCallback(() => {
        if (index + 1 < activeList.length) playAt(index + 1, 'Video view next');
    }, [index, activeList.length, playAt]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === overlayRef.current) {
                onHide?.();
            }
        },
        [onHide],
    );

    const hasPrev = index > 0;
    const hasNext = index + 1 < activeList.length;
    const currentVideo = activeList[index];

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div className="relative flex flex-col w-[95vw] h-[92vh] max-w-400 rounded-xl overflow-hidden shadow-2xl bg-[#0f0f0f]">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-red-500 text-xl leading-none">
                            <i className="fa-brands fa-youtube" />
                        </span>
                        <span className="text-white font-medium text-sm truncate">{currentVideo?.module}</span>
                        <span className="text-white/40 text-xs shrink-0">
                            {index + 1} / {activeList.length}
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
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                            />
                        )}

                        {/* Prev nav button - overlaid on left edge */}
                        {hasPrev && (
                            <button
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-white/20 z-10"
                                onClick={playPrev}
                                title={`Previous: ${activeList[index - 1]?.module}`}
                            >
                                <i className="fa fa-chevron-left text-lg" />
                            </button>
                        )}

                        {/* Next nav button - overlaid on right edge */}
                        {hasNext && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-white/20 z-10"
                                onClick={playNext}
                                title={`Next: ${activeList[index + 1]?.module}`}
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
                            {activeList.map((video, i) => (
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
                        <span className="hidden sm:inline">{hasPrev ? activeList[index - 1]?.module : 'No previous'}</span>
                    </button>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                        {activeList.map((_, i) => (
                            <button
                                key={i}
                                className={`rounded-full transition-all ${
                                    i === index ? 'w-4 h-2 bg-red-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                                }`}
                                onClick={() => playAt(i, 'Video dot navigation')}
                                title={activeList[i]?.module}
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
                        <span className="hidden sm:inline">{hasNext ? activeList[index + 1]?.module : 'No next'}</span>
                        <i className="fa fa-chevron-right text-[11px]" />
                    </button>
                </div>
            </div>
        </div>
    );
}
