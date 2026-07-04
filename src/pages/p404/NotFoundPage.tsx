import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-[var(--primary-color)]">404</h1>
                <h2 className="text-3xl font-semibold text-[var(--text-primary)] mt-4">Page Not Found</h2>
                <p className="text-[var(--text-secondary)] mt-4 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-[var(--primary-color)] text-white rounded-lg
            hover:bg-[var(--primary-hover)] transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}
