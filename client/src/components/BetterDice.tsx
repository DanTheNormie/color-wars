import { useLayoutEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useDicePhysics, type DiceMode } from "@/hooks/useDicePhysics";
import styles from "@components/Dice.module.css";

export interface DiceController {
  startPhysicsLoop: (id: string) => void;
  setMode: (mode: DiceMode, payload?: { face: number }) => void;
  animationRef: React.MutableRefObject<number | null>;
}

const BetterDice = forwardRef<DiceController, {}>((_, ref) => {
  const dice = useDicePhysics();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    startPhysicsLoop: dice.startPhysicsLoop,
    setMode: dice.setMode,
    animationRef: dice.animationRef,
  }));

  const transform = dice.quat.toCSSMatrix();

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const parent = el.parentElement ?? el;
      const size = Math.round(parent.getBoundingClientRect().height * 0.6);
      if (el.firstChild) {
        (el.firstChild as HTMLElement).style.setProperty("--dice-side", `${size}px`);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className={styles.diceWrap}>
      <div className={styles.dice} style={{ transform }}>
        <div className={`${styles.diceFace} ${styles.face1}`}></div>
        <div className={`${styles.diceFace} ${styles.face2}`}></div>
        <div className={`${styles.diceFace} ${styles.face3}`}></div>
        <div className={`${styles.diceFace} ${styles.face4}`}></div>
        <div className={`${styles.diceFace} ${styles.face5}`}></div>
        <div className={`${styles.diceFace} ${styles.face6}`}></div>
      </div>
    </div>
  );
});

BetterDice.displayName = "BetterDice";

export default BetterDice;
