import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

export default function LandingPage() {
  const canvasRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // === three.js setup ===
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3);
    scene.add(camera);

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 1);
    point.position.set(5, 5, 5);
    scene.add(point);

    // Rotating cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.2,
      metalness: 0.7,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Resize handling
    const onResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let frameId;
    const animate = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center bg-gradient-to-r from-indigo-600 to-purple-500 text-white">
      {/* Left content */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center gap-6">
        <h1 className="text-4xl font-extrabold">
          Project Management Tool
        </h1>
        <p className="text-lg max-w-prose">
          Organize your work, track tasks, and collaborate effortlessly. Build, manage, and deliver with clarity and speed.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded shadow hover:shadow-lg transition"
          >
            Register
          </button>
          <button
            onClick={() => navigate("/login")}
            className="border border-white font-semibold px-6 py-3 rounded hover:bg-white hover:text-indigo-600 transition"
          >
            Login
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm">
            Trusted by developers and teams to keep projects on track. Fast setup, real-time insights, and simple collaboration.
          </p>
        </div>
      </div>

      {/* Right animation */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-md aspect-square">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl shadow-2xl bg-white/5"
          />
        </div>
      </div>
    </div>
  );
}
