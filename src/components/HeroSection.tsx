"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroSection.module.css";

const PLAYER_UUID = "d5a391fb-c1cd-4385-868b-5e8a28aa1ccf";
const CW = 400;
const CH = 600;
// Must match --cream: #fff6dc from styles.css so canvas blends seamlessly
const CREAM = 0xfff6dc;

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    import("skinview3d").then((sv3d) => {
      const viewer = new sv3d.SkinViewer({ canvas, width: CW, height: CH });

      viewer.renderer.setClearColor(CREAM, 1);

      // Center at y≈10 (character body center), close enough to fill canvas
      viewer.camera.position.set(0, 10, 28);
      viewer.camera.lookAt(0, 10, 0);
      viewer.camera.fov = 60;
      viewer.camera.updateProjectionMatrix();

      // Slight Y rotation so the face is visible (Minecraft character faces -Z)
      viewer.playerObject.rotation.y = Math.PI / 14;

      // Waving animation via FunctionAnimation
      const wave = new sv3d.FunctionAnimation((player: any, ctx: any) => {
        const t = ctx.elapsed;
        // Wave right arm up-and-down with outward angle
        player.skin.rightArm.rotation.x = -(Math.PI / 3.5) + Math.sin(t * 3.5) * 0.45;
        player.skin.rightArm.rotation.z =  (Math.PI / 5)   + Math.sin(t * 3.5) * 0.18;
        // Subtle body sway
        player.skin.body.rotation.z = Math.sin(t * 1.8) * 0.022;
        // Subtle head turn
        player.skin.head.rotation.y = Math.sin(t * 1.3) * 0.09;
      });
      viewer.animation = wave;

      viewer.loadSkin(`https://mc-heads.net/skin/${PLAYER_UUID}`).catch(console.error);
      viewerRef.current = viewer;
    }).catch(console.error);

    return () => {
      viewerRef.current?.dispose();
    };
  }, []);

  return (
    <section className={styles.hero}>
      {/* Ghost "WE BUILD BOLD" headline behind the character */}
      <div className={styles.ghostText} aria-hidden="true">
        <span>WE BUILD</span>
        <span>BOLD</span>
      </div>

      {/* Character + speech bubble */}
      <div className={styles.stage}>
        <div className={styles.bubbleWrap}>
          <div className={styles.bubble}>
            <p>HI!!&nbsp; Welcome to our <strong>BURHANDEV</strong> site.</p>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className={styles.characterCanvas}
          width={CW}
          height={CH}
        />
      </div>

      {/* Red ground strip */}
      <div className={styles.ground} />
    </section>
  );
}
