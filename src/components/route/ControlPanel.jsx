import React from 'react';

export default function ControlPanel({ persona, setPersona, requestHour, setRequestHour }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-center justify-between mb-4">

            {/* 1. 페르소나 선택 드롭다운 */}
            <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-700 mb-2">사용자 유형 (페르소나)</label>
                <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 transition-colors"
                >
                    <option value="general">🟢 일반 추천 (최단거리 + 안전)</option>
                    <option value="women">🔵 여성 안심 (치안 + 밝은 조도 우선)</option>
                    <option value="senior">🟠 노약자 맞춤 (가파른 경사도 회피)</option>
                </select>
            </div>

            {/* 2. 요청 시간 슬라이더 */}
            <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    출발 시간: <span className="text-blue-600 text-lg">{requestHour}시</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="23"
                    value={requestHour}
                    onChange={(e) => setRequestHour(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 px-1 mt-2 font-medium">
                    <span>0시(자정)</span>
                    <span>12시(정오)</span>
                    <span>23시</span>
                </div>
            </div>

        </div>
    );
}