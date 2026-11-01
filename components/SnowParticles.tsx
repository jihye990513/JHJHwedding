import React from 'react';

const snowflakes = Array.from({ length: 24 }, (_, index) => ({
    left: `${(index * 43.7) % 100}%`,
    size: 2 + (index % 4) * 0.5,
    duration: 14 + (index % 7) * 2,
    delay: -(index * 2.3),
    opacity: 0.05 + (index % 4) * 0.05,
    drift: index % 2 === 0 ? '28px' : '-28px'
}));

const SnowParticles: React.FC = () => {
    return (
        <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
        >
            <style>{`
                @keyframes wedding-snow-fall {
                    from {
                        transform: translate3d(0, -12px, 0);
                    }
                    to {
                        transform: translate3d(
                            var(--snow-drift),
                            calc(100% + 12px),
                            0
                        );
                    }
                }

                .wedding-snow-track {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    animation-name: wedding-snow-fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }

                .wedding-snow-dot {
                    display: block;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow:
                        0 0 3px rgba(150, 170, 190, 0.45),
                        0 0 7px rgba(255, 255, 255, 0.5);
                }

                @media (prefers-reduced-motion: reduce) {
                    .wedding-snow-track {
                        display: none;
                    }
                }
            `}</style>

            {snowflakes.map((snowflake, index) => (
                <div
                    key={index}
                    className="wedding-snow-track"
                    style={{
                        left: snowflake.left,
                        opacity: snowflake.opacity,
                        animationDuration: `${snowflake.duration}s`,
                        animationDelay: `${snowflake.delay}s`,
                        '--snow-drift': snowflake.drift
                    } as React.CSSProperties}
                >
                    <span
                        className="wedding-snow-dot"
                        style={{
                            width: snowflake.size,
                            height: snowflake.size
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default SnowParticles;