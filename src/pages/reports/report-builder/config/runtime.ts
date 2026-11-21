import { initReportBuilder } from '@components/report-builder';

import { datasourcePlugins } from '../datasources';
import { parameterPlugins } from '../parameters';

import { builtInFields } from './built-in-fields';
import { reportFunctions } from './report-functions';

initReportBuilder({ builtInFields, functions: reportFunctions });

export { datasourcePlugins, parameterPlugins };
