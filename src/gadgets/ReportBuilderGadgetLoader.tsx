import { lazy, Suspense } from 'react';

import type { BaseGadgetProps } from './BaseGadget';

const ReportBuilderGadget = lazy(() => import('./ReportBuilderGadget'));

interface ReportBuilderGadgetLoaderProps extends BaseGadgetProps {
    reportId: string;
    title: string;
}

export default function ReportBuilderGadgetLoader(props: ReportBuilderGadgetLoaderProps) {
    return (
        <Suspense fallback={null}>
            <ReportBuilderGadget {...props} />
        </Suspense>
    );
}
