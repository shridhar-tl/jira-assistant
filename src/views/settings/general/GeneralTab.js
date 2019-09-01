import React from 'react';
import { InputMask } from 'primereact/inputmask';
import { SelectBox, Checkbox } from '../../../controls';
import WeekDaysSelector from './WeekDaysSelector';
import { inject } from '../../../services';
import { dateFormats, timeFormats } from '../../../_constants';
import TabControlBase from './TabControlBase';

const WeekDaysArray = [
    { val: 0, label: 'Default' },
    { val: 1, label: 'Sunday' },
    { val: 2, label: 'Monday' },
    { val: 3, label: 'Tuesday' },
    { val: 4, label: 'Wednesday' },
    { val: 5, label: 'Thursday' },
    { val: 6, label: 'Friday' },
    { val: 7, label: 'Saturday' }
];

class GeneralTab extends TabControlBase {
    constructor(props) {
        super(props);
        inject(this, "UtilsService");

        const curDate = new Date();
        this.dateFormats = dateFormats.map((f) => { return { format: f, text: this.$utils.formatDate(curDate, f) }; });
        this.timeFormats = timeFormats.map((f) => { return { format: f, text: this.$utils.formatDate(curDate, f) }; });
    }

    /*UNSAFE_componentWillMount() {
        this.$jaBrowserExtn.getStorageInfo().then((info) => {
            this.spaceInfo = info;
            const progressClass = 'progress-bar-';
            if (info.usedSpacePerc < 50) {
                progressClass += 'green';
            }
            else if (info.usedSpacePerc <= 75) {
                progressClass += 'yellow';
            }
            else {
                progressClass += 'red';
            }
            this.spaceInfo.progressClass = progressClass;
        });
    }*/

    render() {
        const {
            dateFormats, timeFormats,
            props: { settings, noDonations },
        } = this;

        return (
            <div className="form-horizontal">
                <div className="form-label ui-g-12">
                    <strong>Display Date and Time format</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox className="form-control select" dataset={dateFormats} value={settings.dateFormat} valueField="format" displayField="text"
                            propName="dateFormat" onChange={(val) => this.setValue('dateFormat', val)}
                            style={{ width: '180px', display: 'inline-block' }} />
                        <SelectBox className="form-control select" dataset={timeFormats} value={settings.timeFormat} valueField="format" displayField="text"
                            propName="timeFormat" onChange={(val) => this.setValue('timeFormat', val)}
                            style={{ width: '150px', display: 'inline-block' }} />
                        <span className="help-block">Select your preferred date and time format to be displayed throughout the application</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Working hours</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <InputMask mask="99:99" value={settings.startOfDay} onChange={(e) => this.setValue('startOfDay', e.value)}
                            placeholder="00:00" maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <InputMask mask="99:99" value={settings.endOfDay} onChange={(e) => this.setValue('endOfDay', e.value)}
                            placeholder="00:00" maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <span className="help-block">Select your working hours range between 00:00 to 23:00 (24 hours format)</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Working days</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <WeekDaysSelector value={settings.workingDays} onChange={(val) => this.setValue("workingDays", val)} />
                        <span className="help-block">Select the days in week you would be working.</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Start of week</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox dataset={WeekDaysArray} className="form-control select" valueField="val" displayField="label"
                            value={settings.startOfWeek} onChange={(val) => this.setValue('startOfWeek', val)} style={{ width: 180, display: 'inline-block' }} />
                        <span className="help-block">Select the starting day of your week. If nothing is selected then default will be taken.</span>
                    </div>
                </div>
                {!noDonations && <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Donate / contribute to us</strong>
                </div>}
                {!noDonations && <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10" >
                    <div className="form-group">
                        <div>
                            <Checkbox checked={settings.hideDonateMenu} onChange={(val) => this.setValue('hideDonateMenu', val)} label="Hide Donate button in header" />
                        </div>
                        <div>
                            <a href={`/#/${this.props.userId}/contribute`} title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more">
                                <img src="/assets/donate.png" width={145} className="Donate us" alt="Donate" />
                            </a>
                        </div>
                        <span className="help-block">
                            You can choose to hide the donate button / menu displayed in the tool using this option. But before hiding it consider donating
                            a small amount of your wish.
                        </span>
                    </div>
                </div>}
                {/*<div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Space consumed</strong>
                </div>
                <div className="ui-g-12 ui-md-5 ui-lg-5 ui-xl-4">
                    <div className="form-group">
                        <p-progressbar value={spaceInfo.usedSpacePerc} />
                        <span className="help-block">
                            You have used
                            <strong>{spaceInfo.usedSpace | bytes}</strong> of
                            <strong>{spaceInfo.totalSpace | bytes}</strong> allocated by browser.
                            <span hidden={spaceInfo.usedSpacePerc < 80}>
                                Once the remaining
                                <strong>{spaceInfo.freeSpace | bytes}</strong> is used you will not be able to use the tool to generate worklog.
                            </span>
                            <span hidden={spaceInfo.freeSpace > 0}>
                                <strong>Note:</strong> It looks like all the space allocated is being consumed. See if you are running out of free
                                space in your OS Drive (generally your C drive).
                                <a href="https://github.com/shridhar-tl/jira-assistant/issues/18" target="_blank" rel="noopener noreferrer">Read more about it here.</a>
                            </span>
                        </span>
                    </div>
                </div>*/}
            </div>
        );
    }
}

export default GeneralTab;