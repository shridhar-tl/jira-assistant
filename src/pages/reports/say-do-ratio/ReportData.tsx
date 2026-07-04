import React, { useState } from 'react';

import classNames from 'classnames';

import { Column, NoDataRow, ScrollableTable, TBody, THead, TRow } from '@/components/shared';
import WorklogIndicator from '@/components/worklog-indicator';

import SayDoRatioChart from './SayDoRatioChart';
import SprintInfo from './SprintInfo';
import SprintStatusWiseTimeSpentChart from './SprintStatusWiseTimeSpentChart';
import type { BoardData, ReportSettings, SprintData } from './types';

interface ReportDataProps {
    reportData: BoardData[];
    settings: ReportSettings;
}

const changeLogErrorMessage = 'Unable to fetch change logs and hence data may not be accurate';

function formatValue(value?: number, suffix = '%', defaultValue = ''): string {
    return value ? `${value}${suffix}` : defaultValue;
}

function getLogClass(value?: number, isSelected?: boolean): string {
    if (!value) {
        return isSelected ? 'text-center selected' : 'text-center';
    }

    let className = 'log-good';

    if (value >= 85) {
        className = 'log-good';
    } else if (value >= 70) {
        className = 'log-less';
    } else {
        className = 'log-high';
    }

    return classNames('log-indi-cntr', className, { selected: isSelected });
}

function loop(num: number, callback: (i: number) => React.ReactNode): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    for (let i = 0; i < num; i++) {
        result.push(callback(i));
    }
    return result;
}

function ReportData({ reportData, settings }: ReportDataProps) {
    const [selectedSprint, setSprint] = useState<SprintData | null>(null);

    return (
        <>
            <ScrollableTable dataset={reportData} containerStyle={{ height: 'auto', maxHeight: '70%' }} exportable={false}>
                <THead>
                    <TRow>
                        <Column sortBy="name">Board Name</Column>
                        <Column sortBy="velocity" className="text-center">
                            Velocity
                        </Column>
                        <Column sortBy="sayDoRatio" className="text-center">
                            Say-Do-Ratio
                        </Column>
                        <Column sortBy="averageCycleTime" className="text-center">
                            Cycle Time
                        </Column>
                        {loop(settings.noOfSprints, (i) => {
                            const sprintTitle =
                                settings.noOfSprints === i + 1 ? 'Last sprint (n-1)' : `Sprint n${i - settings.noOfSprints}`;
                            return (
                                <Column key={i} className="text-center">
                                    {sprintTitle}
                                </Column>
                            );
                        })}
                    </TRow>
                </THead>
                <TBody className="no-log-bg-hl">
                    {(b: BoardData) => (
                        <tr key={b.id}>
                            <td>
                                {b.name}{' '}
                                {b.logUnavailable && (
                                    <span
                                        className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"
                                        title={changeLogErrorMessage}
                                    />
                                )}
                            </td>
                            <td className="text-center">
                                {b.velocity || '-'} {!!b.velocity && <span>({parseFloat(b.velocityGrowth?.toFixed(2) || '0')}%)</span>}
                            </td>
                            <td className={getLogClass(b.sayDoRatio)}>
                                {formatValue(b.sayDoRatio)}
                                {!!b.sayDoRatio && <WorklogIndicator value={b.sayDoRatio} maxHours={100} />}
                            </td>
                            <td className="text-center">{b.averageCycleTime ? `${b.averageCycleTime} days` : '-'}</td>
                            {b.sprintList.map((s, index) =>
                                s ? (
                                    <td
                                        className={classNames(
                                            'sprint-info-cell cursor-pointer',
                                            getLogClass(s.sayDoRatio, s === selectedSprint),
                                        )}
                                        onClick={() => setSprint(s)}
                                        key={`sprint-${s.id}`}
                                    >
                                        <span className="fas fa-info-circle float-end" />
                                        {!!s.sayDoRatio && <span>{s.sayDoRatio}%</span>}
                                        {!s.sayDoRatio && <span>-</span>}
                                        {!b.logUnavailable && s.logUnavailable && (
                                            <span
                                                className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"
                                                title={changeLogErrorMessage}
                                            />
                                        )}
                                        {!!s.sayDoRatio && <WorklogIndicator value={parseInt(s.sayDoRatio.toString())} maxHours={100} />}
                                    </td>
                                ) : (
                                    <td className="text-center" key={`empty-${index}`}>
                                        -
                                    </td>
                                ),
                            )}
                        </tr>
                    )}
                </TBody>
                {!reportData?.length && <NoDataRow span={7}>No data available.</NoDataRow>}
            </ScrollableTable>

            <table className="hidden exportable" data-export-sheet-name="Say Do Ratio">
                <thead>
                    <tr>
                        <th rowSpan={2}>Board Name</th>
                        <th rowSpan={2}>Velocity</th>
                        <th rowSpan={2}>Say-Do-Ratio</th>
                        <th rowSpan={2}>Cycle Time</th>
                        {loop(settings.noOfSprints, (i) => {
                            const sprintTitle =
                                settings.noOfSprints === i + 1 ? 'Last sprint (n-1)' : `Sprint n${i - settings.noOfSprints}`;
                            return (
                                <th key={i} colSpan={3} className="text-center">
                                    {sprintTitle}
                                </th>
                            );
                        })}
                    </tr>
                    <tr>
                        {loop(settings.noOfSprints, (i) => (
                            <React.Fragment key={i}>
                                <th>Say-Do-Ratio</th>
                                <th>Velocity</th>
                                <th>Cycle Time</th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((b) => (
                        <tr key={b.id}>
                            <td>{b.name}</td>
                            <td>
                                {b.velocity} {!!b.velocity && <span>({parseFloat(b.velocityGrowth?.toFixed(2) || '0')}%)</span>}
                            </td>
                            <td>{formatValue(b.sayDoRatio)}</td>
                            <td>{formatValue(b.averageCycleTime, ' days')}</td>
                            {b.sprintList.map((s, i) => (
                                <React.Fragment key={i}>
                                    <td>{formatValue(s?.sayDoRatio)}</td>
                                    <td>{formatValue(s?.velocity, '', '')}</td>
                                    <td>{formatValue(s?.cycleTime, '', '')}</td>
                                </React.Fragment>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedSprint && (
                <div className="m-3">
                    <SprintInfo sprint={selectedSprint} onClose={() => setSprint(null)} />
                </div>
            )}

            <div className="grid lg:grid-cols-1 xl:grid-cols-2 m-0 mt-3">
                {reportData?.map((b) => (
                    <React.Fragment key={b.id}>
                        <SayDoRatioChart board={b} />
                        <SprintStatusWiseTimeSpentChart board={b} />
                    </React.Fragment>
                ))}
            </div>
        </>
    );
}

export default ReportData;
