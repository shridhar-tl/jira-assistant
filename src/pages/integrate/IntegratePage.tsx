import CookieIntegration from './CookieIntegration';
import IntegrateFooter from './IntegrateFooter';
import IntegrationShell from './IntegrationShell';

interface IntegratePageProps {
    setAuthType?: (authType: string) => void;
}

export default function IntegratePage({ setAuthType }: IntegratePageProps) {
    return (
        <IntegrationShell footer={<IntegrateFooter />}>
            <CookieIntegration setAuthType={setAuthType} />
        </IntegrationShell>
    );
}
