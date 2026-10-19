"use client"

import { Button } from "~/components/ui/button"
import MoltenMetal from "~/components/MoltenMetal"

export default function Home() {
    return (
        <div className="relative min-h-svh overflow-hidden">
            {/* Molten Metal background */}
            <div className="absolute inset-0 z-0">
                <MoltenMetal
                    color1="#5227FF"
                    color2="#FF9FFC"
                    color3="#FFFFFF"
                    speed={0.35}
                    scale={4}
                    detail={3}
                    glow={1.6}
                    coreSize={0.1}
                    swirl={1}
                    fold={-0.2}
                    blackPoint={0.05}
                    brightness={1.3}
                    colorMode="molten"
                    grain={true}
                    grainIntensity={0.05}
                    mouseInteraction={true}
                    mouseStrength={0.3}
                    opacity={1.0}
                />
            </div>

            {/* Page content */}
            <div className="relative z-10 flex min-h-svh p-6">
                <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
                    <div>
                        <h1 className="font-medium">Project ready!</h1>
                        <p>You may now add components and start building.</p>
                        <p>We&apos;ve already added the button component for you.</p>
                        <Button className="mt-2">Button</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
