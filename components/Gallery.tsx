import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '@/hooks/useModalBackHandler';
import { loadImage } from '@/lib/image-loader.ts';
import { weddingData } from '@/data/content';

interface GalleryProps {
    onModalStateChange: (isOpen: boolean) => void;
}

// 갤러리 사진 17장
const IMAGE_NAMES = [
    'wedding-01', 'wedding-02', 'wedding-03', 'wedding-04',
    'wedding-05', 'wedding-06', 'wedding-07', 'wedding-08',
    'wedding-09', 'wedding-10', 'wedding-11', 'wedding-12',
    'wedding-13', 'wedding-17', 'wedding-14', 'wedding-15',
    'wedding-18'
];

const Gallery: React.FC<GalleryProps> = ({ onModalStateChange }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [dragConstraints, setDragConstraints] = useState(0);

    const carouselRef = useRef<HTMLDivElement>(null);
    const popupTouchStart = useRef<{ x: number; y: number } | null>(null);

    const images = useMemo(
        () => IMAGE_NAMES.map(name => loadImage(name)),
        []
    );

    const isPopupOpen = selectedImage !== null;

    const closePopup = useCallback(() => {
        popupTouchStart.current = null;
        setSelectedImage(null);
    }, []);

    useModalBackHandler(isPopupOpen, closePopup);

    // 작은 사진 목록의 가로 드래그 범위
    useEffect(() => {
        const updateConstraints = () => {
            const carousel = carouselRef.current;
            if (!carousel) return;

            setDragConstraints(
                Math.max(0, carousel.scrollWidth - carousel.clientWidth)
            );
        };

        updateConstraints();

        const timer = window.setTimeout(updateConstraints, 500);
        window.addEventListener('resize', updateConstraints);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('resize', updateConstraints);
        };
    }, [images]);

    // 사진을 넘길 때는 잠금을 유지하고,
    // 팝업을 열거나 닫을 때만 상태 변경
    useEffect(() => {
        onModalStateChange(isPopupOpen);

        if (!isPopupOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
            onModalStateChange(false);
        };
    }, [isPopupOpen, onModalStateChange]);

    // PC 버튼과 모바일 스와이프가 동일한 함수 사용
    const showNextImage = () => {
        setSelectedImage(current => {
            if (current === null) return null;

            const currentIndex = images.indexOf(current);
            return images[(currentIndex + 1) % images.length];
        });
    };

    const showPrevImage = () => {
        setSelectedImage(current => {
            if (current === null) return null;

            const currentIndex = images.indexOf(current);
            return images[
                (currentIndex - 1 + images.length) % images.length
            ];
        });
    };

    // 확대 사진은 움직이지 않고 터치 시작 위치만 기록
    const handlePopupTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();

        if (e.touches.length !== 1) {
            popupTouchStart.current = null;
            return;
        }

        popupTouchStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handlePopupTouchMove = (e: React.TouchEvent) => {
        e.stopPropagation();

        if (e.touches.length !== 1) {
            popupTouchStart.current = null;
        }
    };

    // 손을 떼면 가로 방향을 확인해 사진 교체
    const handlePopupTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();

        const start = popupTouchStart.current;
        popupTouchStart.current = null;

        if (!start || e.touches.length > 0) return;

        const end = e.changedTouches[0];
        if (!end) return;

        const deltaX = end.clientX - start.x;
        const deltaY = end.clientY - start.y;

        if (
            Math.abs(deltaX) < 30 ||
            Math.abs(deltaX) <= Math.abs(deltaY) * 1.2
        ) {
            return;
        }

        if (deltaX < 0) {
            showNextImage();
        } else {
            showPrevImage();
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-white px-6 pb-6 md:px-12 md:pb-12 overflow-hidden">
            {/* 헤더 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center pt-8 pb-10"
            >
                <p className="text-[10px] font-joseon text-gray-400 tracking-[0.4em] uppercase mb-1">
                    {weddingData.gallery.label}
                </p>

                <h2 className="text-2xl font-myeongjo text-gray-800 mb-6 leading-tight">
                    {weddingData.gallery.title}
                </h2>

                <div className="w-8 h-[1px] bg-gray-200 mx-auto mb-6" />

                <p className="text-sm font-gowoon text-gray-500">
                    {weddingData.gallery.subtitle}
                </p>
            </motion.div>

            {/* 작은 사진 목록 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative w-full max-w-4xl flex flex-col items-center min-h-[50vh] md:min-h-[600px]"
            >
                <motion.div
                    ref={carouselRef}
                    className="w-full overflow-hidden cursor-grab h-full py-4"
                    whileTap={{ cursor: 'grabbing' }}
                >
                    <motion.div
                        className="flex gap-4 h-full items-center"
                        drag="x"
                        dragConstraints={{ right: 0, left: -dragConstraints }}
                        dragTransition={{
                            bounceStiffness: 200,
                            bounceDamping: 20
                        }}
                        style={{ willChange: 'transform' }}
                    >
                        {images.map((image, index) => (
                            <div
                                key={IMAGE_NAMES[index]}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    popupTouchStart.current = null;
                                    setSelectedImage(image);
                                }}
                                onTouchEnd={(e) => e.stopPropagation()}
                                className="flex-shrink-0 aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-gray-100 interactive relative"
                                style={{ width: '80vw', maxWidth: '400px' }}
                            >
                                <img
                                    src={image}
                                    alt={`웨딩사진 ${index + 1}`}
                                    decoding="async"
                                    draggable={false}
                                    className="w-full h-full object-cover pointer-events-none"
                                    style={{
                                        WebkitTouchCallout: 'none',
                                        WebkitUserSelect: 'none',
                                        userSelect: 'none'
                                    }}
                                />
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* 확대 팝업 */}
            <AnimatePresence>
                {selectedImage !== null && (
                    <motion.div
                        key="gallery-popup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={closePopup}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-label="웨딩사진 크게 보기"
                    >
                        {/* 이전 사진 버튼 */}
                        <button
                            type="button"
                            aria-label="이전 사진"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-20 p-4 transition-colors hidden md:block"
                            onClick={(e) => {
                                e.stopPropagation();
                                showPrevImage();
                            }}
                        >
                            <i className="fa-solid fa-chevron-left text-3xl" />
                        </button>

                        {/* 다음 사진 버튼 */}
                        <button
                            type="button"
                            aria-label="다음 사진"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-20 p-4 transition-colors hidden md:block"
                            onClick={(e) => {
                                e.stopPropagation();
                                showNextImage();
                            }}
                        >
                            <i className="fa-solid fa-chevron-right text-3xl" />
                        </button>

                        {/* 모바일에서는 스와이프 방향만 감지 */}
                        <div
                            className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden"
                            style={{ touchAction: 'pan-y pinch-zoom' }}
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={handlePopupTouchStart}
                            onTouchMove={handlePopupTouchMove}
                            onTouchEnd={handlePopupTouchEnd}
                            onTouchCancel={() => {
                                popupTouchStart.current = null;
                            }}
                        >
                            <img
                                src={selectedImage}
                                alt="확대된 웨딩사진"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="max-w-[95vw] max-h-[85vh] md:max-w-[80vw] lg:max-w-4xl object-contain shadow-2xl no-context-menu"
                                style={{
                                    WebkitTouchCallout: 'none',
                                    WebkitUserSelect: 'none',
                                    userSelect: 'none'
                                }}
                            />
                        </div>

                        {/* 닫기 버튼 */}
                        <button
                            type="button"
                            aria-label="사진 닫기"
                            onClick={(e) => {
                                e.stopPropagation();
                                closePopup();
                            }}
                            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-20 p-2"
                        >
                            <i className="fa-solid fa-xmark text-3xl" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Gallery;