import { useState } from 'react';
import { searchPlaces } from '../../services/tmapService';

export default function LocationSearch({ label, placeholder, value = '', onSelect }) {
    const [keyword, setKeyword] = useState(value);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // 엔터키를 누르면 Tmap API로 장소 검색 요청!
    const handleSearch = async (e) => {
        if (e.key === 'Enter' && keyword.trim()) {
            setIsSearching(true);
            try {
                const places = await searchPlaces(keyword);
                setResults(places); // 검색 결과 목록 저장
                if (places.length === 0) alert("검색 결과가 없습니다.");
            } catch {
                alert("검색 중 오류가 발생했습니다.");
            } finally {
                setIsSearching(false);
            }
        }
    };

    // 목록에서 장소를 클릭했을 때 실행
    const handleSelect = (place) => {
        setKeyword(place.name); // 검색창 글씨를 선택한 장소명으로 변경
        setResults([]);         // 드롭다운 목록 닫기

        // 부모 컴포넌트(App.jsx)로 좌표와 장소명 올려보내기!
        onSelect({ lat: place.lat, lng: place.lng, name: place.name });
    };

    return (
        <div className="relative w-full flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleSearch}
                placeholder={placeholder}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* 검색 중 표시 */}
            {isSearching && <div className="text-sm text-blue-500 mt-1">검색 중...</div>}

            {/* 검색 결과 드롭다운 */}
            {results.length > 0 && (
                <ul className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((place, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(place)}
                            className="p-3 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                            <div className="font-bold text-gray-800">{place.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{place.address}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
