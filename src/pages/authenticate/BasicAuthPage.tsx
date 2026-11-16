import BasicAuthIntegration from '@pages/integrate/BasicAuthIntegration';
import IntegrationShell from '@pages/integrate/IntegrationShell';

import AuthFooter from './AuthFooter';

interface BasicAuthPageProps {
    setAuthType?: (authType: string) => void;
}

export default function BasicAuthPage({ setAuthType }: BasicAuthPageProps) {
    return (
        <IntegrationShell footer={<AuthFooter />}>
            <BasicAuthIntegration setAuthType={setAuthType} />
        </IntegrationShell>
    );
}
