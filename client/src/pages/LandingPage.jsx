import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { motion } from "framer-motion";

export default function LandingPage() {
  const canvasRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3);
    scene.add(camera);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 1);
    point.position.set(5, 5, 5);
    scene.add(point);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.2,
      metalness: 0.7,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

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
    <div className="bg-gradient-to-b from-indigo-600 to-purple-500 text-white">
      {/* Hero section */}
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center">
        <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center gap-6">
          <motion.h1
            className="text-4xl font-extrabold"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Project Management Tool
          </motion.h1>
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
        </div>

        {/* 3D Cube Canvas */}
        <div className="w-full lg:w-1/2 flex justify-center items-center p-10">
          <div className="w-full max-w-md aspect-square">
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-xl shadow-2xl bg-white/5"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center py-4">
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="py-16 px-8 bg-white text-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Fast Collaboration</h3>
            <p>Work in real-time with your team across tasks and deadlines without delays.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Intuitive Design</h3>
            <p>Minimal and clean user interface built for efficiency and ease of use.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p>Monitor the health of your projects with stats and timely notifications.</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 px-8 bg-indigo-50 text-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <p>“This tool changed the way our team collaborates. Smooth, simple, and powerful.”</p>
            <p className="mt-4 font-semibold">— Aryan M., Frontend Lead</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <p>“I’ve tried many project managers, but this one hits the sweet spot of features and ease.”</p>
            <p className="mt-4 font-semibold">— Sneha D., Product Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
