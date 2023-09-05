import React from 'react';
import { SelectBox } from '../../controls';
import Link from '../../controls/Link';
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

function Contribute() {
    const [currency, setCurrency] = React.useState(currencies[0].value);

    return (
        <div className="layout-7">
            <div className="widget-cntr">
                <div className="donate-block">
                    <div className="donate-cntr">
                        <span>Are you a paypal user?</span>
                        <Link href="https://paypal.me/shridhartl">
                            <img className="paypal" src="/assets/donate_paypal.png" alt="Donate now" />
                        </Link>
                    </div>
                    <div className="seperator"><span>(or)</span></div>
                    <div className="donate-cntr">
                        <span>Choose your currency to pay:</span>
                        <SelectBox dataset={currencies} value={currency} valueField="value" onChange={setCurrency} />
                        <Link className="dbox-button"
                            href={`https://donorbox.org/donate-jira-assistant-extension-${currency}`}
                        >Donate</Link>
                    </div>
                </div>
                <div className="content-block">
                    <div>
                        <h2>Why Jira Assistant is free?</h2>
                        <p>
                            The goal behind creating Jira Assistant is to assist individuals who spend significant time in Jira, making routine tasks simpler,
                            without the need to invest in expensive software or yearly subscriptions.
                        </p>
                    </div>
                    <div>
                        <h4>Has Jira Assistant saved you time and streamlined tasks?</h4>
                        <p>
                            If Jira Assistant has made your tasks easier and saved you time, consider making a donation to
                            access an even more advanced tool that can further optimize your workflow.
                        </p>
                    </div>
                    <div>
                        <h4>How Will Your Donation Help Us?</h4>
                        <p>
                            Building and testing Jira Assistant has required significant time and effort. We are committed to keeping it up-to-date
                            with changes in Jira, browser APIs, browser updates, and more. Your one-time donation, whether it's $20 or $30,
                            will motivate us to continue enhancing this tool for your benefit.
                        </p>
                        <p>
                            While we value the effort put into development, we believe in keeping Jira Assistant free and without
                            third-party ads that could inconvenience users. Your contribution ensures that Jira Assistant remains
                            ad-free, updated, and accessible to all users.
                        </p>
                        <p>
                            By making a one-time contribution, you're not only investing in your own productivity but also
                            supporting others in accessing an ever-improving tool. Help us maintain Jira Assistant as a valuable resource for everyone.
                        </p>
                    </div>
                    <div>
                        <h4>I'm not interested in donating</h4>
                        <p>
                            If you prefer not to see this button anymore, we offer an option to hide it permanently.
                            Please go to Settings → General, where you'll find an option to remove it from the header.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contribute;