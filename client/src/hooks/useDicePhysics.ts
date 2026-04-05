import { useRef, useState, useEffect } from "react";
import { Quaternion, Vector3 } from "@/lib/diceMath";
import { DiceRotationCalculator } from "../lib/rotationCalculator";
import { getRandomVertexAxis } from "@/lib/diceMath";
// import { FACE_NORMALS } from "@/lib/diceConfig";

// Helper to get which face is pointing up (closest to +Y axis)
// const getFaceFromQuaternion = (quat: Quaternion): number => {
//   const up = new Vector3(0, 1, 0);
//   const transformedUp = up.applyQuaternion(quat.clone().normalize());

//   let maxDot = -2;
//   let bestFace = 1;

//   for (const [face, normal] of Object.entries(FACE_NORMALS)) {
//     const dot = transformedUp.dot(normal);
//     if (dot > maxDot) {
//       maxDot = dot;
//       bestFace = Number(face);
//     }
//   }

//   return bestFace;
// };



export type DiceMode =
  | "idle"
  | "accelerate"
  | "ragdoll"
  | "auto-spin"
  | "spin-to-target"
  | "ragdoll";

const VELOCITY_CUTOFF_THRESHOLD = 0.0003;
const MAX_SPEED = 0.0435;
const ACCELERATION = MAX_SPEED * 0.002;
const ANIMATION_SPEED = 200;
//const CONTINUOUS_SPEED = 14500
const DECELERATION_RATE = 0.002;

export const useDicePhysics = () => {
  const [quat, setQuat] = useState(new Quaternion());
  const [rolledNumber] = useState<number | null>(null);

  const calculatorRef = useRef(new DiceRotationCalculator());
  const animationRef = useRef<number | null>(null);
  const debugRef = useRef({ loops: 0, cancels: 0 });
  const quatRef = useRef(new Quaternion());
  const onSettleRef = useRef<(() => void) | null>(null);

  const cancelLoop = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const isRunning = () => animationRef.current !== null;

  // INTERNAL STATE MACHINE
  const rollIdRef = useRef("");
  const isApiPending = useRef(false);

  const stateRef = useRef<{
    mode: DiceMode;
    targetFace: number | null;
  }>({
    mode: "idle",
    targetFace: null,
  });

  // ---------------------------------------------------
  // HIGH-LEVEL MODE SETTER (APP CONTROLS DICE)
  // ---------------------------------------------------
  const setMode = (mode: DiceMode, payload?: { face: number }) => {
    stateRef.current.mode = mode;

    if (mode === "auto-spin") {
      isApiPending.current = true;
      return;
    } else if (mode === "spin-to-target") {
      stateRef.current.targetFace = payload!.face;
      isApiPending.current = false;
      return;
    } else if (mode === "ragdoll") {
      isApiPending.current = false;
      return;
    }
  };

  // ---------------------------------------------------
  // START LOOP (App provides rollId)
  // ---------------------------------------------------

  const startPhysicsLoop = (rollId: string) => {
    rollIdRef.current = rollId;

    cancelLoop();

    //const rotationAxis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const rotationAxis = getRandomVertexAxis();

    let SPEED = 0;
    const first = Date.now()
    let last = first;
    let shouldContinue = true;

    // LOCAL SOURCE OF TRUTH (NOT REACT)
    let currentQuat = quatRef.current.clone();

    const loop = () => {
      if (rollIdRef.current !== rollId) return;
      if (!shouldContinue) return;

      const now = Date.now();
      const dt = now - last;
      last = now;

      const mode = stateRef.current.mode;

      // Debug logging for loop lifecycle - Step 0.1
      if (typeof window !== 'undefined' && (window as any).DEV) {
        debugRef.current.loops++;
        //console.log({ mode, rollId: rollIdRef.current, hasRunningLoop: animationRef.current != null });
        if (animationRef.current != null && debugRef.current.loops === 1) {
          // This would indicate a race condition - loop starting while animationRef already set
          console.warn('Race condition detected: new loop started while animationRef.current != null');
        }
      }

      // ACCELERATE
      if (mode === "accelerate") {
        // If spinning for over 10s, transition to 'ragdoll' mode
        if (now - first > 10000) {
          console.warn('no input for dice, resetting it')
          setMode("ragdoll");
          // Call onSettle callback on timeout
          onSettleRef.current?.();
        }
        SPEED = Math.min(SPEED + ACCELERATION * dt, MAX_SPEED);
      }

      // NATURAL DECEL
      else if (mode === "ragdoll") {
        // ✅ exact exponential decay (FPS independent)
        SPEED *= Math.exp(-DECELERATION_RATE * dt);
        if (SPEED < VELOCITY_CUTOFF_THRESHOLD) {
          animationRef.current = null;
          return;
        }
      }

      // FORCE MAX SPEED
      else if (mode === "auto-spin") {
        SPEED = MAX_SPEED;
      }

      // HANDOFF TO STEERING
      else if (mode === "spin-to-target") {
        if (SPEED == 0) SPEED = MAX_SPEED;
        const face = stateRef.current.targetFace!;
        shouldContinue = false;
        animationRef.current = null;

        // Face accuracy baseline logging - Step 0.2
        if (typeof window !== 'undefined' && (window as any).DEV) {
          // Compute actual face pointing up at the start of steering
          //const actualFace = getFaceFromQuaternion(currentQuat);
          //const hit = actualFace === face;
          //console.log({ expected: face, actual: actualFace, hit });
        }

        startSteering(face, SPEED, rotationAxis, currentQuat);
        return;
      }

      // INTEGRATE SPIN
      const angle = SPEED * dt;
      const inc = new Quaternion().setFromAxisAngle(rotationAxis, angle);
      currentQuat = inc.multiply(currentQuat);

      setQuat(currentQuat.clone());
      quatRef.current = currentQuat.clone();
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  const startSteering = (
    targetFace: number,
    initialSpeed: number,
    vertexAxis: Vector3,
    startQuat: Quaternion,
  ) => {
    cancelLoop();
    //console.log("targetFace", targetFace);

    const axis = vertexAxis.normalize();
    let omega = initialSpeed;

    const targetQuat = calculatorRef.current
      .calculateRotationToFace(startQuat, targetFace)
      .normalize();

    // --------------------------------------------------
    // 1. Exact analytic solution (FPS independent)
    // --------------------------------------------------
    const k = DECELERATION_RATE;
    const w0 = initialSpeed;
    const wCut = VELOCITY_CUTOFF_THRESHOLD;

    let tStop = 0;
    let thetaExact = 0;

    if (w0 > wCut) {
      tStop = Math.log(w0 / wCut) / k;
      thetaExact = (w0 / k) * (1 - Math.exp(-k * tStop));
    }

    // --------------------------------------------------
    // 2. Correct starting pose (no bias, exact)
    //    Q_start = R(-θ_exact) · Q_target
    // --------------------------------------------------
    const reverseRot = new Quaternion().setFromAxisAngle(axis, -thetaExact);

    let currentQuat = reverseRot.multiply(targetQuat).normalize();

    setQuat(currentQuat.clone());

    // --------------------------------------------------
    // 3. Normal forward ragdoll (unchanged runtime)
    // --------------------------------------------------
    let lastTime = Date.now();

    const inc = new Quaternion();
    const negK = -k;

    const step = () => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      const omegaPrev = omega;

      // ✅ exact exponential decay (FPS independent)
      omega *= Math.exp(negK * dt);

      // ✅ exact integrated angle for this frame
      const stepAngle = (omegaPrev / k) * (1 - Math.exp(negK * dt));

      inc.setFromAxisAngle(axis, stepAngle);

      currentQuat = inc.multiply(currentQuat).normalize();
      setQuat(currentQuat.clone());
      quatRef.current = currentQuat.clone();

      if (omega < wCut) {
        setQuat(targetQuat.clone());
        quatRef.current = targetQuat.clone();
        animationRef.current = null;
        // Call onSettle callback when settling naturally
        onSettleRef.current?.();
        return;
      }

      animationRef.current = requestAnimationFrame(step);
    };
    step();
  };

  // CONTROL PANEL COMMANDS
  const rotateToFace = (face: number) => {
    cancelLoop();
    const start = quat.clone();
    const end = calculatorRef.current.calculateRotationToFace(start, face);
    const startTime = Date.now();

    const duration = ANIMATION_SPEED;

    const animLoop = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const q = start.clone().slerp(end, t);
      setQuat(q);
      quatRef.current = q;

      if (t < 1) animationRef.current = requestAnimationFrame(animLoop);
    };

    animLoop();
  };

  const randomRotate = () => {
    cancelLoop();
    const start = quat.clone();
    const end = calculatorRef.current.generateRandomQuaternion();
    const startTime = Date.now();
    const duration = ANIMATION_SPEED * 1.5;

    const animLoop = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const q = start.clone().slerp(end, t);
      setQuat(q);
      quatRef.current = q;

      if (t < 1) animationRef.current = requestAnimationFrame(animLoop);
    };

    animLoop();
  };

  // CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    quat,
    rolledNumber,
    startPhysicsLoop,
    setMode,
    rotateToFace,
    randomRotate,

    isApiPending,
    setOnSettle: (fn: () => void) => {
      onSettleRef.current = fn;
    },
    isRunning,
  };
};
