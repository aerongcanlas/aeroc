'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const SCROLL_IDLE_MS = 700;
const MIN_THUMB_SIZE = 48;

function getMetrics() {
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = Math.max(documentHeight - viewportHeight, 0);
    const thumbHeight =
        documentHeight <= 0
            ? viewportHeight
            : Math.max(
                  (viewportHeight / documentHeight) * viewportHeight,
                  MIN_THUMB_SIZE,
              );
    const maxThumbOffset = Math.max(viewportHeight - thumbHeight, 0);
    const thumbTop =
        maxScroll === 0 ? 0 : (scrollTop / maxScroll) * maxThumbOffset;

    return {
        documentHeight,
        maxScroll,
        thumbHeight,
        thumbTop,
        viewportHeight,
    };
}

export function Scrollbar() {
    const [metrics, setMetrics] = useState(() => ({
        documentHeight: 0,
        maxScroll: 0,
        thumbHeight: 0,
        thumbTop: 0,
        viewportHeight: 0,
    }));
    const [isScrolling, setIsScrolling] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef(0);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const update = () => setMetrics(getMetrics());
        const markScrolling = () => {
            setIsScrolling(true);
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
            idleTimerRef.current = setTimeout(
                () => setIsScrolling(false),
                SCROLL_IDLE_MS,
            );
        };

        update();

        const onScroll = () => {
            update();
            markScrolling();
        };

        const onResize = () => update();

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isDragging) {
            return;
        }

        const onPointerMove = (event: PointerEvent) => {
            const nextMetrics = getMetrics();
            const maxThumbOffset = Math.max(
                nextMetrics.viewportHeight - nextMetrics.thumbHeight,
                0,
            );
            const unclampedThumbTop = event.clientY - dragOffsetRef.current;
            const thumbTop = Math.min(
                Math.max(unclampedThumbTop, 0),
                maxThumbOffset,
            );
            const scrollRatio =
                maxThumbOffset === 0 ? 0 : thumbTop / maxThumbOffset;

            window.scrollTo({
                top: scrollRatio * nextMetrics.maxScroll,
                behavior: 'auto',
            });
        };

        const stopDragging = () => setIsDragging(false);

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', stopDragging);
        window.addEventListener('pointercancel', stopDragging);

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', stopDragging);
            window.removeEventListener('pointercancel', stopDragging);
        };
    }, [isDragging]);

    if (metrics.maxScroll <= 0 || metrics.viewportHeight <= 0) {
        return null;
    }

    const expanded = isScrolling || isHovered || isDragging;

    return (
        <div
            aria-hidden='true'
            className='pointer-events-none fixed inset-y-0 right-0 z-[70] flex w-5 justify-end pr-1'>
            <div
                className='pointer-events-auto relative h-full w-full'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}>
                <div
                    className={cn(
                        'absolute right-0 top-2 bottom-2 rounded-full bg-black/0 transition-all duration-200',
                        expanded ? 'w-2.5 bg-black/10 dark:bg-white/10' : 'w-1',
                    )}
                />
                <button
                    type='button'
                    tabIndex={-1}
                    aria-hidden='true'
                    className={cn(
                        'absolute right-0 rounded-full border border-white/20 bg-white/55 shadow-[0_0_10px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-all duration-200 dark:border-white/10 dark:bg-white/30',
                        expanded ? 'w-2.5' : 'w-1',
                    )}
                    style={{
                        height: `${metrics.thumbHeight}px`,
                        transform: `translateY(${metrics.thumbTop}px)`,
                    }}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        dragOffsetRef.current =
                            event.clientY - metrics.thumbTop;
                        setIsDragging(true);
                        setIsScrolling(true);
                    }}
                />
            </div>
        </div>
    );
}
