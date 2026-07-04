import { useState, useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { usePokerActions } from './actions';

interface JoinRoomState {
    roomId: string;
    name: string;
    email: string;
    isLoading: boolean;
    roomError: string;
    nameError: string;
    emailError: string;
    hasError: boolean;
    apiError: string;
}

export default function JoinRoom() {
    const navigate = useNavigate();
    const { roomId: paramRoomId } = useParams();
    const { joinRoom, loadAuthInfoFromCache } = usePokerActions();

    const [state, setState] = useState<JoinRoomState>({
        roomId: paramRoomId || '',
        name: '',
        email: '',
        isLoading: false,
        roomError: '',
        nameError: '',
        emailError: '',
        hasError: true,
        apiError: '',
    });

    useEffect(() => {
        if (state.roomId) {
            loadAuthInfoFromCache(state.roomId);
        }
    }, [state.roomId, loadAuthInfoFromCache]);

    const setValue = (val: string, field: string) => {
        const newState: any = { ...state, [field]: val };

        newState.roomError = (newState.roomId || '').length < 6 ? 'Room id is too short' : '';
        if (!newState.roomError) {
            newState.roomError = !/^[a-z0-9]*$/g.test(newState.roomId) ? 'Enter room id, not room name.' : '';
        }
        newState.nameError = (newState.name || '').length < 2 ? 'Name is too short' : '';
        newState.emailError = (newState.email || '').length < 5 ? 'Email is too short' : '';

        newState.hasError = !!(newState.roomError || newState.nameError || newState.emailError);

        setState(newState);
    };

    const handleJoinRoom = async () => {
        try {
            setState((s) => ({ ...s, isLoading: true, apiError: '' }));
            const result = await joinRoom(state);
            if (result && typeof result === 'object' && 'roomId' in result) {
                navigate(`/poker/${result.roomId}`);
            } else if (result && typeof result === 'object' && 'field' in result && 'error' in result) {
                setState((s) => ({ ...s, isLoading: false, [(result as any).field]: (result as any).error }));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to join room. Please check the room ID and try again.';
            setState((s) => ({ ...s, isLoading: false, apiError: message }));
            console.error(err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !state.hasError && !state.isLoading) {
            handleJoinRoom();
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <span className="fa fa-sign-in text-white text-sm" />
                </div>
                <h2 className="text-xl font-bold text-white">Join Room</h2>
            </div>

            <div className="space-y-4" onKeyDown={handleKeyDown}>
                <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Room ID <span className="text-emerald-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={state.roomId}
                        onChange={(e) => setValue(e.target.value, 'roomId')}
                        readOnly={!!paramRoomId}
                        maxLength={15}
                        autoFocus={!paramRoomId}
                        placeholder="abc123"
                        className={`w-full border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                            paramRoomId
                                ? 'bg-white/4 border-white/8 cursor-default text-white/70'
                                : state.roomError
                                  ? 'bg-white/8 border-red-500/60 focus:ring-red-500/40'
                                  : 'bg-white/8 border-white/15 focus:ring-emerald-500/40 focus:border-emerald-500/50'
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
                        Your Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={state.name}
                        onChange={(e) => setValue(e.target.value, 'name')}
                        maxLength={15}
                        autoFocus={!!paramRoomId}
                        placeholder="Jane Smith"
                        className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                            state.nameError
                                ? 'border-red-500/60 focus:ring-red-500/40'
                                : 'border-white/15 focus:ring-emerald-500/40 focus:border-emerald-500/50'
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
                        Your Email <span className="text-emerald-400">*</span>
                    </label>
                    <input
                        type="email"
                        value={state.email}
                        onChange={(e) => setValue(e.target.value, 'email')}
                        maxLength={80}
                        placeholder="jane@example.com"
                        className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                            state.emailError
                                ? 'border-red-500/60 focus:ring-red-500/40'
                                : 'border-white/15 focus:ring-emerald-500/40 focus:border-emerald-500/50'
                        }`}
                    />
                    {state.emailError && (
                        <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1">
                            <span className="fa fa-exclamation-circle" />
                            {state.emailError}
                        </p>
                    )}
                </div>

                {state.apiError && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                        <span className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                        <span>{state.apiError}</span>
                    </div>
                )}

                <button
                    onClick={handleJoinRoom}
                    disabled={state.hasError || state.isLoading}
                    className={`w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-white tracking-wide transition-all flex items-center justify-center gap-2 ${
                        state.hasError || state.isLoading
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5'
                    }`}
                >
                    {state.isLoading ? (
                        <>
                            <span className="fa fa-spinner fa-spin" />
                            Joining Room...
                        </>
                    ) : (
                        <>
                            <span className="fa fa-sign-in" />
                            Join Room
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
