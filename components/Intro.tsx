import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '@/hooks/useModalBackHandler';
import { useWeddingData } from '@/hooks/useWeddingData';

interface ContactRowProps {
    label: string;
    name?: string;
    phone?: string;
}

const ContactRow: React.FC<ContactRowProps> = ({
    label,
    name,
    phone
}) => {
    if (!name) return null;

    const canContact = Boolean(phone && /^[+\d\s()-]+$/.test(phone));

    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-600">
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-20">
                    {label}
                </span>
                <span className="text-white">{name}</span>
            </div>

            {canContact && (
                <div className="flex gap-3">
                    <a
                        href={`tel:${phone}`}
                        aria-label={`${label} 전화하기`}
                        className="text-white/80 hover:text-white"
                    >
                        <i className="fa-solid fa-phone" />
                    </a>
                    <a
                        href={`sms:${phone}`}
                        aria-label={`${label} 문자 보내기`}
                        className="text-white/80 hover:text-white"
                    >
                        <i className="fa-solid fa-envelope" />
                    </a>
                </div>
            )}
        </div>
    );
};

const Intro: React.FC = () => {
    const { weddingData } = useWeddingData();
    const [isContactOpen, setIsContactOpen] = useState(false);

    useModalBackHandler(isContactOpen, () => setIsContactOpen(false));

    useEffect(() => {
        if (!isContactOpen) return;

        const preventScroll = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
        };
    }, [isContactOpen]);

    const groom = weddingData.common?.groom;
    const bride = weddingData.common?.bride;
    const groomFather = groom?.parents?.father;
    const groomMother = groom?.parents?.mother;
    const brideFather = bride?.parents?.father;
    const brideMother = bride?.parents?.mother;
    const intro = weddingData.intro;

    return (
        <div className="relative w-full flex flex-col items-center px-8 pb-12 text-center">
            {/* 인사말: 화면 감지나 애니메이션을 기다리지 않고 표시 */}
            <div className="relative z-10 space-y-8 max-w-lg">
                <div className="pt-8 pb-3">
                    <p className="text-[10px] font-joseon text-gray-400 tracking-[0.4em] uppercase mb-1">
                        {intro.label}
                    </p>
                    <h2 className="text-2xl font-myeongjo text-gray-800 mb-6 leading-tight">
                        {intro.title}
                    </h2>
                    <div className="w-8 h-[1px] bg-gray-200 mx-auto mt-2" />
                </div>

                <div className="font-myeongjo text-[12px] leading-relaxed text-gray-700 whitespace-pre-line space-y-6">
                    {intro.mainText}
                </div>

                {/* 양가 부모님 성함 */}
                <div className="space-y-4 pt-4 font-gowoon">
                    <p className="text-base text-gray-700">
                        {(groomFather?.name || groomMother?.name) && (
                            <>
                                <span className="font-normal">
                                    {[
                                        groomFather?.name,
                                        groomMother?.name
                                    ].filter(Boolean).join(' · ')}
                                </span>
                                <span className="text-xs text-gray-400 mx-2">
                                    의 {groom?.parents?.relation || '아들'}
                                </span>
                            </>
                        )}
                        <span className="font-bold text-lg">
                            {groom?.name || '신랑'}
                        </span>
                    </p>

                    <p className="text-base text-gray-700">
                        {(brideFather?.name || brideMother?.name) && (
                            <>
                                <span className="font-normal">
                                    {[
                                        brideFather?.name,
                                        brideMother?.name
                                    ].filter(Boolean).join(' · ')}
                                </span>
                                <span className="text-xs text-gray-400 mx-2">
                                    의 {bride?.parents?.relation || '딸'}
                                </span>
                            </>
                        )}
                        <span className="font-bold text-lg">
                            {bride?.name || '신부'}
                        </span>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsContactOpen(true)}
                    className="mt-8 px-12 py-3 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
                >
                    <i className="fa-solid fa-phone text-xs" />
                    <span>{intro.contactButton}</span>
                </button>
            </div>

            {/* 연락처 모달 */}
            <AnimatePresence>
                {isContactOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsContactOpen(false)}
                        onTouchStart={(event) => event.stopPropagation()}
                        onTouchEnd={(event) => event.stopPropagation()}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
                    >
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="contact-modal-title"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(event) => event.stopPropagation()}
                            className="bg-[#3a3a3a] rounded-2xl p-8 w-full max-w-md relative"
                        >
                            <button
                                type="button"
                                aria-label="연락처 닫기"
                                onClick={() => setIsContactOpen(false)}
                                className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>

                            <div className="text-center mb-8">
                                <p className="text-[10px] text-gray-400 tracking-[0.3em] uppercase mb-2">
                                    {intro.modal.label}
                                </p>
                                <h3
                                    id="contact-modal-title"
                                    className="text-xl text-white font-myeongjo"
                                >
                                    {intro.modal.title}
                                </h3>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">
                                    {intro.modal.groomSide}{' '}
                                    <span className="text-[10px]">
                                        {intro.modal.groomLabel}
                                    </span>
                                </h4>
                                <div className="space-y-3">
                                    <ContactRow
                                        label="신랑"
                                        name={groom?.name}
                                        phone={groom?.phone}
                                    />
                                    <ContactRow
                                        label="신랑 아버지"
                                        name={groomFather?.name}
                                        phone={groomFather?.phone}
                                    />
                                    <ContactRow
                                        label="신랑 어머니"
                                        name={groomMother?.name}
                                        phone={groomMother?.phone}
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">
                                    {intro.modal.brideSide}{' '}
                                    <span className="text-[10px]">
                                        {intro.modal.brideLabel}
                                    </span>
                                </h4>
                                <div className="space-y-3">
                                    <ContactRow
                                        label="신부"
                                        name={bride?.name}
                                        phone={bride?.phone}
                                    />
                                    <ContactRow
                                        label="신부 아버지"
                                        name={brideFather?.name}
                                        phone={brideFather?.phone}
                                    />
                                    <ContactRow
                                        label="신부 어머니"
                                        name={brideMother?.name}
                                        phone={brideMother?.phone}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Intro;