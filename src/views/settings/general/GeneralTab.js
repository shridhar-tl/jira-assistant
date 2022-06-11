import React from 'react';
import $ from 'jquery';
import { InputMask } from 'primereact/inputmask';
import { SelectBox, Checkbox } from '../../../controls';
import WeekDaysSelector from './WeekDaysSelector';
import { inject } from '../../../services';
import { dateFormats, DefaultEndOfDay, DefaultStartOfDay, timeFormats } from '../../../_constants';
import { setStartOfWeek } from '../../../common/utils';
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
        this.state = { settings: props.settings };

        const curDate = new Date();
        this.dateFormats = dateFormats.map((f) => ({ format: f, text: this.$utils.formatDate(curDate, f) }));
        this.timeFormats = timeFormats.map((f) => ({ format: f, text: this.$utils.formatDate(curDate, f) }));
    }

    setStartOfweek = (value, field) => {
        value = parseInt(value);
        this.saveSetting(value, field);
        setStartOfWeek(value);
    };

    toggleDonateMenu = (value, field) => {
        const cUser = this.$session.CurrentUser;
        cUser.hideDonateMenu = this.props.noDonations || value; //sett.hideDonateMenu;
        this.saveSetting(value, field);

        if (cUser.hideDonateMenu) {
            $('body').addClass('no-donation');
        }
        else {
            $('body').removeClass('no-donation');
        }
    };

    render() {
        const {
            dateFormats, timeFormats,
            props: { noDonations },
            state: { settings },
        } = this;

        return (
            <div className="form-horizontal">
                <div className="form-label ui-g-12">
                    <strong>Display Date and Time format</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox className="form-control select" dataset={dateFormats} value={settings.dateFormat} valueField="format"
                            displayField="text" field="dateFormat" onChange={this.saveSetting}
                            style={{ width: '180px', display: 'inline-block' }} />
                        <SelectBox className="form-control select" dataset={timeFormats} value={settings.timeFormat} valueField="format"
                            displayField="text" field="timeFormat" onChange={this.saveSetting}
                            style={{ width: '150px', display: 'inline-block' }} />
                        <span className="help-block">Select your preferred date and time format to be displayed throughout the application</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Displayed hours</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <InputMask mask="99:99" value={settings.startOfDayDisp} onChange={(e) => this.saveSetting(e.value, 'startOfDayDisp')}
                            placeholder={DefaultStartOfDay} maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <InputMask mask="99:99" value={settings.endOfDayDisp} onChange={(e) => this.saveSetting(e.value, 'endOfDayDisp')}
                            placeholder={DefaultEndOfDay} maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <span className="help-block">Select your displayed hours range for calendar between 00:00 to 23:00 (24 hours format)</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Working hours</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <InputMask mask="99:99" value={settings.startOfDay} onChange={(e) => this.saveSetting(e.value, 'startOfDay')}
                            placeholder={DefaultStartOfDay} maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <InputMask mask="99:99" value={settings.endOfDay} onChange={(e) => this.saveSetting(e.value, 'endOfDay')}
                            placeholder={DefaultEndOfDay} maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <span className="help-block">Select your working hours range between 00:00 to 23:00 (24 hours format)</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Working days</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <WeekDaysSelector value={settings.workingDays} field="workingDays" onChange={this.saveSetting} />
                        <span className="help-block">Select the days in week you would be working.</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Start of week</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox dataset={WeekDaysArray} className="form-control select" valueField="val" displayField="label"
                            value={settings.startOfWeek} field="startOfWeek" onChange={this.setStartOfweek} style={{ width: 180, display: 'inline-block' }} />
                        <span className="help-block">Select the starting day of your week. If nothing is selected then default will be taken.</span>
                    </div>
                </div>
                {!noDonations && <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Donate / contribute to us</strong>
                </div>}
                {!noDonations && <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10" >
                    <div className="form-group">
                        <div>
                            <Checkbox checked={settings.hideDonateMenu} field="hideDonateMenu" onChange={this.saveSetting} label="Hide Donate button in header" />
                        </div>
                        <div>
                            <a href={`/index.html#/${this.props.userId}/contribute`}
                                title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more">
                                <img src="/assets/donate.png" width={145} className="Donate us" alt="Donate us" />
                            </a>
                        </div>
                        <span className="help-block">
                            You can choose to hide the donate button / menu displayed in the tool using this option. But before hiding it consider donating
                            a small amount of your wish.
                        </span>
                    </div>
                </div>}
            </div>
        );
    }
}

export default GeneralTab;