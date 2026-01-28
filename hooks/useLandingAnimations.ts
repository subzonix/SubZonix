"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function useLandingAnimations() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Text Reveal Animation for Headings
        const headings = gsap.utils.toArray<HTMLElement>(".gsap-fade-up");
        headings.forEach((heading) => {
            gsap.from(heading, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: heading,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                },
            });
        });

        // Staggered Cards Animation
        const cards = gsap.utils.toArray<HTMLElement>(".gsap-stagger-card");
        if (cards.length > 0) {
            gsap.from(cards, {
                y: 100,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: cards[0], // Trigger when the first card comes into view
                    start: "top 80%",
                    toggleActions: "play none none reverse",
                },
            });
        }

        // Hero Parallax or specific hero animations can go here
        const heroText = document.querySelector(".gsap-hero-text");
        if (heroText) {
            gsap.from(heroText.children, {
                y: 100,
                opacity: 0,
                duration: 1.2,
                stagger: 0.2,
                ease: "power4.out",
                delay: 0.5,
            });
        }

    }, { scope: containerRef });

    return containerRef;
}
