import React, { useEffect, useState } from 'react';
import { useModalBackHandler } from '@/hooks/useModalBackHandler';
import { weddingData } from '@/data/content';

interface GuestbookEntry {
    id: string;
    name: string;
    message: string;
    createdAt: string | null;
}

interface GuestbookProps {
    onModalStateChange: (isOpen: boolean) => void;
}

type PopupMode = 'write' | 'edit' | null;

interface ApiResponse {
    entries?: GuestbookEntry[];
    success?: boolean;
    error?: string;
}

async function requestGuestbook(
    payload?: Record<string, unknown>,
    signal?: AbortSignal
): Promise<ApiResponse> {
    const response = await fetch('/api/guestbook', {
        method: payload ? 'POST' : 'GET',
        cache: 'no-store',
        signal,
        ...(payload
            ? {
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(payload)
              }
            : {})
    });

    let result: ApiResponse;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            '방명록 서버에 연결하지 못했습니다. 배포 상태를 확인해주세요.'
        );
    }

    if (!response.ok) {
        throw new Error(
            result.error || '요청을 처리하지 못했습니다.'
        );
    }

    return result;
}

function formatDate(value: string | null) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

const Guestbook: React.FC<GuestbookProps> = ({
    onModalStateChange
}) => {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [busy, setBusy] = useState(false);
    const [visibleCount, setVisibleCount] = useState(3);

    const [popupMode, setPopupMode] = useState<PopupMode>(null);
    const [editingEntry, setEditingEntry] =
        useState<GuestbookEntry | null>(null);

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [formError, setFormError] = useState('');
    const [notice, setNotice] = useState('');

    const isPopupOpen = popupMode !== null;

    const closePopup = () => {
        if (busy) return;

        setPopupMode(null);
        setEditingEntry(null);
        setName('');
        setPassword('');
        setMessage('');
        setFormError('');
    };

    useModalBackHandler(isPopupOpen, closePopup);

    useEffect(() => {
        onModalStateChange(isPopupOpen);

        return () => {
            onModalStateChange(false);
        };
    }, [isPopupOpen, onModalStateChange]);

    useEffect(() => {
        if (!isPopupOpen) return;

        const preventBackgroundScroll = (event: Event) => {
            const target = event.target;

            if (
                target instanceof Element &&
                target.closest('[data-guestbook-dialog]')
            ) {
                return;
            }

            event.preventDefault();
        };

        window.addEventListener(
            'wheel',
            preventBackgroundScroll,
            { passive: false }
        );

        window.addEventListener(
            'touchmove',
            preventBackgroundScroll,
            { passive: false }
        );

        return () => {
            window.removeEventListener(
                'wheel',
                preventBackgroundScroll
            );

            window.removeEventListener(
                'touchmove',
                preventBackgroundScroll
            );
        };
    }, [isPopupOpen]);

    useEffect(() => {
        const controller = new AbortController();

        requestGuestbook(undefined, controller.signal)
            .then((result) => {
                setEntries(result.entries || []);
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;

                setListError(
                    error instanceof Error
                        ? error.message
                        : '방명록을 불러오지 못했습니다.'
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setListLoading(false);
                }
            });

        return () => controller.abort();
    }, []);

    const refreshEntries = async () => {
        setListError('');

        try {
            const result = await requestGuestbook();
            setEntries(result.entries || []);
        } catch (error) {
            setListError(
                error instanceof Error
                    ? error.message
                    : '목록을 불러오지 못했습니다.'
            );
        }
    };

    const openWritePopup = () => {
        setEditingEntry(null);
        setName('');
        setPassword('');
        setMessage('');
        setFormError('');
        setNotice('');
        setPopupMode('write');
    };

    const openEditPopup = (entry: GuestbookEntry) => {
        setEditingEntry(entry);
        setName(entry.name);
        setPassword('');
        setMessage(entry.message);
        setFormError('');
        setNotice('');
        setPopupMode('edit');
    };

    const handleSave = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (busy) return;

        const trimmedName = name.trim();
        const trimmedMessage = message.trim();

        if (!trimmedName || trimmedName.length > 30) {
            setFormError('이름은 1~30자로 입력해주세요.');
            return;
        }

        if (!/^\d{4}$/.test(password)) {
            setFormError('비밀번호는 숫자 4자리로 입력해주세요.');
            return;
        }

        if (!trimmedMessage || trimmedMessage.length > 200) {
            setFormError('메시지는 1~200자로 입력해주세요.');
            return;
        }

        if (popupMode === 'edit' && !editingEntry) return;

        setBusy(true);
        setFormError('');

        try {
            const isEditing = popupMode === 'edit';

            await requestGuestbook({
                action: isEditing ? 'update' : 'create',
                ...(isEditing
                    ? { id: editingEntry!.id }
                    : { name: trimmedName }),
                password,
                message: trimmedMessage
            });

            setPopupMode(null);
            setEditingEntry(null);
            setName('');
            setPassword('');
            setMessage('');

            setNotice(
                isEditing
                    ? '방명록을 수정했습니다.'
                    : '축하 메시지를 남겼습니다.'
            );

            await refreshEntries();
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : '저장하지 못했습니다.'
            );
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (busy || !editingEntry) return;

        if (!/^\d{4}$/.test(password)) {
            setFormError(
                '작성할 때 정한 숫자 4자리 비밀번호를 입력해주세요.'
            );
            return;
        }

        if (!window.confirm('이 방명록을 삭제할까요?')) return;

        setBusy(true);
        setFormError('');

        try {
            await requestGuestbook({
                action: 'delete',
                id: editingEntry.id,
                password
            });

            setEntries((previous) =>
                previous.filter(
                    (entry) => entry.id !== editingEntry.id
                )
            );

            setPopupMode(null);
            setEditingEntry(null);
            setPassword('');
            setMessage('');
            setName('');
            setNotice('방명록을 삭제했습니다.');
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : '삭제하지 못했습니다.'
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center bg-white pb-20">
            <div className="text-center pt-8 pb-10 px-6">
                <p className="text-[10px] font-joseon text-gray-400 tracking-[0.4em] uppercase mb-1">
                    {weddingData.guestbook.label}
                </p>

                <h2 className="text-2xl font-myeongjo text-gray-800 mb-6">
                    {weddingData.guestbook.title}
                </h2>

                <div className="w-8 h-[1px] bg-gray-200 mx-auto mb-8" />

                <p className="text-sm font-gowoon text-gray-500">
                    {weddingData.guestbook.subtitle}
                </p>
            </div>

            <div className="w-full max-w-sm px-6 space-y-4">
                {notice && (
                    <p
                        role="status"
                        className="text-center text-sm text-gray-600 py-3"
                    >
                        {notice}
                    </p>
                )}

                {listLoading ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                        방명록을 불러오는 중입니다.
                    </p>
                ) : listError ? (
                    <div
                        role="alert"
                        className="text-center space-y-3 py-6"
                    >
                        <p className="text-sm text-red-600">
                            {listError}
                        </p>
                        <button
                            type="button"
                            onClick={refreshEntries}
                            className="text-sm text-gray-600 underline"
                        >
                            다시 불러오기
                        </button>
                    </div>
                ) : entries.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8 font-gowoon">
                        첫 번째 축하 메시지를 남겨주세요.
                    </p>
                ) : (
                    entries
                        .slice(0, visibleCount)
                        .map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
                            >
                                <p className="text-[14px] leading-relaxed text-gray-700 font-nanumsquare mb-6 whitespace-pre-wrap break-words">
                                    {entry.message}
                                </p>

                                <div className="flex justify-between items-center gap-2 text-[11px] font-nanumsquare">
                                    <span className="text-gray-500 break-all">
                                        From {entry.name}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditPopup(entry)
                                        }
                                        className="text-gray-500 underline shrink-0"
                                    >
                                        수정·삭제
                                    </button>
                                </div>

                                <p className="text-[10px] text-gray-400 mt-3">
                                    {formatDate(entry.createdAt)}
                                </p>
                            </div>
                        ))
                )}

                {entries.length > visibleCount && (
                    <button
                        type="button"
                        onClick={() =>
                            setVisibleCount(
                                (previous) => previous + 10
                            )
                        }
                        className="w-full py-3 text-xs text-gray-500"
                    >
                        더 보기
                    </button>
                )}

                {visibleCount > 3 && entries.length > 3 && (
                    <button
                        type="button"
                        onClick={() => setVisibleCount(3)}
                        className="w-full py-3 text-xs text-gray-500"
                    >
                        접기
                    </button>
                )}

                <button
                    type="button"
                    onClick={openWritePopup}
                    className="w-full py-4 bg-[#8E8E8E] text-white rounded-xl text-sm font-nanumsquare hover:bg-[#7a7a7a] shadow-lg interactive"
                >
                    {weddingData.guestbook.button}
                </button>
            </div>

            {isPopupOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    onTouchStart={(event) =>
                        event.stopPropagation()
                    }
                    onTouchEnd={(event) =>
                        event.stopPropagation()
                    }
                    onWheel={(event) =>
                        event.stopPropagation()
                    }
                >
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={closePopup}
                    />

                    <div
                        data-guestbook-dialog
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="guestbook-dialog-title"
                        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto overscroll-contain"
                        style={{
                            maxHeight: '85dvh',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <button
                            type="button"
                            onClick={closePopup}
                            disabled={busy}
                            aria-label="방명록 창 닫기"
                            className="absolute top-5 right-5 text-gray-500 text-xl disabled:opacity-40"
                        >
                            ×
                        </button>

                        <h3
                            id="guestbook-dialog-title"
                            className="text-center text-xl font-myeongjo text-gray-800 mb-3"
                        >
                            {popupMode === 'write'
                                ? '축하 메시지 남기기'
                                : '방명록 수정·삭제'}
                        </h3>

                        <p className="text-center text-xs text-gray-500 mb-6 leading-relaxed">
                            {popupMode === 'write'
                                ? '이름과 메시지는 다른 방문자에게도 공개됩니다.'
                                : '작성할 때 정한 비밀번호를 입력해주세요.'}
                        </p>

                        <form
                            onSubmit={handleSave}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="guestbook-name"
                                    className="block text-xs text-gray-600 mb-2"
                                >
                                    이름
                                </label>

                                <input
                                    id="guestbook-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    maxLength={30}
                                    readOnly={popupMode === 'edit'}
                                    disabled={busy}
                                    required
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 read-only:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="guestbook-password"
                                    className="block text-xs text-gray-600 mb-2"
                                >
                                    비밀번호 · 숫자 4자리
                                </label>

                                <input
                                    id="guestbook-password"
                                    type="password"
                                    inputMode="numeric"
                                    autoComplete={
                                        popupMode === 'write'
                                            ? 'new-password'
                                            : 'current-password'
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 4)
                                        )
                                    }
                                    maxLength={4}
                                    disabled={busy}
                                    required
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="guestbook-message"
                                    className="block text-xs text-gray-600 mb-2"
                                >
                                    축하 메시지
                                </label>

                                <textarea
                                    id="guestbook-message"
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(
                                            event.target.value
                                        )
                                    }
                                    maxLength={200}
                                    disabled={busy}
                                    required
                                    rows={5}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none"
                                />

                                <p className="text-right text-xs text-gray-400 mt-1">
                                    {message.length}/200
                                </p>
                            </div>

                            {formError && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-600 leading-relaxed"
                                >
                                    {formError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full py-4 bg-[#8E8E8E] text-white rounded-xl text-sm disabled:opacity-50"
                            >
                                {busy
                                    ? '처리 중…'
                                    : popupMode === 'write'
                                      ? '메시지 남기기'
                                      : '수정 저장'}
                            </button>

                            {popupMode === 'edit' && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={busy}
                                    className="w-full py-3 border border-red-200 text-red-600 rounded-xl text-sm disabled:opacity-50"
                                >
                                    이 글 삭제
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Guestbook;