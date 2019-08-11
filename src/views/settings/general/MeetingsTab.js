import React from 'react';
import TabControlBase from './TabControlBase';

class MeetingsTab extends TabControlBase {
    render() {
        var {
            props: { settings, removedIntg }
        } = this;

        return (
            <div>
                <p>
                    This page allows you to integrate your calendar from external sources like Google. Worklog will be automatically created
                    for the events in your calendar based on your preferences
                    </p>
                <div className="block">
                    <h4>Google Calendar</h4>
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Enable Google calendar</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <label className="check">
                                    <input type="checkbox" className="icheckbox" value={settings.googleIntegration} onChange={(val) => { settings.googleIntegration = val }} /> Allow integration
                                    </label>
                                <span className="help-block">Select this checkbox if you would wish to view meetings in your calendar</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Integration Status</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group" hidden={settings.hasGoogleCredentials || removedIntg}>
                                <label className="link" onClick={this.googleSignIn}>Click here to sign in with your google account</label>
                                <span className="help-block">You will have to sign-in to chrome with your google account to use the calendar.</span>
                            </div>
                            <div className="form-group" hidden={!(settings.hasGoogleCredentials && !removedIntg)}>
                                <label>(Already integrated with an account)</label>
                                <label className="link" onClick={() => { settings.hasGoogleCredentials = false; removedIntg = true }}>Remove integration</label>
                            </div>
                            <div className="form-group" hidden={!removedIntg}>
                                <label>(You will be signed out from Google once you save your changes)</label>
                                <label className="link" onClick={() => { settings.hasGoogleCredentials = true; removedIntg = false }}> Undo signout</label>
                                <span className="help-block">Note: You will have to authenticate with google again to use the calendar</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Check for updates</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <select className="form-control select" value={settings.checkUpdates} onChange={(val) => { settings.checkUpdates = val }} style={{ width: 180, display: 'inline-block' }}>
                                    <option value={5}>Every 5 minutes</option>
                                    <option value={10}>Every 10 minutes</option>
                                    <option value={15}>Every 15 minutes</option>
                                    <option value={20}>Every 20 minutes</option>
                                    <option value={30}>Every 30 minutes</option>
                                    <option value={45}>Every 45 minutes</option>
                                    <option value={60}>Every 60 minutes</option>
                                </select>
                                <span className="help-block">Refresh the meeting invites for notification regularly in given interval</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Show meeting notification</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <select className="form-control select" value={settings.notifyBefore} onChange={(val) => { settings.notifyBefore = val }} style={{ width: 180, display: 'inline-block' }}>
                                    <option value={0}>Disable notification</option>
                                    <option value={1}>Before 1 minute</option>
                                    <option value={2}>Before 2 minutes</option>
                                    <option value={3}>Before 3 minutes</option>
                                    <option value={4}>Before 4 minutes</option>
                                    <option value={5}>Before 5 minutes</option>
                                    <option value={10}>Before 10 minutes</option>
                                    <option value={10}>Before 15 minutes</option>
                                </select>
                                <span className="help-block">Show notification before the selected time of meeting</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Auto launch hangout</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <select className="form-control select" value={settings.autoLaunch} onChange={(val) => { settings.autoLaunch = val }} style={{ width: 180, display: 'inline-block' }}>
                                    <option value={0}>Never launch</option>
                                    <option value={1}>Before 1 minute</option>
                                    <option value={2}>Before 2 minutes</option>
                                    <option value={3}>Before 3 minutes</option>
                                    <option value={4}>Before 4 minutes</option>
                                    <option value={5}>Before 5 minutes</option>
                                    <option value={10}>Before 10 minutes</option>
                                </select>
                                <span className="help-block">Automatically launch hangout Url before the selected time of meeting</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MeetingsTab;