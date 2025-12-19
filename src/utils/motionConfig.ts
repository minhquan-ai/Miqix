/**
 * Motion configuration utilities for Framer Motion
 * Includes accessibility support and common animation variants
 */

/**
 * Check if user prefers reduced motion
 * Respects accessibility preferences
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation configuration based on user preferences
 */
export const getAnimationConfig = () => ({
    duration: prefersReducedMotion() ? 0 : 0.2,
    ease: [0.25, 0.46, 0.45, 0.94] // Optimized easing for smooth 60fps
});

/**
 * Common animation variants
 */

// Fade in from bottom
export const fadeInUp = {
    hidden: {
        opacity: 0,
        y: 16,
        scale: 0.98
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
};

// Fade in from top
export const fadeInDown = {
    hidden: {
        opacity: 0,
        y: -20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1] as const
        }
    }
};

// Scale and fade in
export const scaleIn = {
    hidden: {
        opacity: 0,
        scale: 0.96
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
};

// Stagger container for lists
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05
        }
    }
};

// Card hover animation config
export const cardHover = {
    y: -3,
    scale: 1.005,
    transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.5
    }
};

// Button press animation
export const buttonTap = {
    scale: 0.95,
    transition: {
        duration: 0.1
    }
};

// Icon animation (bounce)
export const iconBounce = {
    scale: [1, 1.3, 1],
    rotate: [0, -10, 10, 0],
    transition: {
        duration: 0.4,
        ease: "easeInOut"
    }
};

/**
 * Page transition variants
 */
export const pageTransition = {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 16 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }
};

/**
 * Spring animation config for natural feel
 */
export const springConfig = {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
    mass: 0.5
};

/**
 * Smooth animation config
 */
export const smoothConfig = {
    duration: 0.2,
    ease: [0.25, 0.46, 0.45, 0.94] as const
};
