import { memo } from 'react';

import { isWebBuild } from '@/constants/build-info';
import { WebSiteUrl } from '@/constants/urls';
import { Link } from '@/controls';
import config from '@/customize';

const showShareOption = config.features.header.shareWithOthers !== false;
const siteUrl = showShareOption ? WebSiteUrl : undefined;

interface HeaderBrandProps {
    showVersionInfo: (e: React.MouseEvent) => void;
    versionNumber: string;
}

function HeaderBrand({ showVersionInfo, versionNumber }: HeaderBrandProps) {
    return (
        <div className="flex items-center gap-2">
            <Link href={siteUrl || '#'} newTab={!!siteUrl} className="flex items-center no-underline">
                <span className="text-lg font-normal tracking-wide text-(--text-primary) whitespace-nowrap">
                    Jira <span className="font-medium">Assistant</span>
                </span>
            </Link>
            <span
                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700 transition-colors leading-tight shrink-0"
                onClick={showVersionInfo}
            >
                {versionNumber}
            </span>
            <button className="hidden quick-view-show" title="Open in new tab">
                <Link href={isWebBuild ? '/' : '/index.html'}>
                    <span className="fa fa-external-link text-(--text-secondary) text-[12px]" />
                </Link>
            </button>
        </div>
    );
}

export default memo(HeaderBrand);
