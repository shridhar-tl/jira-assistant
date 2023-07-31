import React, { useEffect } from 'react';
import { DndProvider } from 'src/controls';
import withInitParams from '../../../layouts/initialization';
import withAuthInfo from '../../../layouts/authorization/simple-auth';
import { withProvider, getInitialSettings } from '../../../gadgets/WorklogReport/datastore';
import { fetchData } from '../../../gadgets/WorklogReport/actions';
import Loader from '../../../components/shared/Loader';
import './Style.scss';

const EditConfig = React.lazy(() => import('./EditConfig'));
const Report = React.lazy(() => import('../../../gadgets/WorklogReport/Report'));

const Gadget = function ({ settings, jiraContext: { extension: { entryPoint } }, fetchData }) {
    const isEdit = entryPoint === 'edit';
    useEffect(() => {
        if (!isEdit) {
            fetchData();
        }
    }, [isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isEdit) {
        return (<EditConfig />);
    } else {
        return <div className="report-div">
            <ReportDisplay settings={settings} />
        </div>;
    }
};

export default withInitParams(withAuthInfo(withProvider(Gadget,
    (settings) => ({ settings }), { fetchData }, null,
    ({ jiraContext: { extension: { gadgetConfiguration } } }) => getInitialSettings(gadgetConfiguration, { disableAddingWL: true }))));


const ReportDisplay = function ({ settings: { reportLoaded, loadingData, errorTitle, errorMessage } }) {
    if (errorMessage) {
        return (<div className="pad-32"><strong>{errorTitle}: </strong>{errorMessage}</div>);
    }

    if (loadingData) {
        return <div className="pad-32"><Loader /></div>;
    }

    if (!reportLoaded) {
        return <div className="pad-32">No data returned matching your filter</div>;
    }

    return (<DndProvider><Report isLoading={loadingData} /></DndProvider>);
};