import { useEffect, useRef } from 'react'

interface Bubble {
    x: number
    y: number
    radius: number
    opacity: number
    vx: number
    vy: number
    color: string
    life: number
    maxLife: number
}

// Colors matching the website's primary palette (#d85a74 rose/pink family)
const BUBBLE_COLORS = [
    'rgba(216, 90, 116, OPACITY)',   // primary #d85a74
    'rgba(244, 114, 182, OPACITY)',  // pink-400
    'rgba(251, 113, 133, OPACITY)',  // rose-400
    'rgba(236, 72, 153, OPACITY)',   // pink-500
    'rgba(190, 65, 100, OPACITY)',   // darker primary
    'rgba(255, 143, 163, OPACITY)',  // light rose
    'rgba(249, 168, 212, OPACITY)',  // pink-300
]

export default function BubbleCursor() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bubblesRef = useRef<Bubble[]>([])
    const animRef = useRef<number>(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        let spawnCounter = 0

        const onMouseMove = (e: MouseEvent) => {
            spawnCounter++
            // Spawn a bubble every 4th mousemove for a subtle, professional feel
            if (spawnCounter % 4 !== 0) return

            const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
            const radius = 3 + Math.random() * 7   // smaller: 3–10px
            const maxLife = 45 + Math.random() * 30 // shorter life (~0.75–1.25s at 60fps)

            bubblesRef.current.push({
                x: e.clientX + (Math.random() - 0.5) * 10,
                y: e.clientY + (Math.random() - 0.5) * 10,
                radius,
                opacity: 0.15 + Math.random() * 0.15,  // very subtle: 0.15–0.30
                vx: (Math.random() - 0.5) * 0.8,
                vy: -0.5 - Math.random() * 0.8,
                color,
                life: 0,
                maxLife,
            })

            // Cap total bubbles to keep it clean
            if (bubblesRef.current.length > 20) {
                bubblesRef.current = bubblesRef.current.slice(-18)
            }
        }

        window.addEventListener('mousemove', onMouseMove)

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            bubblesRef.current = bubblesRef.current.filter((b) => {
                b.life++
                if (b.life > b.maxLife) return false

                b.x += b.vx
                b.y += b.vy
                b.vx *= 0.99
                b.vy *= 0.995

                const progress = b.life / b.maxLife
                const currentOpacity = b.opacity * (1 - progress)
                const currentRadius = b.radius * (1 - progress * 0.3)

                const colorWithOpacity = b.color.replace('OPACITY', currentOpacity.toFixed(3))

                ctx.beginPath()
                ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2)
                ctx.fillStyle = colorWithOpacity
                ctx.fill()

                // Add subtle inner glow
                const gradient = ctx.createRadialGradient(
                    b.x - currentRadius * 0.3,
                    b.y - currentRadius * 0.3,
                    0,
                    b.x,
                    b.y,
                    currentRadius
                )
                gradient.addColorStop(0, b.color.replace('OPACITY', (currentOpacity * 0.6).toFixed(3)))
                gradient.addColorStop(1, b.color.replace('OPACITY', '0'))
                ctx.beginPath()
                ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2)
                ctx.fillStyle = gradient
                ctx.fill()

                return true
            })

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', onMouseMove)
            cancelAnimationFrame(animRef.current)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="bubble-cursor-canvas"
            aria-hidden="true"
        />
    )
}
