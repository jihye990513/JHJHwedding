import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hero from './components/Hero';
import MainContent from './components/MainContent';
import OpeningSequence from './components/OpeningSequence';
import ShareButton from './components/ShareButton';
import ForsythiaParticles from './components/ForsythiaParticles';
import { preloadGalleryImages } from './lib/image-loader';
import AdminPage from './components/Admin/AdminPage';
import ThankYou from './components/ThankYou';

const SECTIONS = ['hero', 'main'];

const WeddingApp: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showBrowserPrompt, setShowBrowserPrompt] = useState(false);
  const [showOpening, setShowOpening] = useState(true);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  // 데모용 감사 화면 전환
  const [isAfterWedding, setIsAfterWedding] = useState(false);

  const touchStartY = useRef(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollLockedRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    preloadGalleryImages();
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const finishOpening = useCallback(() => {
    setShowOpening(false);
  }, []);

  const openInExternalBrowser = () => {
    const currentUrl = window.location.href;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    if (isAndroid) {
      window.location.href =
        `intent://${currentUrl.replace(/^https?:\/\//, '')}` +
        '#Intent;scheme=https;package=com.android.chrome;end;';
    } else if (isIOS) {
      window.location.href =
        `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
    }
  };

  const handleScroll = useCallback((delta: number) => {
    if (
      scrollLockedRef.current ||
      isAnyModalOpen ||
      isAfterWedding ||
      delta === 0
    ) {
      return;
    }

    // 오프닝 중에도 스크롤하면 즉시 닫기
    setShowOpening(false);

    const moveToSection = (index: number) => {
      scrollLockedRef.current = true;
      setIsScrolling(true);
      setCurrentIdx(index);

      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      scrollTimerRef.current = setTimeout(() => {
        scrollLockedRef.current = false;
        setIsScrolling(false);
      }, 800);
    };

    if (currentIdx === 1) {
      if (
        mainContentRef.current &&
        mainContentRef.current.scrollTop <= 0 &&
        delta < 0
      ) {
        moveToSection(0);
      }

      return;
    }

    if (delta > 0 && currentIdx < SECTIONS.length - 1) {
      moveToSection(currentIdx + 1);
    } else if (delta < 0 && currentIdx > 0) {
      moveToSection(currentIdx - 1);
    }
  }, [currentIdx, isAnyModalOpen, isAfterWedding]);

  // 모바일 주소창 자동 숨김
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const hideAddressBar = () => {
      timers.push(setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100));

      timers.push(setTimeout(() => {
        window.scrollTo(0, 0);
      }, 300));
    };

    hideAddressBar();
    window.addEventListener('orientationchange', hideAddressBar);

    return () => {
      window.removeEventListener('orientationchange', hideAddressBar);
      timers.forEach(clearTimeout);
    };
  }, []);

  // 마우스 휠 · 모바일 스와이프
  useEffect(() => {
    if (isAfterWedding) return;

    const onWheel = (event: WheelEvent) => {
      if (currentIdx !== 1) {
        handleScroll(event.deltaY);
      } else if (
        mainContentRef.current &&
        mainContentRef.current.scrollTop <= 0 &&
        event.deltaY < 0
      ) {
        handleScroll(event.deltaY);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY.current = event.touches[0].clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touchEndY = event.changedTouches[0].clientY;
      const delta = touchStartY.current - touchEndY;

      if (Math.abs(delta) <= 50) return;

      if (currentIdx !== 1) {
        handleScroll(delta);
      } else if (
        mainContentRef.current &&
        mainContentRef.current.scrollTop <= 0 &&
        delta < 0
      ) {
        handleScroll(delta);
      }
    };

    window.addEventListener('wheel', onWheel);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleScroll, currentIdx, isAfterWedding]);

  // 조작하지 않으면 기존처럼 자동 이동
  useEffect(() => {
    if (
      currentIdx !== 0 ||
      showOpening ||
      isAnyModalOpen ||
      isAfterWedding ||
      isScrolling
    ) {
      return;
    }

    const timer = setTimeout(() => {
      handleScroll(100);
    }, 3500);

    return () => clearTimeout(timer);
  }, [
    currentIdx,
    showOpening,
    isAnyModalOpen,
    isAfterWedding,
    isScrolling,
    handleScroll
  ]);

  // PC 마우스 드래그
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isAfterWedding) return;

    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;
    let isDraggingAction = false;

    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const handleMouseDown = (event: MouseEvent) => {
      if (isTouchDevice || isAnyModalOpen || event.button !== 0) return;

      const target = event.target as HTMLElement;

      if (
        target.closest(
          'button, a, input, textarea, [role="button"], .interactive'
        )
      ) {
        return;
      }

      isDown = true;
      isDraggingAction = false;
      startY = event.clientY;

      container.style.cursor = 'grabbing';

      if (currentIdx === 1 && mainContentRef.current) {
        startScrollTop = mainContentRef.current.scrollTop;
      }

      document.body.style.userSelect = 'none';

      if (currentIdx === 0) {
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDown) return;

      event.preventDefault();

      const deltaY = startY - event.clientY;

      if (Math.abs(deltaY) > 5) {
        isDraggingAction = true;
      }

      if (currentIdx === 1 && mainContentRef.current) {
        mainContentRef.current.scrollTop =
          startScrollTop + deltaY * 2.5;
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!isDown) return;

      isDown = false;
      container.style.cursor = currentIdx === 1 ? 'grab' : 'default';
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (currentIdx === 0 && isDraggingAction) {
        const deltaY = startY - event.clientY;

        if (deltaY > 30) {
          handleScroll(100);
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    container.style.cursor =
      !isTouchDevice && currentIdx === 1 ? 'grab' : 'default';

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      container.style.cursor = '';
    };
  }, [currentIdx, isAnyModalOpen, isAfterWedding, handleScroll]);

  if (isAfterWedding) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex justify-center items-center overflow-hidden">
        <div className="relative w-full h-full max-w-[430px] md:max-w-[550px] bg-[#f8f8f8] shadow-2xl overflow-hidden">
          <ThankYou onModalStateChange={setIsAnyModalOpen} />

          <button
            onClick={() => setIsAfterWedding(false)}
            className="absolute bottom-6 right-6 z-[9999] bg-gray-800/90 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold tracking-wide hover:bg-black transition-colors flex items-center gap-2 backdrop-blur-md"
          >
            <i className="fa-regular fa-envelope"></i>
            <span>청첩장 보기</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 flex justify-center items-center overflow-hidden">
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[430px] md:max-w-[550px] bg-[#f8f8f8] shadow-2xl overflow-hidden select-none"
      >
        {showOpening && (
          <OpeningSequence onComplete={finishOpening} />
        )}

        <ForsythiaParticles />

        {showBrowserPrompt && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-8 max-w-sm mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🌐</div>

                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  더 나은 경험을 위해
                </h3>

                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                  카카오톡 브라우저보다 외부 브라우저에서
                  <br />
                  더 빠르고 부드럽게 감상할 수 있습니다.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBrowserPrompt(false)}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95"
                  >
                    계속 보기
                  </button>

                  <button
                    onClick={openInExternalBrowser}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold hover:shadow-lg transition-all active:scale-95"
                  >
                    브라우저 열기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={SECTIONS[currentIdx]}
            initial={{ opacity: 0, y: currentIdx === 1 ? 20 : 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="h-full w-full will-change-transform transform-gpu"
          >
            {currentIdx === 0 && (
              <Hero startAnimation={!showOpening} />
            )}

            {currentIdx === 1 && (
              <MainContent
                ref={mainContentRef}
                onModalStateChange={setIsAnyModalOpen}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {currentIdx >= 1 && <ShareButton />}

        {!isAnyModalOpen && (
          <button
            onClick={() => setIsAfterWedding(true)}
            className="absolute bottom-6 right-6 z-[9999] bg-gray-800/90 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold tracking-wide hover:bg-black transition-colors flex items-center gap-2 backdrop-blur-md"
          >
            <i className="fa-solid fa-gift"></i>
            <span>감사인사 보기</span>
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const isAdminMode =
    new URLSearchParams(window.location.search).get('admin') === 'true';

  return isAdminMode ? <AdminPage /> : <WeddingApp />;
};

export default App;