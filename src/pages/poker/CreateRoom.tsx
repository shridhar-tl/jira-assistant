import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { usePokerActions } from './actions';
import { scoresList } from './constants';

const scoreTypeOptions = [
    {
        type: 1,
        icon: '🌀',
        label: 'Fibonacci',
        description: scoresList[1].join(', '),
    },
    {
        type: 2,
        icon: '⚡',
        label: 'Short Fibonacci',
        description: scoresList[2].join(', '),
    },
    {
        type: 3,
        icon: '👕',
        label: 'T-Shirt',
        description: (scoresList[3] as string[]).join(', '),
    },
];

interface CreateRoomState {
    scoreType: number;
    roomName: string;
    name: string;
    email: string;
    isLoading: boolean;
    roomError: string;
    nameError: string;
    emailError: string;
    hasError: boolean;
    apiError: string;
}

export default function CreateRoom() {
    const navigate = useNavigate();
    const { createRoom } = usePokerActions();

    const [state, setState] = useState<CreateRoomState>({
        scoreType: 1,
        roomName: '',
        name: '',
        email: '',
        isLoading: false,
        roomError: '',
        nameError: '',
        emailError: '',
        hasError: true,
        apiError: '',
    });

    const setValue = (val: string | number, field: string) => {
        const newState: any = { ...state, [field]: val };

        newState.roomError = (newState.roomName || '').length < 3 ? 'Room name is too short' : '';
        newState.emailError = (newState.email || '').length < 3 ? 'Email is invalid' : '';
        newState.nameError = (newState.name || '').length < 3 ? 'Name is too short' : '';

        newState.hasError = !!(newState.roomError || newState.nameError || newState.emailError);

        setState(newState);
    };

    const handleCreateRoom = async () => {
        try {
            setState((s) => ({ ...s, isLoading: true, apiError: '' }));
            const { roomId } = await createRoom(state);
            navigate(`/poker/${roomId}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create room. Please try again.';
            setState((s) => ({ ...s, isLoading: false, apiError: message }));
            console.error(err);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <span className="fa fa-plus text-white text-sm" />
                </div>
                <h2 className="text-xl font-bold text-white">Create New Room</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Room Name <span className="text-purple-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={state.roomName}
                        onChange={(e) => setValue(e.target.value, 'roomName')}
                        maxLength={15}
                        autoFocus
                        placeholder="My Sprint Room"
                        className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                            state.roomError
                                ? 'border-red-500/60 focus:ring-red-500/40'
                                : 'border-white/15 focus:ring-purple-500/40 focus:border-purple-500/50'
                        }`}
                    />
                    {state.roomError && (
                        <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1">
                            <span className="fa fa-exclamation-circle" />
                            {state.roomError}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Your Name <span className="text-purple-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={state.name}
                        onChange={(e) => setValue(e.target.value, 'name')}
                        maxLength={15}
                        placeholder="John Doe"
                        className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                            state.nameError
                                ? 'border-red-500/60 focus:ring-red-500/40'
                                : 'border-white/15 focus:ring-purple-500/40 focus:border-purple-500/50'
                        }`}
                    />
                    {state.nameError && (
                        <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1">
                            <span className="fa fa-exclamation-circle" />
                            {state.nameError}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Your Email <span className="text-purple-400">*</span>
                    </label>
                    <input
                        type="email"
                        value={state.email}
                        onChange={(e) => setValue(e.target.value, 'email')}
                        maxLength={80}
                        placeholder="john@example.com"
                        className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                            state.emailError
                                ? 'border-red-500/60 focus:ring-red-500/40'
                                : 'border-white/15 focus:ring-purple-500/40 focus:border-purple-500/50'
                        }`}
                    />
                    {state.emailError && (
                        <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1">
                            <span className="fa fa-exclamation-circle" />
                            {state.emailError}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Score Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {scoreTypeOptions.map((opt) => (
                            <button
                                key={opt.type}
                                type="button"
                                onClick={() => setValue(opt.type, 'scoreType')}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                                    state.scoreType === opt.type
                                        ? 'bg-purple-600/40 border-purple-400/60 shadow-lg shadow-purple-500/20'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <span className="text-2xl">{opt.icon}</span>
                                <span
                                    className={`text-xs font-semibold ${state.scoreType === opt.type ? 'text-purple-200' : 'text-white/70'}`}
                                >
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-white/35 text-xs text-center">
                        {scoreTypeOptions.find((o) => o.type === state.scoreType)?.description}
                    </p>
                </div>

                {state.apiError && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                        <span className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                        <span>{state.apiError}</span>
                    </div>
                )}

                <button
                    onClick={handleCreateRoom}
                    disabled={state.hasError || state.isLoading}
                    className={`w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-white tracking-wide transition-all flex items-center justify-center gap-2 ${
                        state.hasError || state.isLoading
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5'
                    }`}
                >
                    {state.isLoading ? (
                        <>
                            <span className="fa fa-spinner fa-spin" />
                            Creating Room...
                        </>
                    ) : (
                        <>
                            <span className="fa fa-rocket" />
                            Create Room
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
