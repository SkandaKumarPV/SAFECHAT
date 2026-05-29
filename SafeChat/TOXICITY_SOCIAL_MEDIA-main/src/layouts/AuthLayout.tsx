import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[350px]"
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
