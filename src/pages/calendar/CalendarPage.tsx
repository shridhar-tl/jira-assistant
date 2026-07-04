import Calendar from './Calendar';

export default function CalendarPage() {
    return (
        <div className="calendar-page h-full flex flex-col">
            <Calendar isGadget={false} />
        </div>
    );
}
