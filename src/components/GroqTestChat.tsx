'use client';

import { useState } from 'react';

/**
 * Example Component to test the Groq API Integration.
 * Can be imported into any page to verify functionality.
 */
export default function GroqTestChat() {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch response');
            }

            setResponse(data.reply);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 border rounded-lg shadow-sm bg-white mt-8">
            <h2 className="text-lg font-bold mb-4 text-gray-800">🤖 AI Tutor Test (Groq)</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                        Đặt câu hỏi cho AI:
                    </label>
                    <input
                        id="question"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ví dụ: Giải thích định luật Newton..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Đang suy nghĩ...' : 'Gửi câu hỏi'}
                </button>
            </form>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                    ⚠️ Error: {error}
                </div>
            )}

            {/* Result */}
            {response && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-1">AI Trả lời:</p>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{response}</p>
                </div>
            )}
        </div>
    );
}
