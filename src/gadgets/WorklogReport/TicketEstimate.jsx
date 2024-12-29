import React from 'react';
import './TicketEstimate.scss';

function TicketEstimate({ est, rem, logged, variance }) {
    const estTitle = `Original Estimate: ${est || 0}\nRemaining: ${rem || 0}\nTotal Logged: ${logged}\nEstimate Variance: ${variance}`;

    return (
        <div className="ticket-estimate" title={estTitle}>
            <span className="ticket-item est">
                <span className="fas fa-clock" /> Est: {est}
            </span>
            <span className="ticket-item rem">
                <span className="fas fa-clipboard" /> Rem: {rem}
            </span>
            <span className="ticket-item log">
                <span className="fas fa-hourglass-half" /> Log: {logged}
            </span>
            <span className="ticket-item var">
                <span className="fas fa-exclamation-triangle" /> Var: {variance}
            </span>
        </div>
    );
}

export default TicketEstimate;
