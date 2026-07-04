import { useState } from 'react';

import { Dropdown } from '@components';

const currencies = [
    { label: 'US Dollar (USD)', value: 'usd' },
    { label: 'Indian Rupees (INR)', value: 'inr' },
    { label: 'UK Pound (GBP)', value: 'gbp' },
    { label: 'Euro (EUR)', value: 'eur' },
    { label: 'Australian Dollar (AUD)', value: 'aud' },
    { label: 'Brazilian Real (BRL)', value: 'brl' },
];

export default function ContributePage() {
    const [currency, setCurrency] = useState(currencies[0].value);

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <div className="max-w-7xl mx-auto p-4">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/3 bg-[var(--bg-primary)] rounded-lg shadow-lg p-6">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">Why Jira Assistant is free?</h2>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    The goal behind creating Jira Assistant is to assist individuals who spend significant time in Jira,
                                    making routine tasks simpler, without the need to invest in expensive software or yearly subscriptions.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">
                                    Has Jira Assistant saved you time and streamlined tasks?
                                </h4>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    If Jira Assistant has made your tasks easier and saved you time, consider making a donation to access an
                                    even more advanced tool that can further optimize your workflow.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">How Will Your Donation Help Us?</h4>
                                <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
                                    Building and testing Jira Assistant has required significant time and effort. We are committed to
                                    keeping it up-to-date with changes in Jira, browser APIs, browser updates, and more. Your one-time
                                    donation, whether it's $20 or $30, will motivate us to continue enhancing this tool for your benefit.
                                </p>
                                <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
                                    While we value the effort put into development, we believe in keeping Jira Assistant free and without
                                    third-party ads that could inconvenience users. Your contribution ensures that Jira Assistant remains
                                    ad-free, updated, and accessible to all users.
                                </p>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    By making a one-time contribution, you're not only investing in your own productivity but also
                                    supporting others in accessing an ever-improving tool. Help us maintain Jira Assistant as a valuable
                                    resource for everyone.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">I'm not interested in donating</h4>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    If you prefer not to see this button anymore, we offer an option to hide it permanently. Please go to
                                    Settings → General, where you'll find an option to remove it from the header.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/3">
                        <div className="bg-[var(--bg-primary)] rounded-lg shadow-lg p-6 sticky top-4">
                            <div className="border border-[var(--border-color)] rounded-lg p-4 mb-6 shadow-[0_0_9px_10px_rgba(0,0,0,0.1)]">
                                <span className="block text-[var(--text-primary)] mb-3 text-center">Are you a paypal user?</span>
                                <a href="https://paypal.me/shridhartl" target="_blank" rel="noopener noreferrer" className="block">
                                    <img className="w-full h-auto cursor-pointer" src="/assets/donate_paypal.png" alt="Donate now" />
                                </a>
                            </div>

                            <div className="text-center my-6">
                                <span className="text-lg font-bold text-[var(--text-primary)]">(or)</span>
                            </div>

                            <div className="border border-[var(--border-color)] rounded-lg p-4 shadow-[0_0_9px_10px_rgba(0,0,0,0.1)]">
                                <span className="block text-[var(--text-primary)] mb-3 text-center">Choose your currency to pay:</span>
                                <Dropdown
                                    options={currencies}
                                    value={[currency]}
                                    onChange={(e) => setCurrency((e.value as string[])[0])}
                                    className="mb-3"
                                />
                                <a
                                    href={`https://donorbox.org/donate-jira-assistant-extension-${currency}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-[#2d81c5] text-white text-center no-underline font-sans text-base py-3 px-9 rounded-lg shadow-[0_1px_0_0_#1f5a89] hover:bg-[#236ba3] transition-colors"
                                    style={{
                                        backgroundImage: 'url(https://d1iczxrky3cnb2.cloudfront.net/red_logo.png)',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: '37px center',
                                        paddingLeft: '75px',
                                    }}
                                >
                                    Donate
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
