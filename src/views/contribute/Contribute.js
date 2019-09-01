import React, { PureComponent } from 'react';
import { SelectBox } from '../../controls';
import './Contribute.scss';

const currencies = [
    { label: 'US Dollar (USD)', value: 'usd' },
    { label: 'Indian Rupees (INR)', value: 'inr' },
    { label: 'UK Pound (GBP)', value: 'gbp' },
    { label: 'Euro (EUR)', value: 'eur' },
    { label: 'Australian Dollar (AUD)', value: 'aud' },
    { label: 'Brazilian Real (BRL)', value: 'brl' } //,
    //{ label: 'Sri Lanka Rupee (LKR)', value: 'lkr' },
    //{ label: 'Vietnamese Dong (VND)', value: 'vnd' },
    //{ label: 'Hryvnia (UAH)', value: 'uah' },
    //{ label: 'Zloty (PLN)', value: 'pln' }
];

class Contribute extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { selectedCurrency: currencies[0].value };
    }

    currencySelected = (val) => this.setState({ selectedCurrency: val })

    render() {
        const { state: { selectedCurrency } } = this;

        return (
            <div className="layout-7">
                <div className="widget-cntr">
                    <div className="donate-block">
                        <div className="donate-cntr">
                            <span>Are you a paypal user?</span>
                            <a href="http://paypal.me/shridhartl" target="_blank" rel="noopener noreferrer">
                                <img className="paypal" src="/assets/donate_paypal.png" alt="Donate now" />
                            </a>
                        </div>
                        <div className="seperator"><span>(or)</span></div>
                        <div className="donate-cntr">
                            <span>Choose your currency to pay:</span>
                            <SelectBox dataset={currencies} value={selectedCurrency} valueField="value" onChange={this.currencySelected} />
                            <a className="dbox-button" href={`https://donorbox.org/donate-jira-assistant-extension-${selectedCurrency}`}
                                target="_blank" rel="noopener noreferrer">Donate</a>
                        </div>
                    </div>
                    <div className="content-block">
                        <div>
                            <h2>Why Jira Assistant is free?</h2>
                            <p>
                                The motive of building Jira Assist is to help people who are spending lots of time in Jira to get some simple
                                things done or spend lots of money in buying a similar software and paying a lump sum for its subscription every year.
                            </p>
                        </div>
                        <div>
                            <h4>Do you think Jira Assistant saved you some time and helped you to get things easier?</h4>
                            <p>Then it is right time to donate us and get an even better working tool which can save even more of your precious time.</p>
                        </div>
                        <div>
                            <h4>How would my donation be helpful?</h4>
                            <p>
                                We need to spend lots of time and effort in building this tool, testing it and keep it updated with changes
                                in Jira and browser's API. A one time donation of a small amount like $20 or $30
                                would encourage us in putting more effort in building an even better working tool for you.
                            </p>
                            <p>
                                Though we would like to get compensated for the effort we put into development, we are not interested in making
                                it a paid tool and force our users to pay for it, or integrate a 3rd party Ad's in the tool and get compensated
                                by annoying our users.
                            </p>
                            <p>
                                So to have your Jira Assistant always free, Ad free and keep it updated, make a one time contribution of your
                                wish and help yourself and others in building a better working tool for ever.
                            </p>
                        </div>
                        <div>
                            <h4>I am not interested to donate. This donate button irritate me.</h4>
                            <p>
                                Our sole intention to develop this tool is to help you. We feel sorry to see you getting annoyed / irritated.
                            </p>
                            <p>
                                If you don't want this button to be visible any more then we provide you with an option to hide it forever.
                                Please navigate to Settings -&gt; General and you will see an option to hide it forever.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Contribute;