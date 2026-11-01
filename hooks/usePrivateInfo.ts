import { useState, useEffect } from 'react';

/**
 * [NEW] 민감정보 API 호출 커스텀 훅
 * 
 * /api/private-info에서 개인정보를 가져옵니다.
 * 로딩 상태, 에러 처리, 캐싱을 지원합니다.
 * 
 * @author gayul.kim
 * @since 2026-01-31
 */

// API 응답 타입 정의
interface ParentInfo {
    name: string;
    phone: string;
}

interface PersonInfo {
    name: string;
    firstName: string;
    phone: string;
    parents: {
        mother?: ParentInfo;
        father?: ParentInfo;
        relation: string;
    };
}

interface AccountInfo {
    bank: string;
    name: string;
    num: string;
}

interface PrivateInfo {
    groom: PersonInfo;
    bride: PersonInfo;
    accounts: {
        groom: AccountInfo[];
        bride: AccountInfo[];
    };
    images: {
        hero: string;
        gallery: string[];
        closing: string;
    };
}

// 캐싱을 위한 전역 변수
let cachedData: PrivateInfo | null = null;
let fetchPromise: Promise<PrivateInfo> | null = null;

export function usePrivateInfo() {
    const [data, setData] = useState<PrivateInfo | null>(cachedData);
    const [loading, setLoading] = useState(!cachedData);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // 이미 캐시된 데이터가 있으면 사용
        if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return;
        }

        // 이미 진행 중인 요청이 있으면 대기
        if (fetchPromise) {
            fetchPromise
                .then((result) => {
                    setData(result);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err);
                    setLoading(false);
                });
            return;
        }

        // 서버에서 개인정보 가져오기
        const fetchData = async (): Promise<PrivateInfo> => {
            const response = await fetch('/api/private-info');

            if (!response.ok) {
                throw new Error('개인정보를 불러오지 못했습니다.');
            }

            return response.json();
        };

        fetchPromise = fetchData();

        fetchPromise
            .then((result) => {
                cachedData = result;
                setData(result);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            })
            .finally(() => {
                fetchPromise = null;
            });
    }, []);

    return { data, loading, error };
}

// 타입 export
export type { PrivateInfo, PersonInfo, AccountInfo };
