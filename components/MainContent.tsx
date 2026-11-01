import React, { forwardRef, useEffect, useRef } from 'react';
import Intro from './Intro';
import Profiles from './Profiles';
import Gallery from './Gallery';
import Location from './Location';
import Rsvp from './Rsvp';
import Gift from './Gift';
import Guestbook from './Guestbook';
import Closing from './Closing';

interface MainContentProps {
    onModalStateChange: (isOpen: boolean) => void;
    onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
    onActiveSectionChange?: (sectionId: string) => void;
}

const SECTIONS = [
    'intro',
    'rsvp',
    'profiles',
    'gallery',
    'location',
    'gift',
    'guestbook'
];

const SectionDivider = () => (
    <div className="py-28 flex items-center justify-center opacity-30">
        <div className="w-16 h-[1px] bg-[#3c1e1e]" />
        <div className="mx-2 text-[#3c1e1e] font-serif text-xs">
            ❦
        </div>
        <div className="w-16 h-[1px] bg-[#3c1e1e]" />
    </div>
);

const MainContent = forwardRef<HTMLDivElement, MainContentProps>(
    (
        {
            onModalStateChange,
            onScroll,
            onActiveSectionChange
        },
        forwardedRef
    ) => {
        const containerRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            const container = containerRef.current;

            if (!container || !onActiveSectionChange) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            onActiveSectionChange(entry.target.id);
                        }
                    });
                },
                {
                    root: container,
                    threshold: 0.1,
                    rootMargin: '-5% 0px -50% 0px'
                }
            );

            SECTIONS.forEach((sectionId) => {
                const element = container.querySelector(
                    `#${sectionId}`
                );

                if (element) observer.observe(element);
            });

            return () => observer.disconnect();
        }, [onActiveSectionChange]);

        return (
            <div
                ref={(element) => {
                    containerRef.current = element;

                    if (typeof forwardedRef === 'function') {
                        forwardedRef(element);
                    } else if (forwardedRef) {
                        forwardedRef.current = element;
                    }
                }}
                className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#f8f8f8]"
                onScroll={onScroll}
            >
                <div className="pb-8" />

                <section id="intro">
                    <Intro />
                </section>

                <SectionDivider />

                <section id="rsvp">
                    <Rsvp onModalStateChange={onModalStateChange} />
                </section>

                <SectionDivider />

                <section id="profiles">
                    <Profiles onModalStateChange={onModalStateChange} />
                </section>

                <SectionDivider />

                <section id="gallery">
                    <Gallery onModalStateChange={onModalStateChange} />
                </section>

                <SectionDivider />

                <section id="location">
                    <Location />
                </section>

                <SectionDivider />

                <section id="gift">
                    <Gift />
                </section>

                <SectionDivider />

                <section id="guestbook">
                    <Guestbook onModalStateChange={onModalStateChange} />
                </section>

                <Closing />
            </div>
        );
    }
);

MainContent.displayName = 'MainContent';

export default MainContent;