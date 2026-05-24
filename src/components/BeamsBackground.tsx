"use client";

import Beams from "@/components/Beams";

export default function BeamsBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="h-full w-full opacity-80">
        <Beams
          beamWidth={3}
          beamHeight={30}
          beamNumber={20}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={30}
        />
      </div>
    </div>
  );
}
